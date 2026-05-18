import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { AuthService, AuthResponse, AuthTokens } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RequireVerified } from './decorators/verified.decorator';
import { Roles } from './decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerifiedGuard } from './guards/email-verified.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import type {
  AuthenticatedUser,
  RefreshContext,
} from './types/jwt-payload';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  @Public()
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    return this.auth.register(dto, deviceFrom(req));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResponse> {
    return this.auth.login(dto, deviceFrom(req));
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(
    @Body() _dto: RefreshDto,
    @CurrentUser() ctx: unknown,
    @Req() req: Request,
  ): Promise<AuthTokens> {
    const refresh = ctx as RefreshContext;
    return this.auth.refresh(
      refresh.userId,
      refresh.sessionId,
      refresh.refreshToken,
      deviceFrom(req),
    );
  }

  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Body() _dto: RefreshDto, @CurrentUser() ctx: unknown): Promise<void> {
    const refresh = ctx as RefreshContext;
    await this.auth.logout(refresh.userId, refresh.sessionId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.auth.logoutAll(user.id);
  }

  @Post('me')
  @HttpCode(HttpStatus.OK)
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @Post('password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<AuthTokens> {
    return this.auth.changePassword(user.id, dto, deviceFrom(req));
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/ping')
  @HttpCode(HttpStatus.OK)
  adminOnly(): { ok: true } {
    return { ok: true };
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @Post('seller/ping')
  @HttpCode(HttpStatus.OK)
  sellerOnly(): { ok: true } {
    return { ok: true };
  }

  @Public()
  @Get('verify-email')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async verifyEmail(@Query('token') token?: string): Promise<string> {
    if (typeof token !== 'string' || token.length === 0) {
      return verificationPage(
        'Invalid link',
        'This verification link is missing a token.',
        false,
      );
    }
    try {
      await this.emailVerification.verify(token);
      return verificationPage(
        'Email confirmed',
        'Thanks — your email is now verified. You can close this tab and return to Bikoba.',
        true,
      );
    } catch {
      return verificationPage(
        'Link is invalid or expired',
        'Sign in and request a new verification email.',
        false,
      );
    }
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  async resendVerification(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    await this.emailVerification.resend(user.id);
    return { ok: true };
  }

  @UseGuards(EmailVerifiedGuard)
  @RequireVerified()
  @Post('verified/ping')
  @HttpCode(HttpStatus.OK)
  verifiedOnly(): { ok: true } {
    return { ok: true };
  }
}

function verificationPage(
  title: string,
  message: string,
  ok: boolean,
): string {
  const accent = ok ? '#16a34a' : '#dc2626';
  const bg = ok ? '#dcfce7' : '#fee2e2';
  return `<!doctype html>
<html><head><meta charset="utf-8"/><title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; background:#f7f8fa; margin:0; min-height:100vh; display:grid; place-items:center; color:#0f172a; }
  .card { background:white; border:1px solid #e4e7ec; border-radius:14px; padding:36px 40px; max-width:440px; text-align:center; box-shadow:0 1px 3px rgba(15,23,42,.06); }
  .badge { width:56px; height:56px; border-radius:50%; background:${bg}; color:${accent}; display:grid; place-items:center; margin:0 auto 18px; font-size:28px; font-weight:700; }
  h1 { margin:0 0 8px; font-size:22px; letter-spacing:-.01em; }
  p { margin:0; color:#475569; line-height:1.6; }
</style></head>
<body><div class="card"><div class="badge">${ok ? '✓' : '!'}</div><h1>${title}</h1><p>${message}</p></div></body></html>`;
}

function deviceFrom(req: Request): { userAgent?: string; ipAddress?: string } {
  const ua = req.headers['user-agent'];
  return {
    userAgent: typeof ua === 'string' ? ua.slice(0, 500) : undefined,
    ipAddress: req.ip,
  };
}
