import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { QUEUE_PAYMENTS } from '../queue/queue.constants';

@Injectable()
export class PaymentsScheduler implements OnModuleInit {
  private readonly logger = new Logger(PaymentsScheduler.name);

  constructor(@InjectQueue(QUEUE_PAYMENTS) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.queue.upsertJobScheduler(
        'payments-reconcile-daily',
        { pattern: '0 4 * * *' },
        { name: 'reconcile-payments', data: {} },
      );
      await this.queue.upsertJobScheduler(
        'payments-cancel-abandoned-daily',
        { pattern: '30 4 * * *' },
        { name: 'cancel-abandoned-orders', data: {} },
      );
      this.logger.log(
        'Scheduled daily payments reconciliation at 04:00 UTC, abandoned-cart sweep at 04:30 UTC',
      );
    } catch (err) {
      this.logger.warn(
        `Could not schedule payments jobs: ${(err as Error).message}`,
      );
    }
  }
}
