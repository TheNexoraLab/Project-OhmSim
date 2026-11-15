import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await extractSession(request);
    const { id: bomProjectId } = await params;
    const body = await request.json();
    const { productId, quantity = 1, referenceDesignator, userId: bodyUserId } = body;

    const userId: string | null = session ? session.userId : bodyUserId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication is required to add items to a BOM project.' },
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

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'Product ID is required.' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found in catalog.' },
        { status: 404 }
      );
    }

    const qty = Math.max(1, parseInt(String(quantity), 10) || 1);

    const existingItem = await prisma.bOMItem.findFirst({
      where: {
        bomProjectId,
        productId,
      },
    });

    if (existingItem) {
      const newRef = referenceDesignator
        ? existingItem.referenceDesignator
          ? `${existingItem.referenceDesignator}, ${referenceDesignator}`
          : referenceDesignator
        : existingItem.referenceDesignator;

      await prisma.bOMItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + qty,
          referenceDesignator: newRef,
        },
      });
    } else {
      await prisma.bOMItem.create({
        data: {
          bomProjectId,
          productId,
          quantity: qty,
          referenceDesignator: referenceDesignator ? String(referenceDesignator).trim() : null,
        },
      });
    }

    await prisma.bOMProject.update({
      where: { id: bomProjectId },
      data: { updatedAt: new Date() },
    });

    const refreshed = await prisma.bOMProject.findUnique({
      where: { id: bomProjectId },
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

    if (!refreshed) {
      return NextResponse.json(
        { error: 'Failed to reload BOM project.' },
        { status: 500 }
      );
    }

    let totalCost = 0;
    let totalComponentCount = 0;
    let allInStock = refreshed.items.length > 0;

    const lineItems = refreshed.items.map((item) => {
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
        id: refreshed.id,
        name: refreshed.name,
        description: refreshed.description,
        targetBudget: refreshed.targetBudget ? Number(refreshed.targetBudget) : null,
        totalCost,
        totalComponentCount,
        allInStock,
        lineItems,
        createdAt: refreshed.createdAt.toISOString(),
        updatedAt: refreshed.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error adding item to BOM project:', error);
    return NextResponse.json(
      { error: 'Failed to add item to BOM project.' },
      { status: 500 }
    );
  }
}
