import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { QUEUE_KYC } from '../queue/queue.constants';

@Injectable()
export class KycScheduler implements OnModuleInit {
  private readonly logger = new Logger(KycScheduler.name);

  constructor(@InjectQueue(QUEUE_KYC) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.queue.upsertJobScheduler(
        'kyc-expiry-daily',
        { pattern: '0 3 * * *' },
        { name: 'expire-due-applications', data: {} },
      );
      await this.queue.upsertJobScheduler(
        'kyc-reminders-daily',
        { pattern: '30 3 * * *' },
        { name: 'send-expiry-reminders', data: {} },
      );
      this.logger.log(
        'Scheduled daily KYC sweep at 03:00 UTC, reminders at 03:30 UTC',
      );
    } catch (err) {
      this.logger.warn(
        `Could not schedule KYC jobs: ${(err as Error).message}`,
      );
    }
  }
}
