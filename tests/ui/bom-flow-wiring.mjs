import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runBomWiringSuite() {
  console.log('=== OhmSim Full-Stack Phase 5: BOM Projects Wiring Verification ===\n');

  try {
    // -------------------------------------------------------------
    // 1. Test Synchronous Service Fallbacks
    // -------------------------------------------------------------
    console.log('--- 1. Testing BOM Service Sync Fallbacks ---');
    const { getInitialBomProjectsSync } = await import('../../services/bom-service.ts');
    const mockProjects = getInitialBomProjectsSync();

    assert(Array.isArray(mockProjects), 'mockProjects should be an array');
    assert(mockProjects.length >= 2, 'Should provide at least 2 fallback BOM projects');
    const p1 = mockProjects[0];
    assert(p1.id && p1.name, 'Mock project must have an id and name');
    assert(Array.isArray(p1.lineItems) && p1.lineItems.length > 0, 'Project must contain line items');
    assert(typeof p1.totalComponentCount === 'number', 'totalComponentCount should be a number');
    console.log(`✔ Synchronous BOM fallbacks verified (${mockProjects.length} projects, ${p1.name}).\n`);

    // -------------------------------------------------------------
    // 2. Test Live Neon PostgreSQL BOM CRUD
    // -------------------------------------------------------------
    console.log('--- 2. Testing Live Neon PostgreSQL BOM CRUD ---');
    let buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
    let createdDynamicBuyer = false;
    if (!buyer) {
      buyer = await prisma.user.create({
        data: {
          email: `test.bom.buyer.${Date.now()}@ohmsim.ph`,
          passwordHash: 'dummy',
          role: 'BUYER',
          firstName: 'BOM',
          lastName: 'Tester',
        },
      });
      createdDynamicBuyer = true;
    }
    assert(buyer, 'Buyer user must exist in Neon PostgreSQL');

    // Fetch two catalog products
    const products = await prisma.product.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
    });
    assert(products.length >= 2, 'At least 2 products must exist in database');

    const testProjectName = `Test Rover Project-${Date.now()}`;
    const testBudget = 4500.0;

    // Create BOM Project
    const createdProject = await prisma.bOMProject.create({
      data: {
        userId: buyer.id,
        name: testProjectName,
        description: 'Autonomous obstacle avoidance rover project',
        targetBudget: testBudget,
      },
    });

    assert(createdProject.id, 'Project should have a generated UUID');
    assert.strictEqual(createdProject.name, testProjectName);
    console.log(`✔ Created BOM project in Neon DB: "${createdProject.name}" (ID: ${createdProject.id})`);

    // Add Component Items with Reference Designators
    const item1 = await prisma.bOMItem.create({
      data: {
        bomProjectId: createdProject.id,
        productId: products[0].id,
        quantity: 2,
        referenceDesignator: 'MCU-1, MCU-2',
      },
    });

    const item2 = await prisma.bOMItem.create({
      data: {
        bomProjectId: createdProject.id,
        productId: products[1].id,
        quantity: 4,
        referenceDesignator: 'SENS-1 to SENS-4',
      },
    });

    assert(item1.id && item2.id, 'Both items should have generated IDs');

    console.log(`✔ Added 2 component items with reference designators (MCU-1, SENS-1 to 4).`);

    // Verify Relational Hydration & Budget Calculation
    const hydrated = await prisma.bOMProject.findUnique({
      where: { id: createdProject.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    assert(hydrated, 'Hydrated project must exist');
    assert.strictEqual(hydrated.items.length, 2, 'Project should have 2 items');

    let computedTotalCost = 0;
    let computedUnits = 0;
    for (const item of hydrated.items) {
      const lineCost = Number(item.product.price) * item.quantity;
      computedTotalCost += lineCost;
      computedUnits += item.quantity;
    }

    assert.strictEqual(computedUnits, 6, 'Total components count should be 6');
    assert(computedTotalCost > 0, 'Computed cost should be positive');
    const withinBudget = computedTotalCost <= testBudget;

    console.log(`✔ Hydrated project: ₱${computedTotalCost.toFixed(2)} / ₱${testBudget} budget (${withinBudget ? 'Within Budget' : 'Over Budget'}).`);

    // -------------------------------------------------------------
    // 3. Test Component Quantity Update & Cascade Deletion
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Component Updates & Cascade Clean ---');
    await prisma.bOMItem.update({
      where: { id: item1.id },
      data: { quantity: 3, referenceDesignator: 'MCU-1, MCU-2, MCU-3' },
    });

    const updatedItem = await prisma.bOMItem.findUnique({ where: { id: item1.id } });
    assert.strictEqual(updatedItem?.quantity, 3, 'Item quantity should be updated to 3');
    console.log('✔ Component quantity and reference designator update verified.');

    // Cascade Delete
    await prisma.bOMProject.delete({
      where: { id: createdProject.id },
    });

    const verifyItemsDeleted = await prisma.bOMItem.findMany({
      where: { bomProjectId: createdProject.id },
    });
    assert.strictEqual(verifyItemsDeleted.length, 0, 'Cascade delete must remove all associated items');
    console.log('✔ Project cascade delete cleaned up all associated items in Neon DB.');

    if (createdDynamicBuyer) {
      await prisma.user.delete({ where: { id: buyer.id } });
      console.log('✔ Cleaned up dynamic test buyer in Neon DB.');
    }

    console.log('\n=== All BOM Wiring Checks PASSED Successfully ===');
  } catch (error) {
    console.error('❌ BOM Wiring Test Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBomWiringSuite();
