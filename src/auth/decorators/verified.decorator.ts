import { SetMetadata } from '@nestjs/common';

export const VERIFIED_KEY = 'requiresVerifiedEmail';
export const RequireVerified = (): MethodDecorator & ClassDecorator =>
  SetMetadata(VERIFIED_KEY, true);
