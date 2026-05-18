import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// africastalking ships a CommonJS factory.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AfricasTalking = require('africastalking') as (opts: {
  apiKey: string;
  username: string;
}) => { SMS: { send: (opts: SendInput) => Promise<unknown> } };

interface SendInput {
  to: string[];
  message: string;
  from?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: ReturnType<typeof AfricasTalking> | null = null;
  private readonly username: string | undefined;
  private readonly apiKey: string | undefined;
  private readonly senderId: string | undefined;

  constructor(config: ConfigService) {
    this.username = config.get<string>('AT_USERNAME') || undefined;
    this.apiKey = config.get<string>('AT_API_KEY') || undefined;
    this.senderId = config.get<string>('AT_SENDER_ID') || undefined;
  }

  isConfigured(): boolean {
    return Boolean(this.username && this.apiKey);
  }

  async send(to: string, message: string): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.log(`[dev] would send SMS to=${to}\n${message}`);
      return;
    }
    try {
      await this.getClient().SMS.send({
        to: [to],
        message,
        from: this.senderId,
      });
    } catch (err) {
      this.logger.error(`SMS to ${to} failed: ${(err as Error).message}`);
      throw err;
    }
  }

  sendOtp(to: string, code: string): Promise<void> {
    return this.send(to, `Your Bikoba code is ${code}. Expires in 5 minutes.`);
  }

  sendKycApproved(to: string): Promise<void> {
    return this.send(
      to,
      'Bikoba: your seller verification is approved. You can now create stores and list products.',
    );
  }

  sendKycRejected(to: string, reason: string): Promise<void> {
    return this.send(
      to,
      `Bikoba: your seller application needs changes. Reason: ${truncate(reason, 100)}. Re-submit when ready.`,
    );
  }

  sendKycExpiryReminder(to: string, daysUntilExpiry: number): Promise<void> {
    const days = daysUntilExpiry === 1 ? '1 day' : `${daysUntilExpiry} days`;
    return this.send(
      to,
      `Bikoba: your seller verification expires in ${days}. Re-verify to keep your stores active.`,
    );
  }

  sendKycExpired(to: string): Promise<void> {
    return this.send(
      to,
      'Bikoba: your seller verification has expired. Stores paused. Re-verify to resume selling.',
    );
  }

  sendPasswordChanged(to: string): Promise<void> {
    return this.send(
      to,
      'Bikoba: your password was just changed. If this was not you, contact support immediately.',
    );
  }

  sendNewDeviceLogin(to: string): Promise<void> {
    return this.send(
      to,
      'Bikoba: a new sign-in to your account was just detected. If this was not you, change your password immediately.',
    );
  }

  sendOrderPlaced(
    to: string,
    args: { itemCount: number; totalAmount: string; currency: string },
  ): Promise<void> {
    const items = args.itemCount === 1 ? '1 item' : `${args.itemCount} items`;
    return this.send(
      to,
      `Bikoba: new order received — ${items}, total ${args.currency} ${args.totalAmount}. Open your store to fulfil.`,
    );
  }

  sendOrderShipped(to: string, storeName: string): Promise<void> {
    return this.send(
      to,
      `Bikoba: your order from ${truncate(storeName, 40)} has shipped. We'll text again when it's out for delivery.`,
    );
  }

  sendOrderOutForDelivery(to: string, storeName: string): Promise<void> {
    return this.send(
      to,
      `Bikoba: your order from ${truncate(storeName, 40)} is out for delivery today. Please be available to receive it.`,
    );
  }

  private getClient(): ReturnType<typeof AfricasTalking> {
    if (!this.client) {
      this.client = AfricasTalking({
        username: this.username!,
        apiKey: this.apiKey!,
      });
    }
    return this.client;
  }
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}
