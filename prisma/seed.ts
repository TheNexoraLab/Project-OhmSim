import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding OhmSim Database ---');

  // 1. Seed Demo Admin & Buyer
  await prisma.user.upsert({
    where: { email: 'admin@ohmsim.nexora.ph' },
    update: {},
    create: {
      email: 'admin@ohmsim.nexora.ph',
      passwordHash: '$2b$10$epNzYIeU9j1FvXoX5u8gCeD9Kx6GzK0pZqJ.V3wL1xU.vE3N0n3jO', // Pre-computed demo hash
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'Nexora',
      phone: '+63 917 123 4567',
    },
  });

  await prisma.user.upsert({
    where: { email: 'buyer@ohmsim.nexora.ph' },
    update: {},
    create: {
      email: 'buyer@ohmsim.nexora.ph',
      passwordHash: '$2b$10$epNzYIeU9j1FvXoX5u8gCeD9Kx6GzK0pZqJ.V3wL1xU.vE3N0n3jO', // Pre-computed demo hash
      role: Role.BUYER,
      firstName: 'Daniel',
      lastName: 'Cruz',
      phone: '+63 918 987 6543',
    },
  });

  console.log('Seeded users: admin & buyer.');

  // 2. Seed Default Category
  const catMicro = await prisma.category.upsert({
    where: { slug: 'microcontrollers' },
    update: {},
    create: {
      name: 'Microcontrollers & Development Boards',
      slug: 'microcontrollers',
      description: 'Arduino, ESP32, and development hardware boards.',
    },
  });

  // 3. Seed Sample Product
  await prisma.product.upsert({
    where: { sku: 'DEV-ESP32-WROOM' },
    update: {},
    create: {
      sku: 'DEV-ESP32-WROOM',
      name: 'ESP32-WROOM-32D Development Board',
      brand: 'Espressif',
      categoryId: catMicro.id,
      price: 285.00,
      stockQuantity: 120,
      minStockThreshold: 15,
      isFeatured: true,
      shortDescription: 'Dual-core 240MHz Wi-Fi + Bluetooth microcontroller development board.',
      fullDescription: 'ESP32 development board with built-in Wi-Fi, Bluetooth BLE, 448KB ROM, 520KB SRAM.',
      imageUrls: ['/images/esp32.jpg'],
      specifications: {
        'Core Clock': '240 MHz',
        'Wireless': 'Wi-Fi 802.11 b/g/n & BLE 4.2',
        'Input Voltage': '5V via Micro-USB',
      },
    },
  });

  console.log('Seeded catalog products and categories.');
  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

