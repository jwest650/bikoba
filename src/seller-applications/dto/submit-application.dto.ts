import {
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SubmitApplicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @Matches(/^\+?\d{7,15}$/, {
    message: 'phone must be 7–15 digits, optionally prefixed with +',
  })
  phone!: string;

  @IsString()
  @Matches(/^GHA-\d{9}-\d$/, {
    message: 'ghanaCardNumber must match format GHA-XXXXXXXXX-X',
  })
  ghanaCardNumber!: string;

  @IsUrl()
  ghanaCardFront!: string;

  @IsUrl()
  ghanaCardBack!: string;

  @IsUrl()
  selfieUrl!: string;
}
