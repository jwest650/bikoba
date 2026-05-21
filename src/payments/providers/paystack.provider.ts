import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentChannel, PaymentProvider, Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import type {
  PaymentInitInput,
  PaymentInitOutput,
  PaymentProviderImpl,
  PaymentResult,
  PaymentWebhookEvent,
  RefundInput,
  RefundResult,
} from './payment-provider.interface';

@Injectable()
export class PaystackProvider implements PaymentProviderImpl {
  readonly name = PaymentProvider.PAYSTACK;
  private readonly logger = new Logger(PaystackProvider.name);
  private readonly secretKey: string | undefined;

  constructor(config: ConfigService) {
    this.secretKey = config.get<string>('PAYSTACK_SECRET_KEY') || undefined;
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey);
  }

  async init(input: PaymentInitInput): Promise<PaymentInitOutput> {
    this.requireConfigured();
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        email: input.customerEmail,
        amount: Math.round(Number(input.amount.mul(100))), // pesewas / kobo
        currency: input.currency,
        reference: input.reference,
        callback_url: input.redirectUrl,
        channels: ['card', 'mobile_money', 'bank_transfer', 'ussd'],
        metadata: input.metadata,
      }),
    });
    const json = (await res.json()) as {
      status: boolean;
      message?: string;
      data?: { authorization_url: string; access_code: string; reference: string };
    };
    if (!json.status || !json.data) {
      this.logger.error(`Paystack init failed: ${json.message}`);
      throw new ServiceUnavailableException(
        `Payment provider error: ${json.message ?? 'unknown'}`,
      );
    }
    return {
      redirectUrl: json.data.authorization_url,
      rawResponse: json.data as unknown as Record<string, unknown>,
    };
  }

  async verify(reference: string): Promise<PaymentResult> {
    this.requireConfigured();
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: this.headers() },
    );
    const json = (await res.json()) as {
      status: boolean;
      message?: string;
      data?: PaystackTxn;
    };
    if (!json.status || !json.data) {
      this.logger.error(`Paystack verify failed: ${json.message}`);
      return {
        status: 'failed',
        providerRef: '',
        amount: new Prisma.Decimal(0),
        currency: '',
        channel: null,
        rawResponse: json as unknown as Record<string, unknown>,
      };
    }
    return toPaymentResult(json.data);
  }

  parseWebhook(
    headers: Record<string, string | undefined>,
    rawBody: string,
  ): PaymentWebhookEvent | null {
    if (!this.secretKey) return null;
    const provided = headers['x-paystack-signature'];
    if (!provided) return null;

    const expected = createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');
    if (!safeEqualHex(provided, expected)) return null;

    let event: { event?: string; data?: PaystackTxn };
    try {
      event = JSON.parse(rawBody) as { event?: string; data?: PaystackTxn };
    } catch {
      return null;
    }
    if (!event.data?.reference) return null;

    const status = paystackStatus(event.data.status);
    return {
      reference: event.data.reference,
      status,
      providerRef: event.data.id !== undefined ? String(event.data.id) : '',
      rawResponse: event.data as unknown as Record<string, unknown>,
    };
  }

  async *listSince(since: Date, until: Date): AsyncIterable<PaymentResult> {
    this.requireConfigured();
    let page = 1;
    const perPage = 100;
    while (true) {
      const url =
        `https://api.paystack.co/transaction?perPage=${perPage}&page=${page}` +
        `&from=${encodeURIComponent(since.toISOString())}` +
        `&to=${encodeURIComponent(until.toISOString())}`;
      const res = await fetch(url, { headers: this.headers() });
      const json = (await res.json()) as {
        status: boolean;
        data?: PaystackTxn[];
        meta?: { pageCount?: number };
      };
      if (!json.status || !json.data) return;
      for (const tx of json.data) {
        yield { ...toPaymentResult(tx), reference: tx.reference };
      }
      const pageCount = json.meta?.pageCount ?? 1;
      if (page >= pageCount || json.data.length < perPage) return;
      page++;
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    this.requireConfigured();
    const res = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        transaction: input.providerRef,
        amount: Math.round(Number(input.amount.mul(100))),
      }),
    });
    const json = (await res.json()) as {
      status: boolean;
      message?: string;
      data?: Record<string, unknown>;
    };
    if (!json.status) {
      this.logger.error(`Paystack refund failed: ${json.message}`);
      return { ok: false, rawResponse: json as unknown as Record<string, unknown> };
    }
    return { ok: true, rawResponse: (json.data ?? {}) };
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  private requireConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Paystack is not configured on this server',
      );
    }
  }
}

interface PaystackTxn {
  id?: number;
  status: string;
  reference: string;
  amount: number; // in subunits
  currency: string;
  channel?: string;
}

function paystackStatus(s: string): 'success' | 'failed' | 'pending' {
  if (s === 'success') return 'success';
  if (s === 'failed' || s === 'abandoned' || s === 'reversed') return 'failed';
  return 'pending';
}

function toPaymentResult(tx: PaystackTxn): PaymentResult {
  return {
    status: paystackStatus(tx.status),
    providerRef: tx.id !== undefined ? String(tx.id) : '',
    amount: new Prisma.Decimal(tx.amount).div(100),
    currency: tx.currency,
    channel: mapChannel(tx.channel),
    rawResponse: tx as unknown as Record<string, unknown>,
  };
}

function mapChannel(c: string | undefined): PaymentChannel | null {
  switch (c) {
    case 'card':
      return PaymentChannel.CARD;
    case 'mobile_money':
      return PaymentChannel.MOBILE_MONEY;
    case 'bank':
    case 'bank_transfer':
      return PaymentChannel.BANK_TRANSFER;
    case 'ussd':
      return PaymentChannel.USSD;
    case undefined:
      return null;
    default:
      return PaymentChannel.OTHER;
  }
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
