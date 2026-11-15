import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';
import type { ConversationStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await extractSession(request);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: `Conversation '${id}' not found.` },
        { status: 404 }
      );
    }

    if (session && session.role === 'BUYER' && conversation.buyerId !== session.userId) {
      return NextResponse.json(
        { error: 'You are not authorized to access this conversation.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        buyerId: conversation.buyerId,
        status: conversation.status,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        buyer: conversation.buyer,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderName: `${m.sender.firstName} ${m.sender.lastName}`.trim(),
          senderRole: m.senderRole,
          from: m.senderRole === 'BUYER' ? 'buyer' : 'admin',
          text: m.text,
          attachmentUrl: m.attachmentUrl || null,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/conversations/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['ACTIVE', 'RESOLVED'].includes(status.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid status. Must be either 'ACTIVE' or 'RESOLVED'." },
        { status: 400 }
      );
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        status: status.toUpperCase() as ConversationStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Conversation status updated to ${updated.status}.`,
      conversation: updated,
    });
  } catch (error) {
    console.error('Error in PATCH /api/conversations/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation status.' },
      { status: 500 }
    );
  }
}
