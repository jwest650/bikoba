import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentProvider, Role, type Payment } from '@prisma/client';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireVerified } from '../auth/decorators/verified.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload';
import { InitPaymentDto } from './dto/init-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentsService, type InitiateResult } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @UseGuards(EmailVerifiedGuard)
  @RequireVerified()
  @Post('init')
  @HttpCode(HttpStatus.CREATED)
  initiate(
    @Body() dto: InitPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InitiateResult> {
    return this.payments.initiate(dto, user);
  }

  // Public so the post-PSP redirect (which doesn't carry our JWT) can
  // re-sync state. The reference itself is an unguessable id.
  @Public()
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Query('reference') reference: string): Promise<Payment> {
    return this.payments.verify(reference);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundPaymentDto,
  ): Promise<Payment> {
    return this.payments.refund(id, dto);
  }

  @Public()
  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Param('provider', new ParseEnumPipe(PaymentProvider))
    provider: PaymentProvider,
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | undefined>,
  ): Promise<{ ok: boolean }> {
    const rawBody = req.rawBody?.toString('utf8') ?? '';
    return this.payments.handleWebhook(provider, headers, rawBody);
  }
}
