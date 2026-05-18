import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { SmsService } from '../sms/sms.service';
import { type SmsJob, type SmsJobName, QUEUE_SMS } from './queue.constants';

@Processor(QUEUE_SMS)
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(private readonly sms: SmsService) {
    super();
  }

  async process(job: Job<unknown, void, SmsJobName>): Promise<void> {
    const tagged = { name: job.name, data: job.data } as SmsJob;
    switch (tagged.name) {
      case 'kyc-approved':
        await this.sms.sendKycApproved(tagged.data.to);
        return;
      case 'kyc-rejected':
        await this.sms.sendKycRejected(tagged.data.to, tagged.data.reason);
        return;
      case 'kyc-expiry-reminder':
        await this.sms.sendKycExpiryReminder(
          tagged.data.to,
          tagged.data.daysUntilExpiry,
        );
        return;
      case 'kyc-expired':
        await this.sms.sendKycExpired(tagged.data.to);
        return;
      case 'password-changed':
        await this.sms.sendPasswordChanged(tagged.data.to);
        return;
      case 'new-device-login':
        await this.sms.sendNewDeviceLogin(tagged.data.to);
        return;
      case 'order-placed':
        await this.sms.sendOrderPlaced(tagged.data.to, {
          itemCount: tagged.data.itemCount,
          totalAmount: tagged.data.totalAmount,
          currency: tagged.data.currency,
        });
        return;
      case 'order-shipped':
        await this.sms.sendOrderShipped(tagged.data.to, tagged.data.storeName);
        return;
      case 'order-out-for-delivery':
        await this.sms.sendOrderOutForDelivery(
          tagged.data.to,
          tagged.data.storeName,
        );
        return;
      default: {
        const exhaustive: never = tagged;
        this.logger.warn(`Unknown SMS job: ${JSON.stringify(exhaustive)}`);
      }
    }
  }
}
