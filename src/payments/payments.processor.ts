import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { OrdersService } from '../orders/orders.service';
import { type PaymentsJobName, QUEUE_PAYMENTS } from '../queue/queue.constants';
import { PaymentsService } from './payments.service';

@Processor(QUEUE_PAYMENTS)
export class PaymentsProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentsProcessor.name);
  private readonly graceHours: number;

  constructor(
    private readonly payments: PaymentsService,
    private readonly orders: OrdersService,
    config: ConfigService,
  ) {
    super();
    const raw = Number(config.get<string>('ABANDONED_CART_GRACE_HOURS'));
    this.graceHours = Number.isFinite(raw) && raw >= 0 ? raw : 24;
  }

  async process(job: Job<unknown, void, PaymentsJobName>): Promise<void> {
    switch (job.name) {
      case 'reconcile-payments': {
        const until = new Date();
        const since = new Date(until.getTime() - 24 * 60 * 60 * 1000);
        const report = await this.payments.reconcile(since, until);
        this.logger.log(
          `Reconciliation: scanned=${JSON.stringify(report.scannedByProvider)} reconciled=${report.reconciled} stuck=${report.stuck} phantoms=${report.phantoms.length} mismatches=${report.mismatches.length}`,
        );
        return;
      }
      case 'cancel-abandoned-orders': {
        if (this.graceHours <= 0) {
          this.logger.log(
            'ABANDONED_CART_GRACE_HOURS is 0 — abandoned-cart sweep disabled',
          );
          return;
        }
        const result = await this.orders.cancelAbandoned(this.graceHours);
        if (result.cancelled > 0) {
          this.logger.log(
            `Cancelled ${result.cancelled} abandoned order${result.cancelled === 1 ? '' : 's'} older than ${this.graceHours}h`,
          );
        }
        return;
      }
      default:
        this.logger.warn(`Unknown payments job: ${String(job.name)}`);
    }
  }
}
