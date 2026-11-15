import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';

export async function GET(request: Request) {
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
        { error: 'Authentication or userId is required to view BOM projects.' },
        { status: 401 }
      );
    }

    const projects = await prisma.bOMProject.findMany({
      where: { userId },
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
      orderBy: { updatedAt: 'desc' },
    });

    const enriched = projects.map((proj) => {
      let totalCost = 0;
      let totalComponentCount = 0;
      let allInStock = proj.items.length > 0;

      const lineItems = proj.items.map((item) => {
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

      return {
        id: proj.id,
        name: proj.name,
        description: proj.description,
        targetBudget: proj.targetBudget ? Number(proj.targetBudget) : null,
        totalCost,
        totalComponentCount,
        allInStock,
        lineItems,
        createdAt: proj.createdAt.toISOString(),
        updatedAt: proj.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error('Error fetching BOM projects:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve BOM projects.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await extractSession(request);
    const body = await request.json();
    const { name, description, targetBudget, userId: bodyUserId } = body;

    let userId: string;
    if (session) {
      userId = session.userId;
    } else if (bodyUserId) {
      userId = bodyUserId;
    } else {
      return NextResponse.json(
        { error: 'Authentication is required to create a BOM project.' },
        { status: 401 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Project name is required and must be at least 2 characters.' },
        { status: 400 }
      );
    }

    let parsedBudget: number | null = null;
    if (targetBudget !== undefined && targetBudget !== null) {
      const budgetNum = Number(targetBudget);
      if (isNaN(budgetNum) || budgetNum < 0) {
        return NextResponse.json(
          { error: 'Target budget must be a positive number.' },
          { status: 400 }
        );
      }
      parsedBudget = budgetNum;
    }

    const project = await prisma.bOMProject.create({
      data: {
        userId,
        name: name.trim(),
        description: description ? String(description).trim() : null,
        targetBudget: parsedBudget !== null ? parsedBudget : undefined,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: project.id,
          name: project.name,
          description: project.description,
          targetBudget: project.targetBudget ? Number(project.targetBudget) : null,
          totalCost: 0,
          totalComponentCount: 0,
          allInStock: false,
          lineItems: [],
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating BOM project:', error);
    return NextResponse.json(
      { error: 'Failed to create BOM project.' },
      { status: 500 }
    );
  }
}
