import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import type { StockStatus } from '@/types/product';

function determineStockStatus(stock: number, minThreshold: number): StockStatus {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= minThreshold) return 'low-stock';
  return 'in-stock';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const outOfStockOnly = searchParams.get('outOfStockOnly') === 'true';

    const products = await prisma.product.findMany({
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { stockQuantity: 'asc' },
    });

    let items = products.map((prod) => {
      const stock = prod.stockQuantity;
      const minThreshold = prod.minStockThreshold;
      const status = determineStockStatus(stock, minThreshold);

      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        category: prod.category.name,
        stock,
        minThreshold,
        status,
        price: Number(prod.price),
        updatedAt: prod.updatedAt.toISOString(),
      };
    });

    if (outOfStockOnly) {
      items = items.filter((i) => i.status === 'out-of-stock');
    } else if (lowStockOnly) {
      items = items.filter((i) => i.status === 'low-stock' || i.status === 'out-of-stock');
    }

    const lowStockCount = items.filter((i) => i.status === 'low-stock').length;
    const outOfStockCount = items.filter((i) => i.status === 'out-of-stock').length;

    return NextResponse.json({
      items,
      total: items.length,
      metrics: {
        totalSKUs: products.length,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/inventory:', error);
    return NextResponse.json({ error: 'Failed to retrieve inventory.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { productId, sku, type, quantity, reason } = body;

    if (!productId && !sku) {
      return NextResponse.json(
        { error: 'Either productId or sku must be provided.' },
        { status: 400 }
      );
    }

    if (!type || !['ADD', 'REMOVE', 'SET'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid adjustment type. Must be 'ADD', 'REMOVE', or 'SET'." },
        { status: 400 }
      );
    }

    const qty = parseInt(String(quantity), 10);
    if (isNaN(qty) || qty < 0) {
      return NextResponse.json(
        { error: 'Quantity must be a non-negative integer.' },
        { status: 400 }
      );
    }

    // Find the product
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          productId ? { id: String(productId) } : {},
          sku ? { sku: String(sku).toUpperCase() } : {},
        ],
      },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const previousStock = product.stockQuantity;
    let newStock = previousStock;

    if (type === 'ADD') {
      newStock = previousStock + qty;
    } else if (type === 'REMOVE') {
      newStock = Math.max(0, previousStock - qty);
    } else if (type === 'SET') {
      newStock = qty;
    }

    // Update stock in database
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { stockQuantity: newStock },
      include: { category: true },
    });

    const status = determineStockStatus(newStock, updated.minStockThreshold);

    return NextResponse.json({
      success: true,
      sku: updated.sku,
      productName: updated.name,
      previousStock,
      newStock,
      status,
      adjustment: {
        type,
        quantity: qty,
        reason: reason || 'Inventory update',
        timestamp: new Date().toISOString(),
      },
      message: `Stock for ${updated.sku} adjusted from ${previousStock} to ${newStock}.`,
    });
  } catch (error) {
    console.error('Error in PATCH /api/inventory:', error);
    return NextResponse.json({ error: 'Failed to adjust inventory.' }, { status: 500 });
  }
}
