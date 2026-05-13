import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailVerificationService {
  private readonly ttlMs: number;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    const ttlHours = Number(
      config.get<string>('EMAIL_VERIFICATION_TTL_HOURS', '24'),
    );
    this.ttlMs = ttlHours * 60 * 60 * 1000;
    this.appUrl = config.get<string>('APP_URL', 'http://localhost:3000');
  }

  async issueAndSend(userId: string, email: string): Promise<void> {
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);

    // Invalidate any prior unused tokens — only the latest link works.
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + this.ttlMs),
      },
    });

    const link = `${this.appUrl}/auth/verify-email?token=${rawToken}`;
    await this.mail.sendEmailVerification(email, link);
  }

  async verify(rawToken: string): Promise<{ userId: string; email: string }> {
    if (!rawToken || rawToken.length < 16) {
      throw new BadRequestException('Invalid verification token');
    }
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.usedAt !== null) {
      throw new NotFoundException('Verification link is invalid or already used');
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Verification link has expired');
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true, emailVerifiedAt: now },
      }),
    ]);

    return { userId: record.userId, email: record.user.email };
  }

  async resend(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isEmailVerified: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }
    await this.issueAndSend(user.id, user.email);
  }
}

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
