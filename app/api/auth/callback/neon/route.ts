import { NextResponse } from 'next/server';
import {
  getAppOrigin,
  resolveNeonSessionByToken,
  getLatestNeonSession,
  syncNeonUserToOhmSim,
} from '@/lib/auth/neon-auth';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/auth/session';

export async function GET(request: Request) {
  const origin = getAppOrigin(request);
  const url = new URL(request.url);

  // 1. Check for incoming OAuth errors
  const errorParam = url.searchParams.get('error') || url.searchParams.get('error_description');
  if (errorParam) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', errorParam);
    return NextResponse.redirect(loginUrl.toString(), 302);
  }

  // 2. Extract potential session token from query parameters or cookies
  const tokenFromQuery =
    url.searchParams.get('token') ||
    url.searchParams.get('session_token') ||
    url.searchParams.get('neon_token');

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)(?:better-auth\.session_token|neon_auth\.session)=([^;]+)/);
  const tokenFromCookie = match && match[1] ? decodeURIComponent(match[1]) : null;

  const targetToken = tokenFromQuery || tokenFromCookie;

  let neonSession = null;
  if (targetToken) {
    neonSession = await resolveNeonSessionByToken(targetToken);
  }

  // Fallback: check most recent active session in neon_auth created within 5 minutes
  if (!neonSession) {
    neonSession = await getLatestNeonSession();
  }

  // In non-production testing, allow mock_email override for deterministic CI verification
  if (!neonSession && process.env.NODE_ENV !== 'production') {
    const mockEmail = url.searchParams.get('mock_email');
    if (mockEmail) {
      neonSession = {
        neonUserId: crypto.randomUUID(),
        email: mockEmail,
        name: url.searchParams.get('mock_name') || 'Mock Google User',
        image: null,
      };
    }
  }

  if (!neonSession || !neonSession.email) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set(
      'error',
      'Google authentication completed, but session could not be verified. Please try again.'
    );
    return NextResponse.redirect(loginUrl.toString(), 302);
  }

  try {
    // 3. Synchronize user into OhmSim Prisma User table
    const ohmSimUser = await syncNeonUserToOhmSim(neonSession);

    // 4. Issue OhmSim 7-day JWT session cookie
    const token = await createSessionToken({
      userId: ohmSimUser.id,
      email: ohmSimUser.email,
      role: ohmSimUser.role,
      firstName: ohmSimUser.firstName,
      lastName: ohmSimUser.lastName,
    });

    const destination = ohmSimUser.role === 'ADMIN' ? '/admin' : '/home';
    const redirectUrl = new URL(destination, origin);
    const response = NextResponse.redirect(redirectUrl.toString(), 302);

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (syncError: unknown) {
    console.error('Failed to sync Neon Auth user to OhmSim:', syncError);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'Failed to synchronize user account. Please contact support.');
    return NextResponse.redirect(loginUrl.toString(), 302);
  }
}
