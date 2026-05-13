import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, type Session, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
  private readonly accessTtl: string;
  private readonly refreshTtl: string;
  private readonly refreshTtlMs: number;
  private readonly saltRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
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
    return this.issueSession(user, device);
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
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });

    const accessToken = await this.signAccessToken(user);
    return {
      user: { id: user.id, email: user.email, role: user.role },
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

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash,
        userAgent: device.userAgent ?? session.userAgent,
        ipAddress: device.ipAddress ?? session.ipAddress,
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
