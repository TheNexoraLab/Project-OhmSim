import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import type { StockStatus } from '@/types/product';

function determineStockStatus(stock: number, minThreshold: number): StockStatus {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= minThreshold) return 'low-stock';
  return 'in-stock';
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Search by ID or SKU
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { sku: id.toUpperCase() }],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: `Product '${id}' not found.` }, { status: 404 });
    }

    const priceNum = Number(product.price);
    const stock = product.stockQuantity;
    const minThreshold = product.minStockThreshold;
    const status = determineStockStatus(stock, minThreshold);

    return NextResponse.json({
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        label: product.name,
        brand: product.brand,
        categoryId: product.categoryId,
        category: product.category.name,
        categorySlug: product.category.slug,
        price: priceNum,
        stock,
        status,
        minThreshold,
        image: product.imageUrls[0] || '/images/placeholder.jpg',
        images: product.imageUrls,
        specs: (product.specifications as Record<string, string>) || {},
        about: product.fullDescription,
        shortDescription: product.shortDescription,
        datasheetUrl: product.datasheetUrl || '',
        isFeatured: product.isFeatured,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error);
    return NextResponse.json({ error: 'Failed to retrieve product.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { sku: id.toUpperCase() }],
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: `Product '${id}' not found.` }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.brand !== undefined) updateData.brand = String(body.brand).trim();
    if (body.categoryId !== undefined) updateData.categoryId = String(body.categoryId);
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.stockQuantity !== undefined) updateData.stockQuantity = Math.max(0, parseInt(String(body.stockQuantity), 10));
    if (body.minStockThreshold !== undefined) updateData.minStockThreshold = Math.max(0, parseInt(String(body.minStockThreshold), 10));
    if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);
    if (body.shortDescription !== undefined) updateData.shortDescription = String(body.shortDescription).trim();
    if (body.fullDescription !== undefined) updateData.fullDescription = String(body.fullDescription).trim();
    if (body.datasheetUrl !== undefined) updateData.datasheetUrl = String(body.datasheetUrl).trim();
    if (body.imageUrls !== undefined && Array.isArray(body.imageUrls)) updateData.imageUrls = body.imageUrls;
    if (body.specifications !== undefined) updateData.specifications = body.specifications;

    const updated = await prisma.product.update({
      where: { id: existingProduct.id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      product: updated,
      message: 'Product updated successfully.',
    });
  } catch (error) {
    console.error('Error in PATCH /api/products/[id]:', error);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { sku: id.toUpperCase() }],
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: `Product '${id}' not found.` }, { status: 404 });
    }

    // Check if product is part of any orders
    const orderItemCount = await prisma.orderItem.count({
      where: { productId: existingProduct.id },
    });

    if (orderItemCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product because it is associated with existing customer orders.' },
        { status: 409 }
      );
    }

    await prisma.product.delete({
      where: { id: existingProduct.id },
    });

    return NextResponse.json({ success: true, message: `Product '${existingProduct.sku}' deleted successfully.` });
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
}
