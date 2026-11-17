import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';
import { PRODUCTS } from '@/lib/mocks/products';
import {
  isValidRegion3Province,
  getCanonicalRegion3Province,
  computeOrderShippingFee,
  normalizeOrderStatus,
  generateUniqueOrderNumber,
  computeOrderTimeline,
} from '@/lib/orders/order-utils';
import type { FulfillmentType, PaymentMethod } from '@prisma/client';

interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  bomProjectId?: string;
}

interface InlineAddressInput {
  recipientName: string;
  phone: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode?: string;
  label?: string;
}

interface CreateOrderBody {
  items: CreateOrderItemInput[];
  fulfillmentType: FulfillmentType;
  deliveryAddressId?: string;
  deliveryAddress?: InlineAddressInput;
  pickupRecipient?: string;
  pickupPhone?: string;
  studentOrGovId?: string;
  notes?: string;
  userId?: string;
}

export async function GET(request: Request) {
  try {
    const session = await extractSession(request);
    const { searchParams } = new URL(request.url);

    const queryUserId = searchParams.get('userId');
    const queryStatus = searchParams.get('status');
    const queryFulfillment = searchParams.get('fulfillmentType');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const skip = (page - 1) * limit;

    // Authorization & Visibility Filter
    let filterUserId: string | undefined = undefined;

    if (session) {
      if (session.role === 'BUYER') {
        filterUserId = session.userId;
      } else if (session.role === 'ADMIN') {
        filterUserId = queryUserId || undefined;
      }
    } else if (queryUserId) {
      filterUserId = queryUserId;
    } else {
      return NextResponse.json(
        { error: 'Authentication or userId query parameter is required to view orders.' },
        { status: 401 }
      );
    }

    const whereClause: Record<string, unknown> = {};
    if (filterUserId) {
      whereClause.userId = filterUserId;
    }

    if (queryStatus) {
      const normalizedStatus = normalizeOrderStatus(queryStatus);
      if (normalizedStatus) {
        whereClause.status = normalizedStatus;
      }
    }

    if (queryFulfillment && ['PICKUP', 'DELIVERY'].includes(queryFulfillment.toUpperCase())) {
      whereClause.fulfillmentType = queryFulfillment.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  imageUrls: true,
                  price: true,
                  brand: true,
                },
              },
              bomProject: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          deliveryAddress: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const formattedOrders = orders.map((order) => {
      const timeline = computeOrderTimeline(order.status, order.fulfillmentType);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: timeline.statusLabel,
        fulfillmentType: order.fulfillmentType,
        paymentMethod: order.paymentMethod,
        subtotal: Number(order.subtotal),
        shippingFee: Number(order.shippingFee),
        totalAmount: Number(order.totalAmount),
        trackingNumber: order.trackingNumber,
        notes: order.notes,
        cancelledReason: order.cancelledReason,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        user: order.user,
        deliveryAddress: order.deliveryAddress
          ? {
              ...order.deliveryAddress,
              fullAddress: `${order.deliveryAddress.street}, ${order.deliveryAddress.barangay}, ${order.deliveryAddress.city}, ${order.deliveryAddress.province}, Region III`,
            }
          : null,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          productSku: item.product.sku,
          productImage: item.product.imageUrls[0] || '/images/placeholder.jpg',
          brand: item.product.brand,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          lineTotal: Number(item.unitPrice) * item.quantity,
          bomProjectId: item.bomProjectId,
          bomProjectName: item.bomProject?.name || null,
        })),
        timeline,
      };
    });

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while retrieving orders.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await extractSession(request);
    const body = (await request.json()) as CreateOrderBody;

    // 1. Resolve Target User
    let userId: string;
    if (session) {
      userId = session.userId;
    } else if (body.userId) {
      const targetUser = await prisma.user.findUnique({ where: { id: body.userId } });
      if (!targetUser) {
        return NextResponse.json(
          { error: `User with ID '${body.userId}' not found.` },
          { status: 404 }
        );
      }
      userId = targetUser.id;
    } else {
      return NextResponse.json(
        { error: 'Authentication required. Please log in or provide a valid session.' },
        { status: 401 }
      );
    }

    // 2. Validate Items
    const { items, fulfillmentType, deliveryAddressId, deliveryAddress, pickupRecipient, pickupPhone, notes } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item.' },
        { status: 400 }
      );
    }

    // Consolidate duplicate product entries to prevent double-decrement races
    const consolidatedMap = new Map<string, { productId: string; quantity: number; bomProjectId?: string }>();
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json(
          { error: 'Each item must have a valid productId string.' },
          { status: 400 }
        );
      }
      const qty = parseInt(String(item.quantity), 10);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity '${item.quantity}' for product '${item.productId}'. Quantity must be a positive integer.` },
          { status: 400 }
        );
      }

      const existing = consolidatedMap.get(item.productId);
      if (existing) {
        existing.quantity += qty;
      } else {
        consolidatedMap.set(item.productId, {
          productId: item.productId,
          quantity: qty,
          bomProjectId: item.bomProjectId,
        });
      }
    }

    const consolidatedItems = Array.from(consolidatedMap.values());

    // 3. Validate Fulfillment & Delivery Boundaries
    if (!fulfillmentType || !['PICKUP', 'DELIVERY'].includes(fulfillmentType)) {
      return NextResponse.json(
        { error: "Invalid fulfillmentType. Must be either 'PICKUP' or 'DELIVERY'." },
        { status: 400 }
      );
    }

    const paymentMethod: PaymentMethod = fulfillmentType === 'PICKUP' ? 'PAY_ON_PICKUP' : 'COD';
    let validatedAddressId: string | null = null;
    let newAddressToCreate: InlineAddressInput | null = null;

    if (fulfillmentType === 'DELIVERY') {
      if (deliveryAddressId) {
        // Look up saved address
        const savedAddress = await prisma.address.findUnique({
          where: { id: deliveryAddressId },
        });

        if (!savedAddress) {
          return NextResponse.json(
            { error: `Delivery address with ID '${deliveryAddressId}' not found.` },
            { status: 404 }
          );
        }

        if (!isValidRegion3Province(savedAddress.province)) {
          return NextResponse.json(
            {
              error: `Delivery is restricted strictly to Region III (Central Luzon). Saved address province '${savedAddress.province}' is outside service area.`,
            },
            { status: 400 }
          );
        }

        validatedAddressId = savedAddress.id;
      } else if (deliveryAddress) {
        const { recipientName, phone, street, barangay, city, province, postalCode } = deliveryAddress;

        if (!recipientName?.trim()) {
          return NextResponse.json(
            { error: 'Recipient name is required for delivery.' },
            { status: 400 }
          );
        }

        if (!phone?.trim() || !/^09\d{9}$/.test(phone.trim())) {
          return NextResponse.json(
            { error: 'A valid 11-digit Philippine mobile number (09XXXXXXXXX) is required for delivery contact.' },
            { status: 400 }
          );
        }

        if (!street?.trim() || !barangay?.trim() || !city?.trim() || !province?.trim()) {
          return NextResponse.json(
            { error: 'Street, barangay, city, and province are required for delivery.' },
            { status: 400 }
          );
        }

        const canonicalProvince = getCanonicalRegion3Province(province);
        if (!canonicalProvince) {
          return NextResponse.json(
            {
              error: `Delivery is restricted strictly to Region III (Central Luzon). Selected province '${province}' is outside service area. Allowed provinces: Aurora, Bataan, Bulacan, Nueva Ecija, Pampanga, Tarlac, Zambales.`,
            },
            { status: 400 }
          );
        }

        newAddressToCreate = {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          street: street.trim(),
          barangay: barangay.trim(),
          city: city.trim(),
          province: canonicalProvince,
          postalCode: postalCode?.trim() || '2000',
          label: deliveryAddress.label?.trim() || 'Delivery Address',
        };
      } else {
        return NextResponse.json(
          { error: 'A delivery address (deliveryAddressId or deliveryAddress details) is required for DELIVERY fulfillment.' },
          { status: 400 }
        );
      }
    } else {
      // PICKUP mode validation
      if (pickupPhone && !/^09\d{9}$/.test(pickupPhone.trim())) {
        return NextResponse.json(
          { error: 'Pickup contact number must be a valid 11-digit mobile number (09XXXXXXXXX).' },
          { status: 400 }
        );
      }
    }

    // 4. ACID-Compliant Transaction: Lock Stock, Decrement, Create Order & Items
    const result = await prisma.$transaction(async (tx) => {
      // A. Fetch all products (supporting database UUIDs, SKUs, and mock numeric IDs)
      const productIds = consolidatedItems.map((i) => i.productId);
      const mockSkus = productIds.map((id) => {
        const mock = PRODUCTS.find((p) => p.id === id || p.sku.toLowerCase() === id.toLowerCase());
        return mock ? mock.sku : id;
      });

      const products = await tx.product.findMany({
        where: {
          OR: [
            { id: { in: productIds } },
            { sku: { in: productIds } },
            { sku: { in: mockSkus } },
          ],
        },
      });

      // Map each consolidated item to its database product
      const itemProductMap = new Map<string, typeof products[0]>();
      for (const item of consolidatedItems) {
        const mock = PRODUCTS.find((p) => p.id === item.productId || p.sku.toLowerCase() === item.productId.toLowerCase());
        const match = products.find(
          (p) =>
            p.id === item.productId ||
            p.sku.toLowerCase() === item.productId.toLowerCase() ||
            (mock && p.sku.toLowerCase() === mock.sku.toLowerCase())
        );

        if (!match) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
        }
        itemProductMap.set(item.productId, match);
      }

      // B. Verify inventory stock sufficiency for all items
      for (const item of consolidatedItems) {
        const product = itemProductMap.get(item.productId)!;
        if (product.stockQuantity < item.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK:${product.name}:${product.sku}:${product.stockQuantity}:${item.quantity}`
          );
        }
      }

      // C. Calculate Subtotal, Delivery Fee & Total Amount
      let subtotal = 0;
      for (const item of consolidatedItems) {
        const product = itemProductMap.get(item.productId)!;
        subtotal += Number(product.price) * item.quantity;
      }

      const shippingFee = computeOrderShippingFee(subtotal, fulfillmentType);
      const totalAmount = subtotal + shippingFee;

      // D. Decrement stock atomically
      for (const item of consolidatedItems) {
        const product = itemProductMap.get(item.productId)!;
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // E. Persist new address if provided inline
      let finalAddressId = validatedAddressId;
      if (!finalAddressId && newAddressToCreate) {
        const createdAddr = await tx.address.create({
          data: {
            userId,
            label: newAddressToCreate.label || 'Home / Delivery',
            recipientName: newAddressToCreate.recipientName,
            phone: newAddressToCreate.phone,
            street: newAddressToCreate.street,
            barangay: newAddressToCreate.barangay,
            city: newAddressToCreate.city,
            province: newAddressToCreate.province,
            postalCode: newAddressToCreate.postalCode || '2000',
            isDefault: false,
          },
        });
        finalAddressId = createdAddr.id;
      }

      // F. Generate unique order number
      const orderNumber = await generateUniqueOrderNumber(tx);

      // Notes construction
      let orderNotes = notes?.trim() || null;
      if (fulfillmentType === 'PICKUP' && pickupRecipient) {
        const pickupNote = `Pickup Recipient: ${pickupRecipient.trim()} (${pickupPhone || 'No contact provided'})`;
        orderNotes = orderNotes ? `${orderNotes} | ${pickupNote}` : pickupNote;
      }
      if (body.studentOrGovId?.trim()) {
        const idNote = `Student/Gov ID: ${body.studentOrGovId.trim()}`;
        orderNotes = orderNotes ? `${orderNotes} | ${idNote}` : idNote;
      }

      // G. Create Order and OrderItems
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PENDING',
          fulfillmentType,
          paymentMethod,
          deliveryAddressId: finalAddressId,
          subtotal,
          shippingFee,
          totalAmount,
          notes: orderNotes,
          items: {
            create: consolidatedItems.map((item) => {
              const prod = itemProductMap.get(item.productId)!;
              return {
                productId: prod.id,
                quantity: item.quantity,
                unitPrice: prod.price,
                bomProjectId: item.bomProjectId || null,
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  imageUrls: true,
                  price: true,
                  brand: true,
                },
              },
              bomProject: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          deliveryAddress: true,
          user: {
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

      // H. Create initial buyer Notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Order Placed Successfully',
          message: `Your OhmSim order ${createdOrder.orderNumber} (₱${totalAmount.toFixed(2)}) has been placed and is pending store confirmation.`,
          type: 'order',
          link: `/orders/${createdOrder.id}`,
        },
      });

      return createdOrder;
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    const timeline = computeOrderTimeline(result.status, result.fulfillmentType);

    return NextResponse.json(
      {
        success: true,
        message: `Order ${result.orderNumber} placed successfully.`,
        order: {
          id: result.id,
          orderNumber: result.orderNumber,
          status: result.status,
          statusLabel: timeline.statusLabel,
          fulfillmentType: result.fulfillmentType,
          paymentMethod: result.paymentMethod,
          subtotal: Number(result.subtotal),
          shippingFee: Number(result.shippingFee),
          totalAmount: Number(result.totalAmount),
          notes: result.notes,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
          user: result.user,
          deliveryAddress: result.deliveryAddress
            ? {
                ...result.deliveryAddress,
                fullAddress: `${result.deliveryAddress.street}, ${result.deliveryAddress.barangay}, ${result.deliveryAddress.city}, ${result.deliveryAddress.province}, Region III`,
              }
            : null,
          items: result.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            productSku: item.product.sku,
            productImage: item.product.imageUrls[0] || '/images/placeholder.jpg',
            brand: item.product.brand,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
            lineTotal: Number(item.unitPrice) * item.quantity,
            bomProjectId: item.bomProjectId,
            bomProjectName: item.bomProject?.name || null,
          })),
          timeline,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : '';
    // Handle Custom Transaction Aborts
    if (errMessage.startsWith('PRODUCT_NOT_FOUND:')) {
      const missingId = errMessage.replace('PRODUCT_NOT_FOUND:', '');
      return NextResponse.json(
        { error: `Product with ID '${missingId}' does not exist.` },
        { status: 404 }
      );
    }

    if (errMessage.startsWith('INSUFFICIENT_STOCK:')) {
      const [, name, sku, available, requested] = errMessage.split(':');
      return NextResponse.json(
        {
          error: `Insufficient stock for product '${name}' (SKU: ${sku}). Available: ${available}, Requested: ${requested}. Order placement aborted and no changes were made.`,
        },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/orders:', error);
    return NextResponse.json(
      { error: 'Failed to process order checkout transaction. Please try again.' },
      { status: 500 }
    );
  }
}
