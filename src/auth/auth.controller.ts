import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { AuthService, AuthResponse, AuthTokens } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import type {
  AuthenticatedUser,
  RefreshContext,
} from './types/jwt-payload';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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
}

function deviceFrom(req: Request): { userAgent?: string; ipAddress?: string } {
  const ua = req.headers['user-agent'];
  return {
    userAgent: typeof ua === 'string' ? ua.slice(0, 500) : undefined,
    ipAddress: req.ip,
  };
}
