import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await extractSession(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    const userId: string | null = session ? session.userId : queryUserId;

    const project = await prisma.bOMProject.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                brand: true,
                price: true,
                stockQuantity: true,
                imageUrls: true,
                categoryId: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'BOM project not found.' },
        { status: 404 }
      );
    }

    if (userId && project.userId !== userId && session?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this BOM project.' },
        { status: 403 }
      );
    }

    let totalCost = 0;
    let totalComponentCount = 0;
    let allInStock = project.items.length > 0;

    const lineItems = project.items.map((item) => {
      const unitPrice = Number(item.product.price);
      const itemTotal = unitPrice * item.quantity;
      totalCost += itemTotal;
      totalComponentCount += item.quantity;

      const inStock = item.product.stockQuantity >= item.quantity;
      if (!inStock) allInStock = false;

      return {
        id: item.id,
        productId: item.productId,
        qty: item.quantity,
        referenceDesignator: item.referenceDesignator,
        product: {
          id: item.product.id,
          sku: item.product.sku,
          name: item.product.name,
          brand: item.product.brand,
          price: unitPrice,
          stock: item.product.stockQuantity,
          status: item.product.stockQuantity > 0 ? 'in-stock' : 'out-of-stock',
          image: item.product.imageUrls[0] || '/images/products/placeholder.svg',
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        targetBudget: project.targetBudget ? Number(project.targetBudget) : null,
        totalCost,
        totalComponentCount,
        allInStock,
        lineItems,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error retrieving BOM project:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve BOM project.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await extractSession(request);
    const { id } = await params;
    const body = await request.json();
    const { name, description, targetBudget, userId: bodyUserId } = body;

    const userId: string | null = session ? session.userId : bodyUserId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication is required to modify a BOM project.' },
        { status: 401 }
      );
    }

    const existing = await prisma.bOMProject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'BOM project not found.' },
        { status: 404 }
      );
    }

    if (existing.userId !== userId && session?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this BOM project.' },
        { status: 403 }
      );
    }

    const updateData: {
      name?: string;
      description?: string | null;
      targetBudget?: number | null;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Project name must be at least 2 characters.' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (targetBudget !== undefined) {
      if (targetBudget === null) {
        updateData.targetBudget = null;
      } else {
        const num = Number(targetBudget);
        if (isNaN(num) || num < 0) {
          return NextResponse.json(
            { error: 'Target budget must be a positive number.' },
            { status: 400 }
          );
        }
        updateData.targetBudget = num;
      }
    }

    const updated = await prisma.bOMProject.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        targetBudget: updated.targetBudget ? Number(updated.targetBudget) : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating BOM project:', error);
    return NextResponse.json(
      { error: 'Failed to update BOM project.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await extractSession(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    const userId: string | null = session ? session.userId : queryUserId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication is required to delete a BOM project.' },
        { status: 401 }
      );
    }

    const existing = await prisma.bOMProject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'BOM project not found.' },
        { status: 404 }
      );
    }

    if (existing.userId !== userId && session?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this BOM project.' },
        { status: 403 }
      );
    }

    await prisma.bOMProject.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'BOM project deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting BOM project:', error);
    return NextResponse.json(
      { error: 'Failed to delete BOM project.' },
      { status: 500 }
    );
  }
}
