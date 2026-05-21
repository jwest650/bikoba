import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  ReconcileEventKind,
  Role,
  type Payment,
  type ReconcileEvent,
  type ReconcileRun,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { InitPaymentDto } from './dto/init-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import type {
  PaymentProviderImpl,
  PaymentResult,
} from './providers/payment-provider.interface';
import { PaystackProvider } from './providers/paystack.provider';

export interface InitiateResult {
  payment: Payment;
  redirectUrl: string;
}

export interface ReconcileReport {
  runId: string;
  scannedByProvider: Record<string, number>;
  reconciled: number;
  stuck: number;
  phantoms: Array<{ provider: PaymentProvider; reference: string }>;
  mismatches: Array<{
    paymentId: string;
    ourAmount: string;
    theirAmount: string;
  }>;
}

export interface ListReconcileRunsQuery {
  take?: number;
  skip?: number;
}

interface ReconcileEventInput {
  kind: ReconcileEventKind;
  provider?: PaymentProvider;
  reference?: string;
  paymentId?: string;
  detail?: Record<string, unknown>;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly redirectUrl: string;
  private readonly providers: Map<PaymentProvider, PaymentProviderImpl>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    paystack: PaystackProvider,
    flutterwave: FlutterwaveProvider,
    config: ConfigService,
  ) {
    this.redirectUrl =
      config.get<string>('PAYMENT_REDIRECT_URL') ||
      `${config.get<string>('APP_URL') ?? 'http://localhost:3000'}/payments/result`;
    this.providers = new Map<PaymentProvider, PaymentProviderImpl>([
      [PaymentProvider.PAYSTACK, paystack],
      [PaymentProvider.FLUTTERWAVE, flutterwave],
    ]);
  }

  /**
   * Start a payment for an order. Creates a Payment row, asks the provider for
   * a hosted checkout URL, and returns it. Stock is already decremented by
   * OrdersService.create — payment just gates the order's transition to
   * CONFIRMED.
   */
  async initiate(
    dto: InitPaymentDto,
    caller: AuthenticatedUser,
  ): Promise<InitiateResult> {
    const provider = this.requireProvider(dto.provider);

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        buyer: { select: { id: true, email: true, fullName: true } },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (caller.role !== Role.ADMIN && order.buyerId !== caller.id) {
      throw new ForbiddenException('You cannot pay for this order');
    }
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new ConflictException(
        `Order is in ${order.status} state; payment can only be initiated for PENDING_PAYMENT orders`,
      );
    }

    const reference = `pay_${randomUUID().replace(/-/g, '')}`;
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: dto.provider,
        reference,
        amount: order.totalAmount,
        currency: order.currency,
        status: PaymentStatus.PENDING,
      },
    });

    let initResult;
    try {
      initResult = await provider.init({
        reference,
        amount: order.totalAmount,
        currency: order.currency,
        customerEmail: order.buyer.email,
        customerName: order.buyer.fullName ?? undefined,
        redirectUrl: `${this.redirectUrl}?reference=${encodeURIComponent(reference)}&provider=${dto.provider}`,
        metadata: { orderId: order.id, paymentId: payment.id },
      });
    } catch (err) {
      // Init failed — mark the payment as FAILED so the caller can retry.
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, failedAt: new Date() },
      });
      throw err;
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        initResponse: initResult.rawResponse as Prisma.InputJsonValue,
      },
    });

    return { payment: updated, redirectUrl: initResult.redirectUrl };
  }

  /**
   * Re-sync a payment's status from the PSP. Called from:
   *   1. GET /payments/verify (frontend after PSP redirect)
   *   2. POST /payments/webhook/:provider (async confirmation)
   * Idempotent — already-successful payments don't re-trigger downstream effects.
   */
  async verify(reference: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status === PaymentStatus.SUCCESS) {
      return payment; // already terminal — nothing to do
    }
    if (payment.status === PaymentStatus.REFUNDED) {
      return payment;
    }

    const provider = this.requireProvider(payment.provider);
    const result = await provider.verify(reference);
    return this.applyResult(payment.id, result);
  }

  /**
   * Process an inbound webhook payload from a PSP. Verifies the signature via
   * the provider, looks up the payment, and idempotently advances state.
   */
  async handleWebhook(
    providerName: PaymentProvider,
    headers: Record<string, string | undefined>,
    rawBody: string,
  ): Promise<{ ok: boolean }> {
    const provider = this.requireProvider(providerName);
    const event = provider.parseWebhook(headers, rawBody);
    if (!event) {
      throw new BadRequestException('Invalid webhook signature or payload');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { reference: event.reference },
    });
    if (!payment) {
      // Reference doesn't match any payment we issued — log and ack so PSP
      // doesn't retry forever, but don't surface as an error to the PSP.
      this.logger.warn(
        `Webhook for unknown reference ${event.reference} from ${providerName}`,
      );
      return { ok: true };
    }
    if (payment.status === PaymentStatus.SUCCESS) {
      return { ok: true };
    }

    // Trust the webhook only as a trigger to re-verify against the API.
    // Webhook payloads can be replayed; the API is authoritative.
    const result = await provider.verify(event.reference);
    await this.applyResult(payment.id, result);
    return { ok: true };
  }

  /**
   * Walk recent transactions from every configured provider, repair any
   * Payment rows whose state has drifted from the PSP's view, and re-fire
   * markPaid for SUCCESS payments whose order is still stuck in
   * PENDING_PAYMENT. Returns a structured report; non-zero phantoms or
   * mismatches indicate something a human should look at.
   */
  async reconcile(since: Date, until: Date): Promise<ReconcileReport> {
    const startedAt = new Date();
    const scannedByProvider: Record<string, number> = {};
    const events: ReconcileEventInput[] = [];
    const phantoms: ReconcileReport['phantoms'] = [];
    const mismatches: ReconcileReport['mismatches'] = [];
    let reconciled = 0;
    let stuck = 0;

    for (const [name, provider] of this.providers.entries()) {
      if (!provider.isConfigured()) continue;
      let scanned = 0;
      try {
        for await (const tx of provider.listSince(since, until)) {
          scanned++;
          if (tx.status !== 'success' || !tx.reference) continue;

          const payment = await this.prisma.payment.findUnique({
            where: { reference: tx.reference },
          });
          if (!payment) {
            phantoms.push({ provider: name, reference: tx.reference });
            events.push({
              kind: ReconcileEventKind.PHANTOM,
              provider: name,
              reference: tx.reference,
              detail: {
                amount: tx.amount.toFixed(2),
                currency: tx.currency,
                providerRef: tx.providerRef,
              },
            });
            continue;
          }
          const ours = payment.amount.toFixed(2);
          const theirs = tx.amount.toFixed(2);
          if (ours !== theirs || payment.currency !== tx.currency) {
            mismatches.push({
              paymentId: payment.id,
              ourAmount: `${payment.currency} ${ours}`,
              theirAmount: `${tx.currency} ${theirs}`,
            });
            events.push({
              kind: ReconcileEventKind.MISMATCH,
              provider: name,
              reference: tx.reference,
              paymentId: payment.id,
              detail: {
                ourAmount: `${payment.currency} ${ours}`,
                theirAmount: `${tx.currency} ${theirs}`,
              },
            });
            continue;
          }
          if (payment.status !== PaymentStatus.SUCCESS) {
            const previousStatus = payment.status;
            await this.applyResult(payment.id, tx);
            reconciled++;
            events.push({
              kind: ReconcileEventKind.RECONCILED,
              provider: name,
              reference: tx.reference,
              paymentId: payment.id,
              detail: { from: previousStatus, to: 'SUCCESS' },
            });
          }
        }
      } catch (err) {
        this.logger.error(
          `Reconciliation failed for ${name}: ${(err as Error).message}`,
        );
      }
      scannedByProvider[name] = scanned;
    }

    // Second pass: SUCCESS payments whose order is stuck in PENDING_PAYMENT.
    const stuckPayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        order: { status: OrderStatus.PENDING_PAYMENT },
      },
      select: { id: true, orderId: true },
    });
    for (const p of stuckPayments) {
      try {
        await this.orders.markPaid(p.orderId);
        stuck++;
        events.push({
          kind: ReconcileEventKind.STUCK_RESOLVED,
          paymentId: p.id,
          detail: { orderId: p.orderId },
        });
      } catch (err) {
        this.logger.error(
          `Stuck order ${p.orderId} markPaid retry failed: ${(err as Error).message}`,
        );
      }
    }

    const finishedAt = new Date();
    const run = await this.prisma.reconcileRun.create({
      data: {
        startedAt,
        finishedAt,
        windowSince: since,
        windowUntil: until,
        scannedByProvider: scannedByProvider as Prisma.InputJsonValue,
        reconciledCount: reconciled,
        stuckCount: stuck,
        phantomsCount: phantoms.length,
        mismatchesCount: mismatches.length,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        events: {
          create: events.map((e) => ({
            kind: e.kind,
            provider: e.provider,
            reference: e.reference,
            paymentId: e.paymentId,
            detail: (e.detail ?? null) as Prisma.InputJsonValue,
          })),
        },
      },
    });

    const report: ReconcileReport = {
      runId: run.id,
      scannedByProvider,
      reconciled,
      stuck,
      phantoms,
      mismatches,
    };

    if (
      phantoms.length > 0 ||
      mismatches.length > 0 ||
      reconciled > 0 ||
      stuck > 0
    ) {
      this.logger.warn(
        `Reconcile run ${run.id}: ${JSON.stringify({
          scanned: scannedByProvider,
          reconciled,
          stuck,
          phantoms: phantoms.length,
          mismatches: mismatches.length,
        })}`,
      );
    }
    return report;
  }

  /**
   * Manually trigger a reconciliation pass over the last `lookbackHours` hours.
   * Used by `POST /admin/reconciliations/run` so ops can rerun outside the
   * daily cron (e.g. after fixing a webhook misconfiguration).
   */
  async triggerReconcileNow(lookbackHours: number): Promise<ReconcileReport> {
    const hours = Number.isFinite(lookbackHours) && lookbackHours > 0
      ? Math.min(lookbackHours, 24 * 30) // cap at 30 days
      : 24;
    const until = new Date();
    const since = new Date(until.getTime() - hours * 60 * 60 * 1000);
    return this.reconcile(since, until);
  }

  listReconcileRuns(
    query: ListReconcileRunsQuery,
  ): Promise<ReconcileRun[]> {
    return this.prisma.reconcileRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: clamp(query.take, 1, 100, 20),
      skip: Math.max(0, query.skip ?? 0),
    });
  }

  async getReconcileRun(
    id: string,
  ): Promise<ReconcileRun & { events: ReconcileEvent[] }> {
    const run = await this.prisma.reconcileRun.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!run) {
      throw new NotFoundException('Reconciliation run not found');
    }
    return run;
  }

  /**
   * Admin-only full refund of a previously-SUCCESS payment. Calls the PSP,
   * marks the Payment REFUNDED on success, and cancels the order (restoring
   * stock) if it hasn't shipped yet. SHIPPED/DELIVERED orders are left alone
   * — refunding money while goods are out is an ops/dispute case.
   */
  async refund(
    paymentId: string,
    dto: RefundPaymentDto,
  ): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { id: true, status: true } } },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new ConflictException(
        `Only SUCCESS payments can be refunded (current: ${payment.status})`,
      );
    }
    if (!payment.providerRef) {
      throw new ConflictException(
        'Payment has no provider reference — cannot issue refund',
      );
    }

    const provider = this.requireProvider(payment.provider);
    const result = await provider.refund({
      providerRef: payment.providerRef,
      amount: payment.amount,
    });
    if (!result.ok) {
      throw new ServiceUnavailableException(
        'Refund failed at the payment provider',
      );
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
        refundReason: dto.reason,
        refundResponse: result.rawResponse as Prisma.InputJsonValue,
      },
    });

    // Cancel the order (with stock restore) only when fulfilment hasn't begun.
    if (
      payment.order.status === OrderStatus.CONFIRMED ||
      payment.order.status === OrderStatus.PENDING_PAYMENT
    ) {
      try {
        await this.orders.cancelByRefund(payment.order.id, dto.reason);
      } catch (err) {
        this.logger.error(
          `Refund succeeded for ${paymentId} but order cancellation failed: ${(err as Error).message}`,
        );
      }
    } else {
      this.logger.warn(
        `Refunded payment ${paymentId} but order ${payment.order.id} is in ${payment.order.status} — not cancelling automatically`,
      );
    }

    return updated;
  }

  private async applyResult(
    paymentId: string,
    result: PaymentResult,
  ): Promise<Payment> {
    const now = new Date();
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        providerRef: result.providerRef || undefined,
        channel: result.channel ?? undefined,
        verifyResponse: result.rawResponse as Prisma.InputJsonValue,
        status:
          result.status === 'success'
            ? PaymentStatus.SUCCESS
            : result.status === 'failed'
              ? PaymentStatus.FAILED
              : PaymentStatus.PENDING,
        completedAt: result.status === 'success' ? now : undefined,
        failedAt: result.status === 'failed' ? now : undefined,
      },
    });

    if (result.status === 'success') {
      try {
        await this.orders.markPaid(updated.orderId);
      } catch (err) {
        this.logger.error(
          `Payment ${paymentId} succeeded but markPaid failed for order ${updated.orderId}: ${(err as Error).message}`,
        );
      }
    }
    return updated;
  }

  private requireProvider(name: PaymentProvider): PaymentProviderImpl {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new BadRequestException(`Unknown payment provider: ${name}`);
    }
    if (!provider.isConfigured()) {
      throw new ServiceUnavailableException(
        `${name} is not configured on this server`,
      );
    }
    return provider;
  }
}

function clamp(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
