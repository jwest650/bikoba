import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireVerified } from '../auth/decorators/verified.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { SetPhoneDto } from './dto/set-phone.dto';
import { UsersService } from './users.service';

@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(EmailVerifiedGuard)
  @RequireVerified()
  @Post('phone')
  @HttpCode(HttpStatus.ACCEPTED)
  async setPhone(
    @Body() dto: SetPhoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    await this.users.setPhoneAndSendOtp(user.id, dto.phoneNumber);
    return { ok: true };
  }
}
