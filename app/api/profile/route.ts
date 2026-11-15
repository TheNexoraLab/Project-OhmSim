import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const session = await extractSession(request);
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    let userId: string;
    if (session) {
      userId = session.userId;
    } else if (queryUserId) {
      userId = queryUserId;
    } else {
      return NextResponse.json(
        { error: 'Authentication or userId is required to view profile.' },
        { status: 401 }
      );
    }

    const [user, addresses, totalOrders, pendingOrders, processingOrders, completedOrders, bomProjectsCount, unreadNotificationsCount] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.address.findMany({
          where: { userId },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.order.count({ where: { userId } }),
        prisma.order.count({ where: { userId, status: 'PENDING' } }),
        prisma.order.count({ where: { userId, status: 'PROCESSING' } }),
        prisma.order.count({ where: { userId, status: 'DELIVERED' } }),
        prisma.bOMProject.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

    if (!user) {
      return NextResponse.json({ error: `User with ID '${userId}' not found.` }, { status: 404 });
    }

    const formattedAddresses = addresses.map((addr) => ({
      id: addr.id,
      label: addr.label,
      recipientName: addr.recipientName,
      contactNumber: addr.phone,
      region: 'Region III',
      province: addr.province,
      cityMunicipality: addr.city,
      barangay: addr.barangay,
      streetAddress: addr.street,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
      fullAddress: `${addr.street}, ${addr.barangay}, ${addr.city}, ${addr.province}, Region III`,
      createdAt: addr.createdAt.toISOString(),
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        mobile: user.phone || '',
        phone: user.phone || '',
        role: user.role,
        memberSince: user.createdAt.toISOString(),
        createdAt: user.createdAt.toISOString(),
      },
      addresses: formattedAddresses,
      stats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        bomProjectsCount,
        unreadNotificationsCount,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while retrieving user profile.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await extractSession(request);
    const body = await request.json();
    const { firstName, lastName, phone, mobile, userId: bodyUserId } = body;

    let userId: string;
    if (session) {
      userId = session.userId;
    } else if (bodyUserId) {
      userId = bodyUserId;
    } else {
      return NextResponse.json(
        { error: 'Authentication required to update profile.' },
        { status: 401 }
      );
    }

    const updateData: Record<string, string> = {};

    if (firstName !== undefined) {
      if (!firstName.trim()) {
        return NextResponse.json({ error: 'First name cannot be empty.' }, { status: 400 });
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        return NextResponse.json({ error: 'Last name cannot be empty.' }, { status: 400 });
      }
      updateData.lastName = lastName.trim();
    }

    const contactPhone = phone !== undefined ? phone : mobile;
    if (contactPhone !== undefined) {
      const cleanPhone = contactPhone.trim();
      if (cleanPhone && !/^09\d{9}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Contact number must be a valid 11-digit Philippine mobile number starting with 09 (e.g., 09171234567).' },
          { status: 400 }
        );
      }
      updateData.phone = cleanPhone || '';
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
        mobile: updatedUser.phone || '',
        phone: updatedUser.phone || '',
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile.' },
      { status: 500 }
    );
  }
}
