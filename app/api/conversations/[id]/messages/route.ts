import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';
import type { Role } from '@prisma/client';

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
        { error: 'You are not authorized to view messages in this conversation.' },
        { status: 403 }
      );
    }

    const formatted = conversation.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: `${m.sender.firstName} ${m.sender.lastName}`.trim(),
      senderRole: m.senderRole,
      from: m.senderRole === 'BUYER' ? 'buyer' : 'admin',
      text: m.text,
      attachmentUrl: m.attachmentUrl || null,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({
      messages: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error('Error in GET /api/conversations/[id]/messages:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve messages.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await extractSession(request);
    const body = await request.json();
    const { text, attachmentUrl, senderId: bodySenderId, senderRole: bodySenderRole } = body;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: `Conversation '${id}' not found.` },
        { status: 404 }
      );
    }

    const cleanText = text?.trim() || '';
    const cleanAttachment = attachmentUrl?.trim() || null;

    if (!cleanText && !cleanAttachment) {
      return NextResponse.json(
        { error: 'Message text or attachmentUrl is required.' },
        { status: 400 }
      );
    }

    let senderId: string;
    let senderRole: Role;

    if (session) {
      senderId = session.userId;
      senderRole = session.role;
    } else if (bodySenderId) {
      const senderUser = await prisma.user.findUnique({ where: { id: bodySenderId } });
      if (!senderUser) {
        return NextResponse.json(
          { error: `Sender with ID '${bodySenderId}' not found.` },
          { status: 404 }
        );
      }
      senderId = senderUser.id;
      senderRole = bodySenderRole || senderUser.role;
    } else {
      return NextResponse.json(
        { error: 'Authentication or senderId is required to send a message.' },
        { status: 401 }
      );
    }

    // Interactive Transaction: Create message, update conversation timestamp, trigger notification
    const result = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          conversationId: id,
          senderId,
          senderRole,
          text: cleanText,
          attachmentUrl: cleanAttachment,
        },
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
      });

      await tx.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      // If message is from ADMIN, create notification for BUYER
      if (senderRole === 'ADMIN' && conversation.buyerId !== senderId) {
        await tx.notification.create({
          data: {
            userId: conversation.buyerId,
            title: 'New Message from OhmSim Support',
            message: cleanText ? cleanText.slice(0, 120) : 'Sent an attachment',
            type: 'chat',
            link: '/chat',
          },
        });
      }

      return createdMessage;
    }, { maxWait: 10000, timeout: 20000 });

    return NextResponse.json(
      {
        success: true,
        message: {
          id: result.id,
          conversationId: result.conversationId,
          senderId: result.senderId,
          senderName: `${result.sender.firstName} ${result.sender.lastName}`.trim(),
          senderRole: result.senderRole,
          from: result.senderRole === 'BUYER' ? 'buyer' : 'admin',
          text: result.text,
          attachmentUrl: result.attachmentUrl || null,
          createdAt: result.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/conversations/[id]/messages:', error);
    return NextResponse.json(
      { error: 'Failed to send message.' },
      { status: 500 }
    );
  }
}
