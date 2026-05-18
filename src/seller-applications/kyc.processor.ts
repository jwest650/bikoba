import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { type KycJobName, QUEUE_KYC } from '../queue/queue.constants';
import { SellerApplicationsService } from './seller-applications.service';

@Processor(QUEUE_KYC)
export class KycProcessor extends WorkerHost {
  private readonly logger = new Logger(KycProcessor.name);

  constructor(private readonly applications: SellerApplicationsService) {
    super();
  }

  async process(job: Job<unknown, void, KycJobName>): Promise<void> {
    switch (job.name) {
      case 'expire-due-applications': {
        const result = await this.applications.expireDueApplications();
        if (result.expired > 0) {
          this.logger.log(
            `Expired ${result.expired} seller verification${result.expired === 1 ? '' : 's'}`,
          );
        }
        return;
      }
      case 'send-expiry-reminders': {
        const result = await this.applications.sendDueReminders();
        if (result.sent > 0) {
          this.logger.log(
            `Queued ${result.sent} KYC expiry reminder${result.sent === 1 ? '' : 's'}`,
          );
        }
        return;
      }
      default:
        this.logger.warn(`Unknown KYC job: ${String(job.name)}`);
    }
  }
}
