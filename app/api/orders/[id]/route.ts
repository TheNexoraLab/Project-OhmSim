import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';
import { normalizeOrderStatus, computeOrderTimeline } from '@/lib/orders/order-utils';
import type { OrderStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await extractSession(request);

    const cleanOrderNumber = id.startsWith('#') ? id.slice(1) : id;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
          { orderNumber: cleanOrderNumber },
          { orderNumber: `#${cleanOrderNumber}` },
        ],
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

    if (!order) {
      return NextResponse.json(
        { error: `Order with reference '${id}' was not found.` },
        { status: 404 }
      );
    }

    // Role-based visibility check: Buyers can only view their own orders
    if (session && session.role === 'BUYER' && order.userId !== session.userId) {
      return NextResponse.json(
        { error: 'You are not authorized to view this order.' },
        { status: 403 }
      );
    }

    const timeline = computeOrderTimeline(order.status, order.fulfillmentType);

    return NextResponse.json({
      order: {
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
      },
    });
  } catch (error) {
    console.error('Error in GET /api/orders/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while retrieving order details.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await extractSession(request);
    const body = await request.json();
    const { status, trackingNumber, notes, cancelledReason } = body;

    const cleanOrderNumber = id.startsWith('#') ? id.slice(1) : id;

    // 1. Fetch Existing Order
    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
          { orderNumber: cleanOrderNumber },
          { orderNumber: `#${cleanOrderNumber}` },
        ],
      },
      include: {
        items: true,
        deliveryAddress: true,
        user: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: `Order with reference '${id}' was not found.` },
        { status: 404 }
      );
    }

    // 2. Authorization check
    // If user is a buyer, they can only cancel their own pending order
    if (session && session.role === 'BUYER') {
      if (existingOrder.userId !== session.userId) {
        return NextResponse.json(
          { error: 'You are not authorized to modify this order.' },
          { status: 403 }
        );
      }

      if (status) {
        const targetNormalized = normalizeOrderStatus(status);
        if (targetNormalized !== 'CANCELLED') {
          return NextResponse.json(
            { error: 'Buyers can only request order cancellation.' },
            { status: 403 }
          );
        }
        if (existingOrder.status !== 'PENDING' && existingOrder.status !== 'PROCESSING') {
          return NextResponse.json(
            { error: `Cannot cancel an order that is already '${existingOrder.status}'. Only PENDING and PREPARING orders may be cancelled by the customer.` },
            { status: 400 }
          );
        }
      }
    }

    // 3. Process Status Transition & Stock Restoration
    let targetStatus: OrderStatus | undefined = undefined;
    if (status) {
      const normalized = normalizeOrderStatus(status);
      if (!normalized) {
        return NextResponse.json(
          { error: `Invalid order status '${status}'. Must be one of PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED.` },
          { status: 400 }
        );
      }
      targetStatus = normalized;
    }

    // Prevent transitioning out of CANCELLED
    if (existingOrder.status === 'CANCELLED' && targetStatus && targetStatus !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot transition a cancelled order back to an active state.' },
        { status: 400 }
      );
    }

    const previousStatus = existingOrder.status;

    // 4. Atomic Execution via Prisma Transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If transitioning to CANCELLED from an active status, restore stock
      if (targetStatus === 'CANCELLED' && previousStatus !== 'CANCELLED') {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (targetStatus) updateData.status = targetStatus;
      if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
      if (notes !== undefined) updateData.notes = notes;
      if (cancelledReason !== undefined) updateData.cancelledReason = cancelledReason;

      const order = await tx.order.update({
        where: { id: existingOrder.id },
        data: updateData,
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

      // 5. In-App Notification Trigger on Status Progression
      if (targetStatus && targetStatus !== previousStatus) {
        let notifTitle = `Order ${order.orderNumber} Updated`;
        let notifMessage = `Your order ${order.orderNumber} status changed to ${targetStatus}.`;

        if (targetStatus === 'CANCELLED') {
          notifTitle = `Order ${order.orderNumber} Cancelled`;
          notifMessage = `Your order ${order.orderNumber} has been cancelled. Any reserved components have been restored to stock.`;
        } else if (targetStatus === 'PROCESSING') {
          notifTitle = 'Order Confirmed & Preparing';
          notifMessage = `Your order ${order.orderNumber} has been confirmed by our staff and is being prepared for fulfillment.`;
        } else if (targetStatus === 'SHIPPED') {
          if (order.fulfillmentType === 'PICKUP') {
            notifTitle = 'Ready for Campus Pickup';
            notifMessage = `Your order ${order.orderNumber} is ready for collection at Campus Electronics Lab Station (Building 3, Room 204).`;
          } else {
            const tracking = (order.trackingNumber || '').toUpperCase();
            let courier = 'Region III Logistics Partner';
            if (tracking.startsWith('JNT') || tracking.includes('J&T')) {
              courier = 'J&T Express';
            } else if (tracking.startsWith('FLS') || tracking.includes('FLASH')) {
              courier = 'Flash Express';
            } else if (tracking.startsWith('LLM') || tracking.includes('LALAMOVE')) {
              courier = 'Lalamove (Same-day)';
            }
            notifTitle = `Out for Delivery via ${courier}`;
            notifMessage = `Your order ${order.orderNumber} is on the way via ${courier}.${order.trackingNumber ? ` Tracking: ${order.trackingNumber}` : ''}`;
          }
        } else if (targetStatus === 'DELIVERED') {
          notifTitle = 'Order Completed';
          notifMessage = `Thank you! Your order ${order.orderNumber} has been marked as completed and fulfilled.`;
        }

        await tx.notification.create({
          data: {
            userId: order.userId,
            title: notifTitle,
            message: notifMessage,
            type: 'order',
            link: `/orders/${order.id}`,
          },
        });
      }

      return order;
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    const timeline = computeOrderTimeline(updatedOrder.status, updatedOrder.fulfillmentType);

    return NextResponse.json({
      success: true,
      message: `Order ${updatedOrder.orderNumber} updated successfully.`,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        statusLabel: timeline.statusLabel,
        fulfillmentType: updatedOrder.fulfillmentType,
        paymentMethod: updatedOrder.paymentMethod,
        subtotal: Number(updatedOrder.subtotal),
        shippingFee: Number(updatedOrder.shippingFee),
        totalAmount: Number(updatedOrder.totalAmount),
        trackingNumber: updatedOrder.trackingNumber,
        notes: updatedOrder.notes,
        cancelledReason: updatedOrder.cancelledReason,
        createdAt: updatedOrder.createdAt.toISOString(),
        updatedAt: updatedOrder.updatedAt.toISOString(),
        user: updatedOrder.user,
        deliveryAddress: updatedOrder.deliveryAddress
          ? {
              ...updatedOrder.deliveryAddress,
              fullAddress: `${updatedOrder.deliveryAddress.street}, ${updatedOrder.deliveryAddress.barangay}, ${updatedOrder.deliveryAddress.city}, ${updatedOrder.deliveryAddress.province}, Region III`,
            }
          : null,
        items: updatedOrder.items.map((item) => ({
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
    });
  } catch (error) {
    console.error('Error in PATCH /api/orders/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while updating the order.' },
      { status: 500 }
    );
  }
}
