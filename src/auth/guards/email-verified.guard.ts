import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { VERIFIED_KEY } from '../decorators/verified.decorator';
import type { AuthenticatedUser } from '../types/jwt-payload';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(VERIFIED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as AuthenticatedUser | undefined;
    if (!user?.isEmailVerified) {
      throw new ForbiddenException('Email verification required');
    }
    return true;
  }
}
