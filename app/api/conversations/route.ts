import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';
import type { ConversationStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await extractSession(request);
    const { searchParams } = new URL(request.url);

    const queryUserId = searchParams.get('userId');
    const queryStatus = searchParams.get('status')?.toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const skip = (page - 1) * limit;

    // Check if buyer mode
    const isBuyer = session ? session.role === 'BUYER' : searchParams.get('role') === 'BUYER' || (!queryStatus && queryUserId);
    const targetUserId = session?.userId || queryUserId;

    if (isBuyer) {
      if (!targetUserId) {
        return NextResponse.json(
          { error: 'Authentication or userId is required to access support chat.' },
          { status: 401 }
        );
      }

      // Find or create active conversation for buyer
      let conversation = await prisma.conversation.findFirst({
        where: {
          buyerId: targetUserId,
          status: 'ACTIVE',
        },
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
          buyer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      // If no active conversation exists, automatically initiate one with support greeting
      if (!conversation) {
        // Find an admin user to be the sender of the welcome greeting
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        const adminSenderId = adminUser ? adminUser.id : targetUserId;

        conversation = await prisma.conversation.create({
          data: {
            buyerId: targetUserId,
            status: 'ACTIVE',
            messages: {
              create: [
                {
                  senderId: adminSenderId,
                  senderRole: 'ADMIN',
                  text: 'Hello! Welcome to OhmSim Customer Support. How can we help you with your components, BOM projects, or orders today?',
                },
              ],
            },
          },
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
            buyer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        });
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
    }

    // Admin Mode: List conversations
    const whereClause: Record<string, unknown> = {};
    if (queryStatus && ['ACTIVE', 'RESOLVED'].includes(queryStatus)) {
      whereClause.status = queryStatus as ConversationStatus;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
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
            orderBy: { createdAt: 'desc' },
            take: 1,
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
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.conversation.count({ where: whereClause }),
    ]);

    const formatted = conversations.map((c) => {
      const lastMsg = c.messages[0];
      return {
        id: c.id,
        buyerId: c.buyerId,
        buyerName: `${c.buyer.firstName} ${c.buyer.lastName}`.trim(),
        buyerEmail: c.buyer.email,
        buyerPhone: c.buyer.phone || '',
        status: c.status,
        messageCount: c._count.messages,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              text: lastMsg.text,
              senderRole: lastMsg.senderRole,
              createdAt: lastMsg.createdAt.toISOString(),
            }
          : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      conversations: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversations.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await extractSession(request);
    const body = await request.json();
    const { buyerId: bodyBuyerId, initialMessage } = body;

    const buyerId = bodyBuyerId || session?.userId;
    if (!buyerId) {
      return NextResponse.json(
        { error: 'Buyer ID is required to create a conversation.' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id: buyerId } });
    if (!targetUser) {
      return NextResponse.json(
        { error: `User with ID '${buyerId}' not found.` },
        { status: 404 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        buyerId,
        status: 'ACTIVE',
        ...(initialMessage
          ? {
              messages: {
                create: [
                  {
                    senderId: buyerId,
                    senderRole: targetUser.role,
                    text: initialMessage.trim(),
                  },
                ],
              },
            }
          : {}),
      },
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
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        conversation: {
          id: conversation.id,
          buyerId: conversation.buyerId,
          status: conversation.status,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
          buyer: conversation.buyer,
          messages: conversation.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: `${m.sender.firstName} ${m.sender.lastName}`.trim(),
            senderRole: m.senderRole,
            text: m.text,
            createdAt: m.createdAt.toISOString(),
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/conversations:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation.' },
      { status: 500 }
    );
  }
}
