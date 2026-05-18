import { OtpPurpose } from '@prisma/client';
import { IsEnum, IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'phoneNumber must be E.164 format (e.g. +233241234567)',
  })
  phoneNumber!: string;

  @IsEnum(OtpPurpose, {
    message:
      'purpose must be one of PHONE_VERIFY, LOGIN, PASSWORD_RESET, CHECKOUT_CONFIRM',
  })
  purpose!: OtpPurpose;
}
