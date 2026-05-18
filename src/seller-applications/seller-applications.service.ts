import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  Role,
  SellerApplicationStatus,
  type SellerApplication,
  type Prisma,
} from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_EMAIL, QUEUE_SMS } from '../queue/queue.constants';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { SubmitApplicationDto } from './dto/submit-application.dto';

export interface ListApplicationsQuery {
  status?: SellerApplicationStatus;
  take?: number;
  skip?: number;
}

@Injectable()
export class SellerApplicationsService {
  private readonly logger = new Logger(SellerApplicationsService.name);
  private readonly verificationTtlMonths: number;
  private readonly reminderOffsetDays: number[];

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_SMS) private readonly smsQueue: Queue,
    config: ConfigService,
  ) {
    const ttlRaw = Number(config.get<string>('KYC_VERIFICATION_TTL_MONTHS'));
    this.verificationTtlMonths =
      Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : 12;
    this.reminderOffsetDays = parseOffsets(
      config.get<string>('KYC_REMINDER_OFFSET_DAYS') ?? '30,7,1',
    );
  }

  async submit(
    dto: SubmitApplicationDto,
    caller: AuthenticatedUser,
  ): Promise<SellerApplication> {
    if (caller.role !== Role.BUYER) {
      throw new BadRequestException(
        'Only BUYER accounts can apply to become sellers',
      );
    }

    const existing = await this.prisma.sellerApplication.findUnique({
      where: { userId: caller.id },
    });

    if (existing && existing.status === SellerApplicationStatus.PENDING) {
      throw new ConflictException('Your application is already under review');
    }
    if (existing && existing.status === SellerApplicationStatus.APPROVED) {
      throw new ConflictException('Your seller application is already approved');
    }

    const fields = {
      fullName: dto.fullName,
      phone: dto.phone,
      ghanaCardNumber: dto.ghanaCardNumber,
      ghanaCardFront: dto.ghanaCardFront,
      ghanaCardBack: dto.ghanaCardBack,
      selfieUrl: dto.selfieUrl,
    };

    if (existing) {
      return this.prisma.sellerApplication.update({
        where: { id: existing.id },
        data: {
          ...fields,
          status: SellerApplicationStatus.PENDING,
          rejectionReason: null,
          reviewer: { disconnect: true },
          reviewedAt: null,
          approvedAt: null,
          expiresAt: null,
          lastReminderAt: null,
        },
      });
    }
    return this.prisma.sellerApplication.create({
      data: {
        ...fields,
        user: { connect: { id: caller.id } },
      },
    });
  }

  async cancel(caller: AuthenticatedUser): Promise<SellerApplication> {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { userId: caller.id },
    });
    if (!application) {
      throw new NotFoundException('You have no application to cancel');
    }
    if (application.status !== SellerApplicationStatus.PENDING) {
      throw new ConflictException(
        `Cannot cancel a ${application.status.toLowerCase()} application`,
      );
    }
    return this.prisma.sellerApplication.update({
      where: { id: application.id },
      data: { status: SellerApplicationStatus.CANCELLED },
    });
  }

  async findMine(caller: AuthenticatedUser): Promise<SellerApplication | null> {
    return this.prisma.sellerApplication.findUnique({
      where: { userId: caller.id },
    });
  }

  findAll(query: ListApplicationsQuery): Promise<SellerApplication[]> {
    const where: Prisma.SellerApplicationWhereInput = {};
    if (query.status) where.status = query.status;
    return this.prisma.sellerApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: clamp(query.take, 1, 100, 20),
      skip: Math.max(0, query.skip ?? 0),
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } },
        reviewer: { select: { id: true, fullName: true } },
      },
    });
  }

  async findOne(id: string): Promise<SellerApplication> {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } },
        reviewer: { select: { id: true, fullName: true } },
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async approve(
    id: string,
    admin: AuthenticatedUser,
  ): Promise<SellerApplication> {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true, phoneNumber: true, phoneVerifiedAt: true },
        },
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status !== SellerApplicationStatus.PENDING) {
      throw new ConflictException(
        `Application is already ${application.status.toLowerCase()}`,
      );
    }

    const now = new Date();
    const expiresAt = addMonths(now, this.verificationTtlMonths);

    const [updated] = await this.prisma.$transaction([
      this.prisma.sellerApplication.update({
        where: { id },
        data: {
          status: SellerApplicationStatus.APPROVED,
          rejectionReason: null,
          reviewedById: admin.id,
          reviewedAt: now,
          approvedAt: now,
          expiresAt,
          lastReminderAt: null,
        },
      }),
      this.prisma.user.update({
        where: { id: application.userId },
        data: { role: Role.SELLER },
      }),
    ]);

    await this.enqueueEmail('application-approved', {
      to: application.user.email,
      fullName: application.fullName,
    });
    await this.enqueueSmsIfPhoneVerified(application.user, 'kyc-approved', {});

    return updated;
  }

  async reject(
    id: string,
    dto: RejectApplicationDto,
    admin: AuthenticatedUser,
  ): Promise<SellerApplication> {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true, phoneNumber: true, phoneVerifiedAt: true },
        },
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status !== SellerApplicationStatus.PENDING) {
      throw new ConflictException(
        `Application is already ${application.status.toLowerCase()}`,
      );
    }
    const updated = await this.prisma.sellerApplication.update({
      where: { id },
      data: {
        status: SellerApplicationStatus.REJECTED,
        rejectionReason: dto.reason,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    await this.enqueueEmail('application-rejected', {
      to: application.user.email,
      fullName: application.fullName,
      reason: dto.reason,
    });
    await this.enqueueSmsIfPhoneVerified(application.user, 'kyc-rejected', {
      reason: dto.reason,
    });

    return updated;
  }

  /**
   * Sweep approved applications past their expiry: move to EXPIRED, demote the
   * user back to BUYER, deactivate every store they own, and queue a reminder
   * email. Idempotent — only acts on APPROVED rows.
   */
  async expireDueApplications(): Promise<{ expired: number }> {
    const due = await this.prisma.sellerApplication.findMany({
      where: {
        status: SellerApplicationStatus.APPROVED,
        expiresAt: { lte: new Date() },
      },
      include: {
        user: {
          select: { email: true, phoneNumber: true, phoneVerifiedAt: true },
        },
      },
    });

    for (const app of due) {
      try {
        await this.prisma.$transaction([
          this.prisma.sellerApplication.update({
            where: { id: app.id },
            data: { status: SellerApplicationStatus.EXPIRED },
          }),
          this.prisma.user.update({
            where: { id: app.userId },
            data: { role: Role.BUYER },
          }),
          this.prisma.store.updateMany({
            where: { ownerId: app.userId, isActive: true },
            data: { isActive: false },
          }),
        ]);

        await this.enqueueEmail('kyc-expired', {
          to: app.user.email,
          fullName: app.fullName,
        });
        await this.enqueueSmsIfPhoneVerified(app.user, 'kyc-expired', {});
      } catch (err) {
        this.logger.error(
          `Failed to expire application ${app.id}: ${(err as Error).message}`,
        );
      }
    }

    return { expired: due.length };
  }

  /**
   * Daily reminder sweep. For each configured offset (largest first), find
   * approved applications whose expiry falls within that window and that
   * haven't already been reminded at or past the matching milestone. Sends
   * one email per app per sweep, updating lastReminderAt to dedupe.
   */
  async sendDueReminders(): Promise<{ sent: number }> {
    if (this.reminderOffsetDays.length === 0) {
      return { sent: 0 };
    }

    const now = new Date();
    const sortedOffsets = [...this.reminderOffsetDays].sort((a, b) => b - a);
    const maxOffsetMs = sortedOffsets[0] * DAY_MS;

    const candidates = await this.prisma.sellerApplication.findMany({
      where: {
        status: SellerApplicationStatus.APPROVED,
        expiresAt: {
          gt: now,
          lte: new Date(now.getTime() + maxOffsetMs),
        },
      },
      include: {
        user: {
          select: { email: true, phoneNumber: true, phoneVerifiedAt: true },
        },
      },
    });

    let sent = 0;
    for (const app of candidates) {
      if (!app.expiresAt) continue;
      const offsetDays = matchOffset(
        sortedOffsets,
        now,
        app.expiresAt,
        app.lastReminderAt,
      );
      if (offsetDays === null) continue;

      const daysUntilExpiry = Math.max(
        1,
        Math.ceil((app.expiresAt.getTime() - now.getTime()) / DAY_MS),
      );

      try {
        await this.prisma.sellerApplication.update({
          where: { id: app.id },
          data: { lastReminderAt: now },
        });
        await this.enqueueEmail('kyc-expiry-reminder', {
          to: app.user.email,
          fullName: app.fullName,
          daysUntilExpiry,
        });
        await this.enqueueSmsIfPhoneVerified(app.user, 'kyc-expiry-reminder', {
          daysUntilExpiry,
        });
        sent++;
      } catch (err) {
        this.logger.error(
          `Failed to send reminder for application ${app.id}: ${(err as Error).message}`,
        );
      }
    }

    return { sent };
  }

  private async enqueueEmail(
    name:
      | 'application-approved'
      | 'application-rejected'
      | 'kyc-expired'
      | 'kyc-expiry-reminder',
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.emailQueue.add(name, data);
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue ${name} email: ${(err as Error).message}`,
      );
    }
  }

  private async enqueueSmsIfPhoneVerified(
    user: { phoneNumber: string | null; phoneVerifiedAt: Date | null },
    name:
      | 'kyc-approved'
      | 'kyc-rejected'
      | 'kyc-expired'
      | 'kyc-expiry-reminder',
    extraData: Record<string, unknown>,
  ): Promise<void> {
    if (!user.phoneNumber || !user.phoneVerifiedAt) return;
    try {
      await this.smsQueue.add(name, { to: user.phoneNumber, ...extraData });
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue ${name} SMS: ${(err as Error).message}`,
      );
    }
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseOffsets(raw: string): number[] {
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Return the largest offset whose milestone has been crossed AND for which
 * no reminder has yet been sent (lastReminderAt is null or older than
 * expiresAt - offset). Null if no offset is due.
 */
function matchOffset(
  offsetsDesc: number[],
  now: Date,
  expiresAt: Date,
  lastReminderAt: Date | null,
): number | null {
  for (const offsetDays of offsetsDesc) {
    const milestone = new Date(expiresAt.getTime() - offsetDays * DAY_MS);
    if (now < milestone) continue; // milestone not yet reached
    if (lastReminderAt && lastReminderAt >= milestone) continue; // already reminded
    return offsetDays;
  }
  return null;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function clamp(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
