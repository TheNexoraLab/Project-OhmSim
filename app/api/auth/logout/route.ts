import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  // Clear session cookie
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
