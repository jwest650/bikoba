import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { SellerApplication } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireVerified } from '../auth/decorators/verified.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { SellerApplicationsService } from './seller-applications.service';

@Controller('seller-applications')
export class SellerApplicationsController {
  constructor(private readonly applications: SellerApplicationsService) {}

  @UseGuards(EmailVerifiedGuard)
  @RequireVerified()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(
    @Body() dto: SubmitApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SellerApplication> {
    return this.applications.submit(dto, user);
  }

  @Get('me')
  findMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SellerApplication | null> {
    return this.applications.findMine(user);
  }

  @Post('me/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser() user: AuthenticatedUser): Promise<SellerApplication> {
    return this.applications.cancel(user);
  }
}
