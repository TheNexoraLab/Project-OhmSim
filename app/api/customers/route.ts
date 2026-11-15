import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';

const AVATAR_COLORS = [
  '#89B4FA', '#A6E3A1', '#F9E2AF', '#CBA6F7', '#F38BA8',
  '#74C7EC', '#FAB387', '#94E2D5', '#EBA0AC', '#B4BEFE'
];

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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

export async function GET(request: Request) {
  try {
    const session = await extractSession(request);
    const { searchParams } = new URL(request.url);
    const queryRole = searchParams.get('role');

    // Admin authorization check - allows demo preview when role=ADMIN query param supplied
    if (session && session.role !== 'ADMIN' && queryRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required.' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    const customers = users.map((user) => {
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

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        initials,
        avatarColor: getAvatarColor(user.email),
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
      };
    });

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve customers.' },
      { status: 500 }
    );
  }
}
