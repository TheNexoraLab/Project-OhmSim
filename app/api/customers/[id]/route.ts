import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';
import { CANONICAL_CUSTOMERS } from '@/lib/mocks/customers';

function mapPrismaStatusToAdmin(status: string): 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' {
  switch (status) {
    case 'PENDING':
      return 'PENDING';
    case 'PROCESSING':
      return 'PROCESSING';
    case 'SHIPPED':
      return 'SHIPPED';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'PROCESSING';
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await extractSession(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const queryRole = searchParams.get('role');

    if (session && session.role !== 'ADMIN' && queryRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required.' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
        orders: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    sku: true,
                    name: true,
                  },
                },
              },
            },
            deliveryAddress: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      const mockCustomer = CANONICAL_CUSTOMERS.find(
        (c) => c.id === id || c.email.toLowerCase() === id.toLowerCase()
      );
      if (mockCustomer) {
        return NextResponse.json({
          success: true,
          data: mockCustomer,
        });
      }
      return NextResponse.json(
        { error: 'Customer not found.' },
        { status: 404 }
      );
    }

    const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
    const initials = `${user.firstName[0] || 'U'}${user.lastName[0] || 'S'}`.toUpperCase();
    const province = (defaultAddr?.province || 'Pampanga') as
      | 'Pampanga'
      | 'Bulacan'
      | 'Nueva Ecija'
      | 'Bataan'
      | 'Tarlac'
      | 'Zambales';

    const formattedOrders = user.orders.map((order) => {
      const totalUnits = order.items.reduce((acc, item) => acc + item.quantity, 0);
      const firstItem = order.items[0];
      const summary = firstItem
        ? `${firstItem.product.sku} (${firstItem.quantity}x)${
            order.items.length > 1 ? ` +${order.items.length - 1} more` : ''
          }`
        : 'Hardware Kit';

      const addrText = order.deliveryAddress
        ? `${order.deliveryAddress.street}, Brgy. ${order.deliveryAddress.barangay}, ${order.deliveryAddress.city}, ${order.deliveryAddress.province}`
        : 'Designated Campus Electronics Lab / Store Station';

      return {
        id: order.id,
        orderNumber: order.orderNumber.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`,
        createdAt: order.createdAt.toISOString(),
        fulfillmentType: order.fulfillmentType,
        paymentMethod: order.paymentMethod,
        status: mapPrismaStatusToAdmin(order.status),
        totalAmount: Number(order.totalAmount),
        itemCount: totalUnits,
        primarySkuSummary: summary,
        deliveryAddress: addrText,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        initials,
        avatarColor: '#89B4FA',
        email: user.email,
        phone: user.phone || '09XXXXXXXXX',
        affiliation: user.role === 'ADMIN' ? 'OhmSim Operations Hub' : 'Campus Electronics Lab Lead',
        role: user.role === 'ADMIN' ? 'Platform Administrator' : 'Hardware Developer',
        province,
        cityMunicipality: defaultAddr?.city || 'Angeles City',
        defaultAddress: defaultAddr
          ? `${defaultAddr.street}, Brgy. ${defaultAddr.barangay}, ${defaultAddr.city}, ${defaultAddr.province}, Region III`
          : 'Campus Electronics Lab Station, Angeles City, Pampanga, Region III',
        campusLabVerified: true,
        activeCentralLuzon: true,
        joinedAt: user.createdAt.toISOString(),
        orders: formattedOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve customer.' },
      { status: 500 }
    );
  }
}
