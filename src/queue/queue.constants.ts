export const QUEUE_EMAIL = 'email';
export const QUEUE_KYC = 'kyc';
export const QUEUE_SMS = 'sms';

export type EmailJob =
  | { name: 'verification'; data: { to: string; link: string } }
  | { name: 'application-approved'; data: { to: string; fullName: string } }
  | {
      name: 'application-rejected';
      data: { to: string; fullName: string; reason: string };
    }
  | {
      name: 'kyc-expired';
      data: { to: string; fullName: string };
    }
  | {
      name: 'kyc-expiry-reminder';
      data: { to: string; fullName: string; daysUntilExpiry: number };
    }
  | {
      name: 'order-placed-seller';
      data: {
        to: string;
        storeName: string;
        orderId: string;
        itemCount: number;
        totalAmount: string;
        currency: string;
      };
    }
  | {
      name: 'order-shipped-buyer';
      data: { to: string; storeName: string; orderId: string };
    }
  | {
      name: 'order-out-for-delivery-buyer';
      data: { to: string; storeName: string; orderId: string };
    };

export type EmailJobName = EmailJob['name'];

// Kept for back-compat with existing imports.
export type EmailVerificationJob = Extract<
  EmailJob,
  { name: 'verification' }
>['data'];

export type KycJob =
  | {
      name: 'expire-due-applications';
      data: Record<string, never>;
    }
  | {
      name: 'send-expiry-reminders';
      data: Record<string, never>;
    };

export type KycJobName = KycJob['name'];

export type SmsJob =
  | { name: 'kyc-approved'; data: { to: string } }
  | { name: 'kyc-rejected'; data: { to: string; reason: string } }
  | { name: 'kyc-expiry-reminder'; data: { to: string; daysUntilExpiry: number } }
  | { name: 'kyc-expired'; data: { to: string } }
  | { name: 'password-changed'; data: { to: string } }
  | { name: 'new-device-login'; data: { to: string } }
  | {
      name: 'order-placed';
      data: {
        to: string;
        orderId: string;
        itemCount: number;
        totalAmount: string;
        currency: string;
      };
    }
  | {
      name: 'order-shipped';
      data: { to: string; orderId: string; storeName: string };
    }
  | {
      name: 'order-out-for-delivery';
      data: { to: string; orderId: string; storeName: string };
    };

export type SmsJobName = SmsJob['name'];
