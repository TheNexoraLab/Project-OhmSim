import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import type { Prisma } from '@prisma/client';
import type { StockStatus } from '@/types/product';

function determineStockStatus(stock: number, minThreshold: number): StockStatus {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= minThreshold) return 'low-stock';
  return 'in-stock';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search')?.trim();
    const inStockOnly = searchParams.get('inStockOnly') === 'true';
    const isFeatured = searchParams.get('isFeatured') === 'true';
    const sortParam = searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Build Prisma query filter
    const where: Prisma.ProductWhereInput = {};

    if (categoryParam && categoryParam.toLowerCase() !== 'all') {
      where.category = {
        OR: [
          { slug: categoryParam.toLowerCase() },
          { name: { equals: categoryParam, mode: 'insensitive' } },
        ],
      };
    }

    if (searchParam) {
      where.OR = [
        { name: { contains: searchParam, mode: 'insensitive' } },
        { sku: { contains: searchParam, mode: 'insensitive' } },
        { brand: { contains: searchParam, mode: 'insensitive' } },
        { shortDescription: { contains: searchParam, mode: 'insensitive' } },
      ];
    }

    if (inStockOnly) {
      where.stockQuantity = { gt: 0 };
    }

    if (isFeatured) {
      where.isFeatured = true;
    }

    // Determine sorting order
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sortParam) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
      case 'name-desc':
        orderBy = { name: 'desc' };
        break;
      case 'stock-desc':
        orderBy = { stockQuantity: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const formattedProducts = products.map((prod) => {
      const priceNum = Number(prod.price);
      const stock = prod.stockQuantity;
      const minThreshold = prod.minStockThreshold;
      const status = determineStockStatus(stock, minThreshold);
      const firstImage = prod.imageUrls[0] || '/images/placeholder.jpg';

      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        label: prod.name,
        brand: prod.brand,
        categoryId: prod.categoryId,
        category: prod.category.name,
        categorySlug: prod.category.slug,
        price: priceNum,
        stock,
        status,
        minThreshold,
        image: firstImage,
        images: prod.imageUrls,
        specs: (prod.specifications as Record<string, string>) || {},
        about: prod.fullDescription,
        shortDescription: prod.shortDescription,
        datasheetUrl: prod.datasheetUrl || '',
        isFeatured: prod.isFeatured,
        createdAt: prod.createdAt.toISOString(),
        updatedAt: prod.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve products.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sku,
      name,
      brand,
      categoryId,
      price,
      stockQuantity = 0,
      minStockThreshold = 5,
      isFeatured = false,
      shortDescription,
      fullDescription,
      datasheetUrl,
      imageUrls = [],
      specifications = {},
    } = body;

    // Validation
    if (!sku || typeof sku !== 'string' || !name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Product SKU and Name are required.' },
        { status: 400 }
      );
    }

    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json(
        { error: 'Valid categoryId is required.' },
        { status: 400 }
      );
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json(
        { error: 'Valid positive price is required.' },
        { status: 400 }
      );
    }

    const cleanSku = sku.trim().toUpperCase();

    // Check duplicate SKU
    const existingSku = await prisma.product.findUnique({
      where: { sku: cleanSku },
    });

    if (existingSku) {
      return NextResponse.json(
        { error: `Product SKU '${cleanSku}' already exists.` },
        { status: 409 }
      );
    }

    // Verify category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return NextResponse.json(
        { error: `Category with ID '${categoryId}' not found.` },
        { status: 404 }
      );
    }

    const product = await prisma.product.create({
      data: {
        sku: cleanSku,
        name: name.trim(),
        brand: (brand || 'OhmSim').trim(),
        categoryId,
        price: Number(price),
        stockQuantity: Math.max(0, parseInt(String(stockQuantity), 10) || 0),
        minStockThreshold: Math.max(0, parseInt(String(minStockThreshold), 10) || 5),
        isFeatured: Boolean(isFeatured),
        shortDescription: (shortDescription || name).trim(),
        fullDescription: (fullDescription || shortDescription || name).trim(),
        datasheetUrl: datasheetUrl?.trim() || null,
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        specifications: specifications || {},
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      {
        product,
        message: 'Product created successfully.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json(
      { error: 'Failed to create product.' },
      { status: 500 }
    );
  }
}
