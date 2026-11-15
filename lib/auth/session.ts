import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'ohmsim_session';

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

const DEFAULT_SECRET = 'ohmsim_jwt_super_secret_development_fallback_key';

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

/**
 * Signs and creates a JWT session token with a 7-day expiration.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

/**
 * Verifies a JWT session token and returns the decoded SessionPayload, or null if invalid.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as Role,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
    };
  } catch {
    return null;
  }
}

/**
 * Standard secure cookie options for session management.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
};
