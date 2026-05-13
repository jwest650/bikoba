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

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>(
      'SMTP_FROM',
      'Bikoba <no-reply@bikoba.local>',
    );
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
