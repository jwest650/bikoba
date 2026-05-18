import { IsString, Matches } from 'class-validator';

export class SetPhoneDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'phoneNumber must be E.164 format (e.g. +233241234567)',
  })
  phoneNumber!: string;
}
