import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';
import { type EmailJob, type EmailJobName, QUEUE_EMAIL } from './queue.constants';

@Processor(QUEUE_EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mail: MailService) {
    super();
  }

  async process(job: Job<unknown, void, EmailJobName>): Promise<void> {
    const tagged = { name: job.name, data: job.data } as EmailJob;
    switch (tagged.name) {
      case 'verification':
        await this.mail.sendEmailVerification(
          tagged.data.to,
          tagged.data.link,
        );
        return;
      case 'application-approved':
        await this.mail.sendApplicationApproved(
          tagged.data.to,
          tagged.data.fullName,
        );
        return;
      case 'application-rejected':
        await this.mail.sendApplicationRejected(
          tagged.data.to,
          tagged.data.fullName,
          tagged.data.reason,
        );
        return;
      case 'kyc-expired':
        await this.mail.sendKycExpired(
          tagged.data.to,
          tagged.data.fullName,
        );
        return;
      case 'kyc-expiry-reminder':
        await this.mail.sendKycExpiryReminder(
          tagged.data.to,
          tagged.data.fullName,
          tagged.data.daysUntilExpiry,
        );
        return;
      case 'order-placed-seller':
        await this.mail.sendOrderPlacedToSeller(tagged.data.to, {
          storeName: tagged.data.storeName,
          orderId: tagged.data.orderId,
          itemCount: tagged.data.itemCount,
          totalAmount: tagged.data.totalAmount,
          currency: tagged.data.currency,
        });
        return;
      case 'order-shipped-buyer':
        await this.mail.sendOrderShippedToBuyer(tagged.data.to, {
          storeName: tagged.data.storeName,
          orderId: tagged.data.orderId,
        });
        return;
      case 'order-out-for-delivery-buyer':
        await this.mail.sendOrderOutForDeliveryToBuyer(tagged.data.to, {
          storeName: tagged.data.storeName,
          orderId: tagged.data.orderId,
        });
        return;
      default: {
        const exhaustive: never = tagged;
        this.logger.warn(
          `Unknown email job: ${JSON.stringify(exhaustive)}`,
        );
      }
    }
  }
}
