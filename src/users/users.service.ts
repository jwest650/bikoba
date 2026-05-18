import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OtpPurpose, Prisma } from '@prisma/client';
import { OtpService } from '../sms/otp.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
  ) {}

  /**
   * Set (or update) the user's phone number. The number is stored unverified;
   * the user must enter the OTP we just sent to flip phoneVerifiedAt.
   */
  async setPhoneAndSendOtp(userId: string, phoneNumber: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phoneNumber: true, phoneVerifiedAt: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If they're swapping numbers, clear the verification flag.
    const isChange = user.phoneNumber !== phoneNumber;

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          phoneNumber,
          phoneVerifiedAt: isChange ? null : user.phoneVerifiedAt,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'This phone number is already linked to another account',
        );
      }
      throw err;
    }

    await this.otp.issueAndSend({
      phoneNumber,
      purpose: OtpPurpose.PHONE_VERIFY,
      userId,
    });
  }
}
