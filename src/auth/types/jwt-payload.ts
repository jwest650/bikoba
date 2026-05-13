import { Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface RefreshContext {
  userId: string;
  sessionId: string;
  refreshToken: string;
}
