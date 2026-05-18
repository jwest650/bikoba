import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { JwtService } from '@nestjs/jwt';
import { Role, type Session, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { Queue } from 'bullmq';
import { randomBytes, randomUUID } from 'crypto';
import { UAParser } from 'ua-parser-js';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_SMS } from '../queue/queue.constants';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailVerificationService } from './email-verification.service';
import type {
  AccessTokenPayload,
  AuthenticatedUser,
  RefreshTokenPayload,
} from './types/jwt-payload';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

interface DeviceMeta {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTtl: string;
  private readonly refreshTtl: string;
  private readonly refreshTtlMs: number;
  private readonly saltRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailVerification: EmailVerificationService,
    @InjectQueue(QUEUE_SMS) private readonly smsQueue: Queue,
    config: ConfigService,
  ) {
    this.accessTtl = config.get<string>('JWT_ACCESS_TTL', '15m');
    this.refreshTtl = config.get<string>('JWT_REFRESH_TTL', '7d');
    this.refreshTtlMs = parseDurationMs(this.refreshTtl);
    this.saltRounds = Number(config.get<string>('BCRYPT_SALT_ROUNDS', '12'));
  }

  async register(dto: RegisterDto, device: DeviceMeta): Promise<AuthResponse> {
    if (dto.role === Role.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot self-register');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        role: dto.role ?? Role.BUYER,
      },
    });

    await this.emailVerification.issueAndSend(user.id, user.email);
    return this.issueSession(user, device);
  }

  async login(dto: LoginDto, device: DeviceMeta): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check BEFORE issuing the new session so it doesn't match itself.
    const fingerprint = computeFingerprint(device.userAgent);
    const isKnownDevice = await this.isKnownDevice(user.id, fingerprint);

    const response = await this.issueSession(user, device);

    if (
      !isKnownDevice &&
      user.phoneNumber &&
      user.phoneVerifiedAt
    ) {
      try {
        await this.smsQueue.add('new-device-login', { to: user.phoneNumber });
      } catch (err) {
        this.logger.warn(
          `Failed to enqueue new-device-login SMS: ${(err as Error).message}`,
        );
      }
    }

    return response;
  }

  private async isKnownDevice(
    userId: string,
    fingerprint: string | null,
  ): Promise<boolean> {
    // If we can't fingerprint the request, treat it as known to avoid noise.
    if (!fingerprint) return true;
    const match = await this.prisma.session.findFirst({
      where: { userId, deviceFingerprint: fingerprint },
      select: { id: true },
    });
    return match !== null;
  }

  async refresh(
    userId: string,
    sessionId: string,
    presentedRefreshToken: string,
    device: DeviceMeta,
  ): Promise<AuthTokens> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (
      !session ||
      session.userId !== userId ||
      session.revokedAt !== null ||
      session.expiresAt.getTime() <= Date.now() ||
      !session.user.isActive
    ) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    const matches = await bcrypt.compare(
      presentedRefreshToken,
      session.refreshTokenHash,
    );
    if (!matches) {
      // Token reuse — revoke all sessions for this user as a precaution.
      await this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return this.rotateSession(session, session.user, device);
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Change the caller's password. Verifies the current password, rehashes the
   * new one, and revokes every active session so existing tokens can't be
   * used after the change. Returns a fresh token pair for the calling device.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    device: DeviceMeta,
  ): Promise<AuthTokens> {
    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException(
        'New password must differ from current password',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer has access');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.saltRounds);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    // Notify by SMS if a verified phone is on file.
    if (user.phoneNumber && user.phoneVerifiedAt) {
      try {
        await this.smsQueue.add('password-changed', { to: user.phoneNumber });
      } catch (err) {
        this.logger.warn(
          `Failed to enqueue password-changed SMS: ${(err as Error).message}`,
        );
      }
    }

    const { tokens } = await this.issueSession(user, device);
    return tokens;
  }

  private async issueSession(
    user: User,
    device: DeviceMeta,
  ): Promise<AuthResponse> {
    const sessionId = randomUUID();
    const refreshToken = await this.signRefreshToken(user.id, sessionId);
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.saltRounds);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        userAgent: device.userAgent,
        ipAddress: device.ipAddress,
        deviceFingerprint: computeFingerprint(device.userAgent),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });

    const accessToken = await this.signAccessToken(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: parseDurationMs(this.accessTtl) / 1000,
      },
    };
  }

  private async rotateSession(
    session: Session,
    user: User,
    device: DeviceMeta,
  ): Promise<AuthTokens> {
    const refreshToken = await this.signRefreshToken(user.id, session.id);
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.saltRounds);

    const userAgent = device.userAgent ?? session.userAgent;
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash,
        userAgent,
        ipAddress: device.ipAddress ?? session.ipAddress,
        deviceFingerprint: computeFingerprint(userAgent),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });

    const accessToken = await this.signAccessToken(user);
    return {
      accessToken,
      refreshToken,
      expiresIn: parseDurationMs(this.accessTtl) / 1000,
    };
  }

  private signAccessToken(user: User): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.signAsync(payload, {
      expiresIn: this.accessTtl as unknown as number,
    });
  }

  private signRefreshToken(userId: string, sessionId: string): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
      sid: sessionId,
    };
    // jti differentiates two rotations within the same second.
    return this.jwt.signAsync(payload, {
      expiresIn: this.refreshTtl as unknown as number,
      secret: process.env.JWT_REFRESH_SECRET,
      jwtid: randomBytes(16).toString('hex'),
    });
  }
}

/**
 * Coarse device fingerprint: browser family + OS family + device type.
 * Omits version numbers so Chrome auto-updates don't trigger false-positive
 * "new device" alerts. Returns null when the UA can't be parsed.
 */
function computeFingerprint(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const result = UAParser(userAgent);
  const browser = result.browser.name ?? 'unknown-browser';
  const os = result.os.name ?? 'unknown-os';
  const device = result.device.type ?? 'desktop';
  return `${browser}|${os}|${device}`;
}

function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber * 1000;
    throw new Error(`Invalid duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * multipliers[unit];
}
