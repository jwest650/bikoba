import type { PaymentChannel, PaymentProvider, Prisma } from '@prisma/client';

export interface PaymentInitInput {
  reference: string;
  amount: Prisma.Decimal;
  currency: string;
  customerEmail: string;
  customerName?: string;
  redirectUrl: string;
  metadata: Record<string, unknown>;
}

export interface PaymentInitOutput {
  redirectUrl: string;
  rawResponse: Record<string, unknown>;
}

export interface PaymentResult {
  reference?: string;
  status: 'success' | 'failed' | 'pending';
  providerRef: string;
  amount: Prisma.Decimal;
  currency: string;
  channel: PaymentChannel | null;
  rawResponse: Record<string, unknown>;
}

export interface RefundInput {
  providerRef: string;
  amount: Prisma.Decimal;
}

export interface RefundResult {
  ok: boolean;
  rawResponse: Record<string, unknown>;
}

export interface PaymentWebhookEvent {
  reference: string;
  status: 'success' | 'failed' | 'pending';
  providerRef: string;
  rawResponse: Record<string, unknown>;
}

export interface PaymentProviderImpl {
  readonly name: PaymentProvider;
  isConfigured(): boolean;
  init(input: PaymentInitInput): Promise<PaymentInitOutput>;
  verify(reference: string): Promise<PaymentResult>;
  parseWebhook(
    headers: Record<string, string | undefined>,
    rawBody: string,
  ): PaymentWebhookEvent | null;
  /**
   * Iterate the provider's recent transactions between `since` and `until`
   * (inclusive). Used by the reconciliation job to repair drift between our
   * Payment records and what the PSP actually charged.
   */
  listSince(since: Date, until: Date): AsyncIterable<PaymentResult>;
  /**
   * Issue a full refund on the PSP for a previously-successful charge.
   */
  refund(input: RefundInput): Promise<RefundResult>;
}
