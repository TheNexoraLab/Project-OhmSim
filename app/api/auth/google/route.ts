import { NextResponse } from 'next/server';
import { getAppOrigin, initiateGoogleSocialLogin } from '@/lib/auth/neon-auth';

export async function GET(request: Request) {
  try {
    const origin = getAppOrigin(request);
    const callbackUrl = `${origin}/api/auth/callback/neon`;

    const result = await initiateGoogleSocialLogin(callbackUrl);

    if (!result.success || !result.url) {
      console.error('Neon Auth Google initiation error:', result.error);
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', result.error || 'Could not connect to Google login service.');
      return NextResponse.redirect(loginUrl.toString(), 302);
    }

    const { searchParams } = new URL(request.url);
    if (searchParams.get('format') === 'json' || request.headers.get('accept')?.includes('application/json')) {
      return NextResponse.json({ url: result.url });
    }

    return NextResponse.redirect(result.url, 302);
  } catch (err: unknown) {
    console.error('Unexpected error in GET /api/auth/google:', err);
    const origin = getAppOrigin(request);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'An unexpected error occurred while starting Google sign-in.');
    return NextResponse.redirect(loginUrl.toString(), 302);
  }
}
