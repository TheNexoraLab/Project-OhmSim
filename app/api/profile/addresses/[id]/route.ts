import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { extractSession } from '@/lib/auth/session';
import {
  isValidRegion3Province,
  getCanonicalRegion3Province,
  REGION_3_PROVINCES,
} from '@/lib/orders/order-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    } = body;

    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Address with ID '${id}' not found.` },
        { status: 404 }
      );
    }

    if (session && session.role === 'BUYER' && existing.userId !== session.userId) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this address.' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (label !== undefined) updateData.label = label.trim();
    if (recipientName !== undefined) {
      if (!recipientName.trim()) {
        return NextResponse.json({ error: 'Recipient name cannot be empty.' }, { status: 400 });
      }
      updateData.recipientName = recipientName.trim();
    }

    const rawPhone = contactNumber !== undefined ? contactNumber : phone;
    if (rawPhone !== undefined) {
      const cleanPhone = rawPhone.trim();
      if (!cleanPhone || !/^09\d{9}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Contact number must be a valid 11-digit Philippine mobile starting with 09.' },
          { status: 400 }
        );
      }
      updateData.phone = cleanPhone;
    }

    const newStreet = streetAddress !== undefined ? streetAddress : street;
    if (newStreet !== undefined) {
      if (!newStreet.trim()) return NextResponse.json({ error: 'Street cannot be empty.' }, { status: 400 });
      updateData.street = newStreet.trim();
    }

    if (barangay !== undefined) {
      if (!barangay.trim()) return NextResponse.json({ error: 'Barangay cannot be empty.' }, { status: 400 });
      updateData.barangay = barangay.trim();
    }

    const newCity = cityMunicipality !== undefined ? cityMunicipality : city;
    if (newCity !== undefined) {
      if (!newCity.trim()) return NextResponse.json({ error: 'City cannot be empty.' }, { status: 400 });
      updateData.city = newCity.trim();
    }

    if (province !== undefined) {
      const rawProv = province.trim();
      if (!isValidRegion3Province(rawProv)) {
        return NextResponse.json(
          {
            error: `Delivery address must be strictly within Region III (Central Luzon). Allowed provinces: ${REGION_3_PROVINCES.join(', ')}.`,
          },
          { status: 400 }
        );
      }
      updateData.province = getCanonicalRegion3Province(rawProv)!;
    }

    if (postalCode !== undefined) updateData.postalCode = postalCode.trim();

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.address.updateMany({
          where: { userId: existing.userId },
          data: { isDefault: false },
        });
        updateData.isDefault = true;
      } else if (isDefault === false) {
        updateData.isDefault = false;
      }

      return await tx.address.update({
        where: { id },
        data: updateData,
      });
    }, { maxWait: 10000, timeout: 20000 });

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully.',
      address: {
        id: updated.id,
        label: updated.label,
        recipientName: updated.recipientName,
        contactNumber: updated.phone,
        phone: updated.phone,
        region: 'Region III',
        province: updated.province,
        cityMunicipality: updated.city,
        barangay: updated.barangay,
        streetAddress: updated.street,
        postalCode: updated.postalCode,
        isDefault: updated.isDefault,
        fullAddress: `${updated.street}, ${updated.barangay}, ${updated.city}, ${updated.province}, Region III`,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/profile/addresses/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update address.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await extractSession(request);

    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Address with ID '${id}' not found.` },
        { status: 404 }
      );
    }

    if (session && session.role === 'BUYER' && existing.userId !== session.userId) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this address.' },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      // If deleted address was default, promote another address to default
      if (existing.isDefault) {
        const remaining = await tx.address.findFirst({
          where: { userId: existing.userId },
          orderBy: { createdAt: 'desc' },
        });
        if (remaining) {
          await tx.address.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }
    }, { maxWait: 10000, timeout: 20000 });

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error) {
    console.error('Error in DELETE /api/profile/addresses/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete address.' },
      { status: 500 }
    );
  }
}
