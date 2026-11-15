import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const session = await extractSession(request);
    const { searchParams } = new URL(request.url);

    const queryUserId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const skip = (page - 1) * limit;

    // Resolve target userId
    let userId: string | undefined = undefined;
    if (session) {
      userId = session.userId;
    } else if (queryUserId) {
      userId = queryUserId;
    } else {
      return NextResponse.json(
        { error: 'Authentication or userId query parameter is required to view notifications.' },
        { status: 401 }
      );
    }

    const whereClause: Record<string, unknown> = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const formatted = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.isRead,
      link: n.link || undefined,
      timestamp: n.createdAt.toISOString(),
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({
      notifications: formatted,
      unreadCount,
      pagination: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notifications.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await extractSession(request);
    const body = await request.json();
    const { userId: bodyUserId, title, message, type, link } = body;

    const targetUserId = bodyUserId || session?.userId;
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target userId is required to create a notification.' },
        { status: 400 }
      );
    }

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Notification title and message are required.' },
        { status: 400 }
      );
    }

    const validTypes = ['order', 'inventory', 'system', 'chat'];
    const notifType = validTypes.includes(type) ? type : 'system';

    const created = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        link: link?.trim() || null,
        isRead: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        notification: {
          id: created.id,
          title: created.title,
          message: created.message,
          type: created.type,
          read: created.isRead,
          link: created.link || undefined,
          timestamp: created.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/notifications:', error);
    return NextResponse.json(
      { error: 'Failed to create notification.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
        { error: 'Authentication or userId is required.' },
        { status: 401 }
      );
    }

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Marked ${result.count} notifications as read.`,
    });
  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
        { error: 'Authentication or userId is required.' },
        { status: 401 }
      );
    }

    const result = await prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Cleared ${result.count} read notifications.`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear read notifications.' },
      { status: 500 }
    );
  }
}
