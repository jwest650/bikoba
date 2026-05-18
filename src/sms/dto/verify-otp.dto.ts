import { OtpPurpose } from '@prisma/client';
import { IsEnum, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'phoneNumber must be E.164 format (e.g. +233241234567)',
  })
  phoneNumber!: string;

  @IsString()
  @Length(6, 6, { message: 'code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  code!: string;

  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}
