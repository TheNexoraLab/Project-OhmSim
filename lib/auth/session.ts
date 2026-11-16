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
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be set in production mode.');
    }
    return new TextEncoder().encode(DEFAULT_SECRET);
  }
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

/**
 * Extracts and verifies session payload from Request headers (Authorization or Cookie)
 * or Next.js cookies(). Returns null if unauthenticated.
 */
export async function extractSession(request?: Request): Promise<SessionPayload | null> {
  if (request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.substring(7).trim();
      const session = await verifySessionToken(token);
      if (session) return session;
    }

    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
      if (match && match[1]) {
        const session = await verifySessionToken(decodeURIComponent(match[1]));
        if (session) return session;
      }
    }
  }

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const session = await verifySessionToken(token);
      if (session) return session;
    }
  } catch {
    // Non-Next context or headers not available
  }

  return null;
}
