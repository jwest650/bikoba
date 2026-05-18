import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { OtpPurpose } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from './otp.service';

@Controller('auth/otp')
export class OtpController {
  constructor(
    private readonly otp: OtpService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async send(@Body() dto: SendOtpDto): Promise<{ ok: true }> {
    await this.otp.issueAndSend({
      phoneNumber: dto.phoneNumber,
      purpose: dto.purpose,
    });
    return { ok: true };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyOtpDto): Promise<{ ok: true }> {
    const token = await this.otp.verify({
      phoneNumber: dto.phoneNumber,
      code: dto.code,
      purpose: dto.purpose,
    });

    // For phone-verify codes, mark the associated user verified.
    if (dto.purpose === OtpPurpose.PHONE_VERIFY && token.userId) {
      await this.prisma.user.update({
        where: { id: token.userId },
        data: { phoneVerifiedAt: new Date() },
      });
    }

    return { ok: true };
  }
}
