import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';
import {
  isValidRegion3Province,
  getCanonicalRegion3Province,
  REGION_3_PROVINCES,
} from '@/lib/orders/order-utils';

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
        { error: 'Authentication or userId is required to view saved addresses.' },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    const formatted = addresses.map((addr) => ({
      id: addr.id,
      label: addr.label,
      recipientName: addr.recipientName,
      contactNumber: addr.phone,
      phone: addr.phone,
      region: 'Region III',
      province: addr.province,
      cityMunicipality: addr.city,
      barangay: addr.barangay,
      streetAddress: addr.street,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
      fullAddress: `${addr.street}, ${addr.barangay}, ${addr.city}, ${addr.province}, Region III`,
      createdAt: addr.createdAt.toISOString(),
      updatedAt: addr.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      addresses: formatted,
      total: formatted.length,
      maxAllowed: 2,
    });
  } catch (error) {
    console.error('Error in GET /api/profile/addresses:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve saved addresses.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await extractSession(request);
    const body = await request.json();
    const {
      label,
      recipientName,
      contactNumber,
      phone,
      streetAddress,
      street,
      barangay,
      cityMunicipality,
      city,
      province,
      postalCode,
      isDefault,
      userId: bodyUserId,
    } = body;

    let userId: string;
    if (session) {
      userId = session.userId;
    } else if (bodyUserId) {
      userId = bodyUserId;
    } else {
      return NextResponse.json(
        { error: 'Authentication required to save delivery address.' },
        { status: 401 }
      );
    }

    // 1. Enforce BR-048: Maximum 2 saved addresses
    const existingCount = await prisma.address.count({ where: { userId } });
    if (existingCount >= 2) {
      return NextResponse.json(
        {
          error: 'Maximum limit of 2 saved addresses reached per Region III fulfillment specification. Please edit or delete an existing address.',
        },
        { status: 400 }
      );
    }

    // 2. Validate Required Fields
    const finalLabel = label?.trim() || 'Home / Dormitory';
    const finalRecipient = recipientName?.trim();
    if (!finalRecipient) {
      return NextResponse.json({ error: 'Recipient full name is required.' }, { status: 400 });
    }

    const rawPhone = contactNumber || phone || '';
    const finalPhone = rawPhone.trim();
    if (!finalPhone || !/^09\d{9}$/.test(finalPhone)) {
      return NextResponse.json(
        { error: 'Contact number must be a valid 11-digit Philippine mobile starting with 09 (e.g., 09171234567).' },
        { status: 400 }
      );
    }

    const finalStreet = (streetAddress || street || '').trim();
    const finalBarangay = (barangay || '').trim();
    const finalCity = (cityMunicipality || city || '').trim();
    const rawProvince = (province || '').trim();
    const finalPostal = (postalCode || '').trim() || '2000';

    if (!finalStreet || !finalBarangay || !finalCity || !rawProvince) {
      return NextResponse.json(
        { error: 'Street address, barangay, city/municipality, and province are required.' },
        { status: 400 }
      );
    }

    // 3. Enforce BR-045: Region III coverage strictly enforced
    if (!isValidRegion3Province(rawProvince)) {
      return NextResponse.json(
        {
          error: `Delivery address must be strictly within Region III (Central Luzon). Allowed provinces: ${REGION_3_PROVINCES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    const canonicalProvince = getCanonicalRegion3Province(rawProvince)!;
    const shouldBeDefault = existingCount === 0 ? true : Boolean(isDefault);

    // 4. Atomic Save & Default Address Management
    const saved = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault && existingCount > 0) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return await tx.address.create({
        data: {
          userId,
          label: finalLabel,
          recipientName: finalRecipient,
          phone: finalPhone,
          street: finalStreet,
          barangay: finalBarangay,
          city: finalCity,
          province: canonicalProvince,
          postalCode: finalPostal,
          isDefault: shouldBeDefault,
        },
      });
    }, { maxWait: 10000, timeout: 20000 });

    return NextResponse.json(
      {
        success: true,
        message: 'Address saved successfully.',
        address: {
          id: saved.id,
          label: saved.label,
          recipientName: saved.recipientName,
          contactNumber: saved.phone,
          phone: saved.phone,
          region: 'Region III',
          province: saved.province,
          cityMunicipality: saved.city,
          barangay: saved.barangay,
          streetAddress: saved.street,
          postalCode: saved.postalCode,
          isDefault: saved.isDefault,
          fullAddress: `${saved.street}, ${saved.barangay}, ${saved.city}, ${saved.province}, Region III`,
          createdAt: saved.createdAt.toISOString(),
          updatedAt: saved.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/profile/addresses:', error);
    return NextResponse.json(
      { error: 'Failed to create saved address.' },
      { status: 500 }
    );
  }
}
