import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpPurpose, type OtpToken } from '@prisma/client';
import { createHash, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SmsService } from './sms.service';

export interface IssueOptions {
  phoneNumber: string;
  purpose: OtpPurpose;
  userId?: string;
}

export interface VerifyOptions {
  phoneNumber: string;
  code: string;
  purpose: OtpPurpose;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly ttlMs: number;
  private readonly maxAttempts: number;
  private readonly hourlyLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
    private readonly cache: RedisService,
    config: ConfigService,
  ) {
    this.ttlMs =
      asPositiveInt(config.get<string>('OTP_TTL_MINUTES'), 5) * 60 * 1000;
    this.maxAttempts = asPositiveInt(
      config.get<string>('OTP_MAX_ATTEMPTS'),
      5,
    );
    this.hourlyLimit = asPositiveInt(
      config.get<string>('OTP_RATE_LIMIT_PER_HOUR'),
      3,
    );
  }

  /**
   * Generate a 6-digit code, store its hash, and SMS it. Throws if the per-phone
   * rate limit has been hit. Returns nothing — the raw code never leaves this
   * method except via SMS.
   */
  async issueAndSend(opts: IssueOptions): Promise<void> {
    await this.consumeRateLimit(opts.phoneNumber);

    // Invalidate any prior unused codes for this (phone, purpose).
    await this.prisma.otpToken.updateMany({
      where: {
        phoneNumber: opts.phoneNumber,
        purpose: opts.purpose,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const tokenHash = hashCode(code, opts.phoneNumber);

    await this.prisma.otpToken.create({
      data: {
        phoneNumber: opts.phoneNumber,
        userId: opts.userId,
        tokenHash,
        purpose: opts.purpose,
        expiresAt: new Date(Date.now() + this.ttlMs),
      },
    });

    try {
      await this.sms.sendOtp(opts.phoneNumber, code);
    } catch (err) {
      this.logger.warn(
        `OTP SMS failed for ${opts.phoneNumber}: ${(err as Error).message}`,
      );
      // The token still exists — the user can ask for a resend.
    }
  }

  async verify(opts: VerifyOptions): Promise<OtpToken> {
    const tokenHash = hashCode(opts.code, opts.phoneNumber);
    const token = await this.prisma.otpToken.findFirst({
      where: {
        phoneNumber: opts.phoneNumber,
        purpose: opts.purpose,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      throw new BadRequestException('No active code for this phone number');
    }
    if (token.expiresAt.getTime() <= Date.now()) {
      await this.prisma.otpToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });
      throw new UnauthorizedException('Code has expired');
    }
    if (token.tokenHash !== tokenHash) {
      const attempts = token.attempts + 1;
      const remaining = this.maxAttempts - attempts;
      await this.prisma.otpToken.update({
        where: { id: token.id },
        data: {
          attempts,
          usedAt: remaining <= 0 ? new Date() : null,
        },
      });
      if (remaining <= 0) {
        throw new UnauthorizedException(
          'Too many incorrect attempts. Request a new code.',
        );
      }
      throw new UnauthorizedException(
        `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      );
    }

    return this.prisma.otpToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });
  }

  private async consumeRateLimit(phoneNumber: string): Promise<void> {
    const key = `otp:rate:${phoneNumber}`;
    const sent = await this.cache.incrWithTtl(key, 3600);
    if (sent > this.hourlyLimit) {
      throw new HttpException(
        `Too many OTP requests for ${phoneNumber}. Try again in an hour.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

function hashCode(code: string, phoneNumber: string): string {
  // Bind to phoneNumber so the hash doesn't collide across recipients —
  // 6-digit codes have only 1M possibilities.
  return createHash('sha256')
    .update(`${phoneNumber}:${code}`)
    .digest('hex');
}

function asPositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
