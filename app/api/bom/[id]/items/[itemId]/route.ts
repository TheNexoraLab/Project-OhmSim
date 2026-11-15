import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await extractSession(request);
    const { id: bomProjectId, itemId } = await params;
    const body = await request.json();
    const { quantity, referenceDesignator, userId: bodyUserId } = body;

    const userId: string | null = session ? session.userId : bodyUserId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication is required to modify a BOM item.' },
        { status: 401 }
      );
    }

    const project = await prisma.bOMProject.findUnique({
      where: { id: bomProjectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'BOM project not found.' },
        { status: 404 }
      );
    }

    if (project.userId !== userId && session?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this BOM project.' },
        { status: 403 }
      );
    }

    const item = await prisma.bOMItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.bomProjectId !== bomProjectId) {
      return NextResponse.json(
        { error: 'BOM item not found in this project.' },
        { status: 404 }
      );
    }

    if (quantity !== undefined && Number(quantity) <= 0) {
      await prisma.bOMItem.delete({ where: { id: itemId } });
    } else {
      const updateData: { quantity?: number; referenceDesignator?: string | null } = {};
      if (quantity !== undefined) {
        updateData.quantity = Math.max(1, parseInt(String(quantity), 10) || 1);
      }
      if (referenceDesignator !== undefined) {
        updateData.referenceDesignator = referenceDesignator
          ? String(referenceDesignator).trim()
          : null;
      }
      await prisma.bOMItem.update({
        where: { id: itemId },
        data: updateData,
      });
    }

    await prisma.bOMProject.update({
      where: { id: bomProjectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'BOM item updated successfully.',
    });
  } catch (error) {
    console.error('Error modifying BOM item:', error);
    return NextResponse.json(
      { error: 'Failed to modify BOM item.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await extractSession(request);
    const { id: bomProjectId, itemId } = await params;
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    const userId: string | null = session ? session.userId : queryUserId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication is required to delete a BOM item.' },
        { status: 401 }
      );
    }

    const project = await prisma.bOMProject.findUnique({
      where: { id: bomProjectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'BOM project not found.' },
        { status: 404 }
      );
    }

    if (project.userId !== userId && session?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this BOM project.' },
        { status: 403 }
      );
    }

    const item = await prisma.bOMItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.bomProjectId !== bomProjectId) {
      return NextResponse.json(
        { error: 'BOM item not found in this project.' },
        { status: 404 }
      );
    }

    await prisma.bOMItem.delete({ where: { id: itemId } });

    await prisma.bOMProject.update({
      where: { id: bomProjectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'BOM item deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting BOM item:', error);
    return NextResponse.json(
      { error: 'Failed to delete BOM item.' },
      { status: 500 }
    );
  }
}
