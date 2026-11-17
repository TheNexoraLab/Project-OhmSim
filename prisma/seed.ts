import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../lib/auth/password';
import { PRODUCTS } from '../lib/mocks/products';
import { CANONICAL_CUSTOMERS } from '../lib/mocks/customers';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting OhmSim Comprehensive Database Seeding ---');

  // 1. Seed Demo Admin
  const defaultPasswordHash = await hashPassword('AdminPass123!');
  const buyerPasswordHash = await hashPassword('BuyerPass123!');

  await prisma.user.upsert({
    where: { email: 'admin@ohmsim.nexora.ph' },
    update: {
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'Nexora',
      phone: '+63 917 123 4567',
    },
    create: {
      email: 'admin@ohmsim.nexora.ph',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'Nexora',
      phone: '+63 917 123 4567',
    },
  });
  console.log('✔ Seeded user: Admin Nexora.');

  // 2. Seed Verified Central Luzon Customer Accounts
  console.log(`--- Seeding ${CANONICAL_CUSTOMERS.length} Verified Customer Accounts ---`);
  for (const cust of CANONICAL_CUSTOMERS) {
    const nameParts = cust.name.split(' ');
    const firstName = nameParts[0] || 'Maker';
    const lastName = nameParts.slice(1).join(' ') || 'Engineer';

    const user = await prisma.user.upsert({
      where: { email: cust.email.toLowerCase() },
      update: {
        firstName,
        lastName,
        phone: cust.phone,
        role: Role.BUYER,
      },
      create: {
        email: cust.email.toLowerCase(),
        passwordHash: buyerPasswordHash,
        firstName,
        lastName,
        phone: cust.phone,
        role: Role.BUYER,
      },
    });

    // Seed default address
    const existingAddr = await prisma.address.findFirst({
      where: { userId: user.id },
    });

    if (!existingAddr) {
      await prisma.address.create({
        data: {
          userId: user.id,
          label: cust.campusLabVerified ? 'Campus Lab Station' : 'Workshop',
          recipientName: cust.name,
          phone: cust.phone,
          street: cust.defaultAddress.split(',')[0] || '123 Rizal Ave',
          barangay: 'Central',
          city: cust.cityMunicipality,
          province: cust.province,
          postalCode: '2009',
          isDefault: true,
        },
      });
    }
  }
  console.log(`✔ Seeded ${CANONICAL_CUSTOMERS.length} verified buyer accounts & lab addresses.`);

  // 3. Seed All 5 Canonical Product Categories
  const categoriesData = [
    { name: 'Microcontrollers', slug: 'microcontrollers', icon: 'mcu', description: 'Arduino, ESP32, and development hardware boards.' },
    { name: 'Sensors', slug: 'sensors', icon: 'sensor', description: 'Temperature, distance, ultrasonic, and inertial sensors.' },
    { name: 'ICs', slug: 'ics', icon: 'ic', description: 'Timers, motor drivers, display controllers, and integrated circuits.' },
    { name: 'Development Boards', slug: 'development-boards', icon: 'board', description: 'Single board computers, breakout boards, and developer kits.' },
    { name: 'Passive', slug: 'passive', icon: 'passive', description: 'Resistors, capacitors, inductors, and prototyping components.' },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon },
      create: cat,
    });
    categoryMap.set(cat.name, record.id);
  }
  console.log('✔ Seeded 5 canonical product categories.');

  // 4. Seed All 220 Hardware Products
  console.log(`--- Seeding ${PRODUCTS.length} Canonical Hardware Products ---`);
  let insertedCount = 0;

  for (const item of PRODUCTS) {
    const categoryId = categoryMap.get(item.category) || Array.from(categoryMap.values())[0];
    const minThreshold = item.status === 'out-of-stock' ? 0 : (item.status === 'low-stock' ? 25 : 15);
    const imageUrls = item.images && item.images.length > 0 ? item.images : [item.image];

    await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        brand: item.brand || 'Generic',
        categoryId,
        price: item.price,
        stockQuantity: item.stock,
        minStockThreshold: minThreshold,
        isFeatured: item.price > 1000 || item.category === 'Microcontrollers',
        shortDescription: item.label || `${item.name} component`,
        fullDescription: item.about || `Industrial/academic grade ${item.name} verified for OhmSim Region III fulfillment.`,
        imageUrls: imageUrls,
        specifications: item.specs || {},
      },
      create: {
        sku: item.sku,
        name: item.name,
        brand: item.brand || 'Generic',
        categoryId,
        price: item.price,
        stockQuantity: item.stock,
        minStockThreshold: minThreshold,
        isFeatured: item.price > 1000 || item.category === 'Microcontrollers',
        shortDescription: item.label || `${item.name} component`,
        fullDescription: item.about || `Industrial/academic grade ${item.name} verified for OhmSim Region III fulfillment.`,
        imageUrls: imageUrls,
        specifications: item.specs || {},
      },
    });
    insertedCount++;
  }

  console.log(`✔ Successfully upserted all ${insertedCount} hardware products into database.`);
  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
