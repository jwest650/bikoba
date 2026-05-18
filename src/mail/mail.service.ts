import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface SendOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>(
      'SMTP_FROM',
      'Bikoba <no-reply@bikoba.local>',
    );
    this.appUrl = (
      config.get<string>('APP_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  onModuleInit(): void {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn(
        'SMTP_HOST is unset — verification emails will be logged to the console instead of sent.',
      );
      return;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get<string>('SMTP_PORT', '587')),
      secure: this.config.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: this.config.get<string>('SMTP_USER')
        ? {
            user: this.config.getOrThrow<string>('SMTP_USER'),
            pass: this.config.getOrThrow<string>('SMTP_PASS'),
          }
        : undefined,
    });
  }

  async send(opts: SendOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[dev] would send email to=${opts.to} subject="${opts.subject}"\n${opts.text}`,
      );
      return;
    }
    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
  }

  async sendApplicationApproved(to: string, fullName: string): Promise<void> {
    const subject = 'Your Bikoba seller application is approved';
    const greeting = fullName ? `Hi ${fullName},` : 'Hi,';
    const text = `${greeting}\n\nGood news — your Bikoba seller application has been approved. You can now create stores and list products. Sign in and head to your profile to get started.\n\n— The Bikoba team`;
    const html = simpleEmailHtml(
      'Seller application approved',
      `${greeting} good news — your Bikoba seller application has been approved. You can now create stores and list products.`,
      { label: 'Open Bikoba', href: this.appUrl },
    );
    await this.send({ to, subject, text, html });
  }

  async sendApplicationRejected(
    to: string,
    fullName: string,
    reason: string,
  ): Promise<void> {
    const subject = 'Your Bikoba seller application needs changes';
    const greeting = fullName ? `Hi ${fullName},` : 'Hi,';
    const text = `${greeting}\n\nWe couldn't approve your Bikoba seller application as submitted. Reason from our team:\n\n  "${reason}"\n\nYou can update your details and re-submit at any time.\n\n— The Bikoba team`;
    const html = simpleEmailHtml(
      'Seller application needs changes',
      `${greeting} we couldn't approve your seller application as submitted. Reason: <em>${escapeHtml(reason)}</em>. You can update your details and re-submit at any time.`,
      { label: 'Re-submit application', href: `${this.appUrl}/#seller-applications-page` },
    );
    await this.send({ to, subject, text, html });
  }

  async sendKycExpiryReminder(
    to: string,
    fullName: string,
    daysUntilExpiry: number,
  ): Promise<void> {
    const days =
      daysUntilExpiry === 1 ? '1 day' : `${daysUntilExpiry} days`;
    const subject = `Your Bikoba verification expires in ${days}`;
    const greeting = fullName ? `Hi ${fullName},` : 'Hi,';
    const text = `${greeting}\n\nYour Bikoba seller verification will expire in ${days}. Once it expires your stores will be paused until you re-verify. To keep selling without interruption, re-submit your Ghana Card and a fresh selfie now.\n\n— The Bikoba team`;
    const html = simpleEmailHtml(
      'Re-verify before your KYC expires',
      `${greeting} your Bikoba seller verification will expire in <strong>${days}</strong>. Once it expires your stores will be paused until you re-verify. Re-submit now to avoid any interruption.`,
      {
        label: 'Re-verify now',
        href: `${this.appUrl}/#seller-applications-page`,
      },
    );
    await this.send({ to, subject, text, html });
  }

  async sendKycExpired(to: string, fullName: string): Promise<void> {
    const subject = 'Your Bikoba verification has expired';
    const greeting = fullName ? `Hi ${fullName},` : 'Hi,';
    const text = `${greeting}\n\nYour Bikoba seller verification has expired. Your stores have been temporarily paused. To resume selling, re-submit your Ghana Card and a fresh selfie.\n\n— The Bikoba team`;
    const html = simpleEmailHtml(
      'Verification expired',
      `${greeting} your Bikoba seller verification has expired. Your stores have been temporarily paused. To resume selling, re-submit your Ghana Card and a fresh selfie.`,
      { label: 'Re-verify now', href: `${this.appUrl}/#seller-applications-page` },
    );
    await this.send({ to, subject, text, html });
  }

  async sendOrderPlacedToSeller(
    to: string,
    args: {
      storeName: string;
      orderId: string;
      itemCount: number;
      totalAmount: string;
      currency: string;
    },
  ): Promise<void> {
    const items =
      args.itemCount === 1 ? '1 item' : `${args.itemCount} items`;
    const subject = `New order for ${args.storeName} — ${args.currency} ${args.totalAmount}`;
    const text = `Hi,\n\nA new order has been placed for ${args.storeName}.\n\nOrder ID: ${args.orderId}\nItems: ${items}\nTotal: ${args.currency} ${args.totalAmount}\n\nSign in to your Bikoba seller dashboard to start fulfilling.\n\n— The Bikoba team`;
    const html = simpleEmailHtml(
      'New order received',
      `Hi, a new order has been placed for <strong>${escapeHtml(args.storeName)}</strong>.<br/><br/>Order ID: <code>${escapeHtml(args.orderId)}</code><br/>Items: ${items}<br/>Total: <strong>${escapeHtml(args.currency)} ${escapeHtml(args.totalAmount)}</strong>`,
      { label: 'Open your store', href: this.appUrl },
    );
    await this.send({ to, subject, text, html });
  }

  async sendOrderShippedToBuyer(
    to: string,
    args: { storeName: string; orderId: string },
  ): Promise<void> {
    const subject = `Your order from ${args.storeName} has shipped`;
    const text = `Hi,\n\nYour order from ${args.storeName} has been shipped. Order ID: ${args.orderId}.\n\nWe'll email you again when it's out for delivery.\n\n— The Bikoba team`;
    const html = simpleEmailHtml(
      'Your order has shipped',
      `Hi, your order from <strong>${escapeHtml(args.storeName)}</strong> has been shipped. We'll email you again when it's out for delivery.`,
      { label: 'View order', href: this.appUrl },
    );
    await this.send({ to, subject, text, html });
  }

  async sendOrderOutForDeliveryToBuyer(
    to: string,
    args: { storeName: string; orderId: string },
  ): Promise<void> {
    const subject = `Your order from ${args.storeName} is out for delivery`;
    const text = `Hi,\n\nYour order from ${args.storeName} is out for delivery today. Order ID: ${args.orderId}. Please be available to receive it.\n\n— The Bikoba team`;
    const html = simpleEmailHtml(
      'Out for delivery today',
      `Hi, your order from <strong>${escapeHtml(args.storeName)}</strong> is out for delivery today. Please be available to receive it.`,
      { label: 'View order', href: this.appUrl },
    );
    await this.send({ to, subject, text, html });
  }

  async sendEmailVerification(to: string, link: string): Promise<void> {
    const subject = 'Confirm your Bikoba email';
    const text = `Welcome to Bikoba! Confirm your email by visiting:\n\n${link}\n\nThis link expires in 24 hours. If you didn't sign up, you can ignore this message.`;
    const html = `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f8fa;padding:32px;">
  <table style="max-width:520px;margin:0 auto;background:white;border-radius:12px;padding:32px;border:1px solid #e4e7ec;">
    <tr><td>
      <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Confirm your email</h1>
      <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
        Welcome to Bikoba. Click the button below to confirm your email address.
        This link expires in 24 hours.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${link}"
           style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">
          Confirm email
        </a>
      </p>
      <p style="color:#94a3b8;font-size:13px;margin:0;">
        Or paste this link into your browser:<br/>
        <a href="${link}" style="color:#4f46e5;word-break:break-all;">${link}</a>
      </p>
    </td></tr>
  </table>
</body></html>`.trim();
    await this.send({ to, subject, text, html });
  }
}

function simpleEmailHtml(
  title: string,
  bodyHtml: string,
  cta: { label: string; href: string },
): string {
  return `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f8fa;padding:32px;">
  <table style="max-width:520px;margin:0 auto;background:white;border-radius:12px;padding:32px;border:1px solid #e4e7ec;">
    <tr><td>
      <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">${escapeHtml(title)}</h1>
      <p style="color:#475569;line-height:1.6;margin:0 0 24px;">${bodyHtml}</p>
      <p style="margin:0;">
        <a href="${cta.href}"
           style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">
          ${escapeHtml(cta.label)}
        </a>
      </p>
    </td></tr>
  </table>
</body></html>`.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
