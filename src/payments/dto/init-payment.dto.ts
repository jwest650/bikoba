import { PaymentProvider } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class InitPaymentDto {
  @IsUUID()
  orderId!: string;

  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;
}
