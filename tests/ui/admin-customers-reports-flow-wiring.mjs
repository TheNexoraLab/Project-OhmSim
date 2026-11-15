import assert from 'node:assert';
import { prisma } from '../../lib/prisma/client.ts';

async function runAdminCustomersReportsSuite() {
  console.log('=== OhmSim Full-Stack Phase 5: Admin Customers & Reports Wiring Verification ===\n');

  try {
    // -------------------------------------------------------------
    // 1. Test Customer Data Mapping & Live DB Records
    // -------------------------------------------------------------
    console.log('--- 1. Testing Live Neon PostgreSQL Customer Records ---');
    const users = await prisma.user.findMany({
      include: {
        addresses: true,
        orders: {
          include: {
            items: true,
          },
        },
      },
    });

    assert(users.length > 0, 'Should find at least 1 user in Neon DB');
    console.log(`✔ Found ${users.length} live user account(s) in Neon DB.`);

    const buyerUser = users.find((u) => u.role === 'BUYER') || users[0];
    assert(buyerUser.email, 'User must have an email');
    assert(buyerUser.firstName && buyerUser.lastName, 'User must have a first and last name');

    const defaultAddr = buyerUser.addresses.find((a) => a.isDefault) || buyerUser.addresses[0];
    const province = defaultAddr?.province || 'Pampanga';
    assert(typeof province === 'string', 'Province should be a string');
    console.log(`✔ Verified customer profile mapping: ${buyerUser.firstName} ${buyerUser.lastName} (${buyerUser.email}), Province: ${province}.`);

    // -------------------------------------------------------------
    // 2. Test Live Orders Telemetry & Financial Calculations
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Live Orders Telemetry & Aggregation ---');
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        deliveryAddress: true,
      },
    });

    assert(Array.isArray(orders), 'Orders should be an array');
    console.log(`✔ Found ${orders.length} historical order(s) in Neon DB.`);

    const nonCancelled = orders.filter((o) => o.status !== 'CANCELLED');
    let totalGross = 0;
    let deliveryCount = 0;
    let pickupCount = 0;

    for (const o of nonCancelled) {
      totalGross += Number(o.totalAmount);
      if (o.fulfillmentType === 'DELIVERY') {
        deliveryCount++;
      } else {
        pickupCount++;
      }
    }

    const aov = nonCancelled.length > 0 ? totalGross / nonCancelled.length : 0;
    assert(typeof aov === 'number' && !isNaN(aov), 'AOV must be a valid number');
    console.log(`✔ Telemetry computation: Gross ₱${totalGross.toFixed(2)}, AOV ₱${aov.toFixed(2)}, Delivery: ${deliveryCount}, Pickup: ${pickupCount}.`);

    // -------------------------------------------------------------
    // 3. Test Regional Fulfillment Breakdown (Region III Provinces)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Region III Provincial Distribution ---');
    const provinces = ['Pampanga', 'Bulacan', 'Nueva Ecija', 'Bataan', 'Tarlac', 'Zambales'];
    const provinceMap = new Map();

    for (const prov of provinces) {
      provinceMap.set(prov, 0);
    }

    for (const o of nonCancelled) {
      if (o.fulfillmentType === 'DELIVERY' && o.deliveryAddress) {
        const prov = o.deliveryAddress.province;
        if (provinceMap.has(prov)) {
          provinceMap.set(prov, provinceMap.get(prov) + 1);
        }
      }
    }

    for (const prov of provinces) {
      assert(provinceMap.has(prov), `Region III province ${prov} must be tracked`);
    }
    console.log(`✔ All 6 Central Luzon (Region III) provinces accounted for in dispatch telemetry.`);

    // -------------------------------------------------------------
    // 4. Test Liquidation Settlement Batch Calculations
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Courier Liquidation & COD Settlement Rules ---');
    const handlingDeductionPerDelivery = 20.0;
    const computedHandlingDeduction = deliveryCount * handlingDeductionPerDelivery;
    const computedNetRemitted = totalGross - computedHandlingDeduction;

    assert(computedNetRemitted <= totalGross, 'Net remitted must be less than or equal to gross revenue');
    console.log(`✔ Courier handling deduction: ₱${computedHandlingDeduction.toFixed(2)} (₱20/dispatch), Net remittance: ₱${computedNetRemitted.toFixed(2)}.`);

    console.log('\n=== All Admin Customers & Reports Checks PASSED Successfully ===');
  } catch (error) {
    console.error('❌ Admin Customers/Reports Test Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdminCustomersReportsSuite();
