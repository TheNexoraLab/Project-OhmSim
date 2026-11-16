import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { hashPassword } from '@/lib/auth/password';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';
import { signUpWithNeonAuth, getAppOrigin } from '@/lib/auth/neon-auth';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, contactNumber, password } = body;

    // 1. Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Full name is required and must be at least 2 characters.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password is required and must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Check for duplicate account
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Split full name into firstName and lastName
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // 5. Create user in PostgreSQL
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        role: 'BUYER',
        firstName,
        lastName,
        phone: typeof contactNumber === 'string' && contactNumber.trim() ? contactNumber.trim() : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // 6. Register user in Neon Managed Better Auth
    try {
      await signUpWithNeonAuth({
        email: cleanEmail,
        password,
        name: fullName.trim(),
        origin: getAppOrigin(request),
      });
    } catch (neonErr) {
      console.warn('Neon Auth registration sync notice:', neonErr);
    }

    // 6. Create session token & set HttpOnly cookie
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const response = NextResponse.json(
      {
        user,
        message: 'Account created successfully.',
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('Error in POST /api/auth/register:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
