import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentChannel, PaymentProvider, Prisma } from '@prisma/client';
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
export class FlutterwaveProvider implements PaymentProviderImpl {
  readonly name = PaymentProvider.FLUTTERWAVE;
  private readonly logger = new Logger(FlutterwaveProvider.name);
  private readonly secretKey: string | undefined;
  private readonly webhookSecret: string | undefined;

  constructor(config: ConfigService) {
    this.secretKey =
      config.get<string>('FLUTTERWAVE_SECRET_KEY') || undefined;
    this.webhookSecret =
      config.get<string>('FLUTTERWAVE_WEBHOOK_SECRET') || undefined;
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey);
  }

  async init(input: PaymentInitInput): Promise<PaymentInitOutput> {
    this.requireConfigured();
    const res = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        tx_ref: input.reference,
        amount: Number(input.amount.toFixed(2)),
        currency: input.currency,
        redirect_url: input.redirectUrl,
        customer: {
          email: input.customerEmail,
          name: input.customerName ?? '',
        },
        payment_options: 'card,mobilemoneyghana,banktransfer,ussd',
        meta: input.metadata,
      }),
    });
    const json = (await res.json()) as {
      status: string;
      message?: string;
      data?: { link: string };
    };
    if (json.status !== 'success' || !json.data) {
      this.logger.error(`Flutterwave init failed: ${json.message}`);
      throw new ServiceUnavailableException(
        `Payment provider error: ${json.message ?? 'unknown'}`,
      );
    }
    return {
      redirectUrl: json.data.link,
      rawResponse: json.data as unknown as Record<string, unknown>,
    };
  }

  async verify(reference: string): Promise<PaymentResult> {
    this.requireConfigured();
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: this.headers() },
    );
    const json = (await res.json()) as {
      status: string;
      message?: string;
      data?: FlwTxn;
    };
    if (json.status !== 'success' || !json.data) {
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
    if (!this.webhookSecret) return null;
    const provided = headers['verif-hash'];
    if (!provided || provided !== this.webhookSecret) return null;

    let event: { event?: string; data?: FlwTxn };
    try {
      event = JSON.parse(rawBody) as { event?: string; data?: FlwTxn };
    } catch {
      return null;
    }
    if (!event.data?.tx_ref) return null;

    return {
      reference: event.data.tx_ref,
      status: flwStatus(event.data.status),
      providerRef: event.data.id !== undefined ? String(event.data.id) : '',
      rawResponse: event.data as unknown as Record<string, unknown>,
    };
  }

  async *listSince(since: Date, until: Date): AsyncIterable<PaymentResult> {
    this.requireConfigured();
    let page = 1;
    while (true) {
      const url =
        `https://api.flutterwave.com/v3/transactions?page=${page}` +
        `&from=${encodeURIComponent(toDateOnly(since))}` +
        `&to=${encodeURIComponent(toDateOnly(until))}`;
      const res = await fetch(url, { headers: this.headers() });
      const json = (await res.json()) as {
        status: string;
        data?: FlwTxn[];
        meta?: { page_info?: { total_pages?: number; current_page?: number } };
      };
      if (json.status !== 'success' || !json.data) return;
      for (const tx of json.data) {
        yield { ...toPaymentResult(tx), reference: tx.tx_ref };
      }
      const total = json.meta?.page_info?.total_pages ?? 1;
      const current = json.meta?.page_info?.current_page ?? page;
      if (current >= total || json.data.length === 0) return;
      page++;
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    this.requireConfigured();
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(input.providerRef)}/refund`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ amount: Number(input.amount.toFixed(2)) }),
      },
    );
    const json = (await res.json()) as {
      status: string;
      message?: string;
      data?: Record<string, unknown>;
    };
    if (json.status !== 'success') {
      this.logger.error(`Flutterwave refund failed: ${json.message}`);
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
        'Flutterwave is not configured on this server',
      );
    }
  }
}

interface FlwTxn {
  id?: number;
  tx_ref: string;
  status: string;
  amount: number; // whole units, not subunits
  currency: string;
  payment_type?: string;
}

function flwStatus(s: string): 'success' | 'failed' | 'pending' {
  if (s === 'successful' || s === 'success') return 'success';
  if (s === 'failed' || s === 'cancelled') return 'failed';
  return 'pending';
}

function toPaymentResult(tx: FlwTxn): PaymentResult {
  return {
    status: flwStatus(tx.status),
    providerRef: tx.id !== undefined ? String(tx.id) : '',
    amount: new Prisma.Decimal(tx.amount),
    currency: tx.currency,
    channel: mapChannel(tx.payment_type),
    rawResponse: tx as unknown as Record<string, unknown>,
  };
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function mapChannel(c: string | undefined): PaymentChannel | null {
  switch (c) {
    case 'card':
    case 'credit':
    case 'debit':
      return PaymentChannel.CARD;
    case 'mobilemoneyghana':
    case 'mobilemoney':
    case 'mobile_money_ghana':
      return PaymentChannel.MOBILE_MONEY;
    case 'banktransfer':
    case 'bank':
      return PaymentChannel.BANK_TRANSFER;
    case 'ussd':
      return PaymentChannel.USSD;
    case undefined:
      return null;
    default:
      return PaymentChannel.OTHER;
  }
}
