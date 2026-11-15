import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await extractSession(request);
    const body = await request.json().catch(() => ({}));
    const isRead = typeof body.isRead === 'boolean' ? body.isRead : true;

    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Notification '${id}' not found.` },
        { status: 404 }
      );
    }

    if (session && session.role === 'BUYER' && existing.userId !== session.userId) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this notification.' },
        { status: 403 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead },
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: updated.id,
        title: updated.title,
        message: updated.message,
        type: updated.type,
        read: updated.isRead,
        link: updated.link || undefined,
        timestamp: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/notifications/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update notification.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await extractSession(request);

    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Notification '${id}' not found.` },
        { status: 404 }
      );
    }

    if (session && session.role === 'BUYER' && existing.userId !== session.userId) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this notification.' },
        { status: 403 }
      );
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification dismissed successfully.',
    });
  } catch (error) {
    console.error('Error in DELETE /api/notifications/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification.' },
      { status: 500 }
    );
  }
}
