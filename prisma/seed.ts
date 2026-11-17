import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../lib/auth/password';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding OhmSim Database (Complete Catalog) ---');

  // 1. Seed Demo Admin with Valid Bcrypt Hash
  const adminPasswordHash = await hashPassword('AdminPass123!');

  await prisma.user.upsert({
    where: { email: 'admin@ohmsim.nexora.ph' },
    update: {
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'admin@ohmsim.nexora.ph',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'Nexora',
      phone: '+63 917 123 4567',
    },
  });

  console.log('✔ Seeded user: Admin.');

  // 2. Seed All 5 Canonical Categories
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

  // 3. Seed All 8 Canonical Hardware Products
  const productsData = [
    {
      sku: 'ESP32-WROOM-32U',
      name: 'Espressif ESP32-WROOM-32U Kit',
      brand: 'Espressif',
      category: 'Microcontrollers',
      price: 295.0,
      stockQuantity: 142,
      minStockThreshold: 15,
      isFeatured: true,
      shortDescription: 'Dual-core 240MHz Wi-Fi + Bluetooth microcontroller development board.',
      fullDescription: 'The ESP32-WROOM-32U is a powerful, generic Wi-Fi+BT+BLE MCU module targeting a wide variety of applications.',
      imageUrls: [
        '/images/products/esp32-wroom-32u.jpg',
      ],
      specifications: {
        Microcontroller: 'ESP32-D0WD',
        'Flash Memory': '4 MB',
        SRAM: '520 KB',
        'Operating Voltage': '3.3V (5V tolerant)',
        'Clock Speed': 'Up to 240 MHz',
      },
    },
    {
      sku: 'ARD-UNO-R3-COMP',
      name: 'Arduino Uno R3 Compatible Board',
      brand: 'Arduino',
      category: 'Microcontrollers',
      price: 450.0,
      stockQuantity: 87,
      minStockThreshold: 15,
      isFeatured: true,
      shortDescription: 'Standard ATmega328P based microcontroller board with 14 digital I/O.',
      fullDescription: 'The Arduino UNO R3 is a microcontroller board based on the ATmega328P. It contains everything needed to support the microcontroller.',
      imageUrls: [
        '/images/products/arduino-uno-r3.jpg',
      ],
      specifications: {
        Microcontroller: 'ATmega328P',
        'Operating Voltage': '5V',
        'Input Voltage': '7–12V',
        'Clock Speed': '16 MHz',
      },
    },
    {
      sku: 'OLED-096-I2C-BLU',
      name: '0.96 inch I2C OLED Display (Blue)',
      brand: 'Generic',
      category: 'ICs',
      price: 185.0,
      stockQuantity: 12,
      minStockThreshold: 15,
      isFeatured: false,
      shortDescription: 'Compact 128x64 blue OLED display module with I2C communication interface.',
      fullDescription: 'A compact 0.96 inch OLED display module using the SSD1306 driver. Communicates via I2C with two wires.',
      imageUrls: [
        '/images/products/oled-096-i2c-blue.jpg',
      ],
      specifications: {
        'Driver IC': 'SSD1306',
        Resolution: '128 × 64 px',
        Interface: 'I2C (SDA, SCL)',
      },
    },
    {
      sku: 'RES-KIT-30V-600',
      name: 'Assorted Resistor Kit (1/4W, 30 Values, 600pcs)',
      brand: 'Generic',
      category: 'Passive',
      price: 220.0,
      stockQuantity: 55,
      minStockThreshold: 10,
      isFeatured: false,
      shortDescription: 'Comprehensive resistor assortment with 600 pieces across 30 standard resistance values.',
      fullDescription: 'A comprehensive assorted resistor kit containing 600 pieces across 30 different resistance values from 10Ω to 1MΩ.',
      imageUrls: [
        '/images/products/resistor-kit-600.jpg',
      ],
      specifications: {
        Values: '30 (10Ω – 1MΩ)',
        'Total Pieces': '600 pcs',
        Tolerance: '±5%',
      },
    },
    {
      sku: 'HC-SR04-ULTRA',
      name: 'HC-SR04 Ultrasonic Distance Sensor',
      brand: 'HC',
      category: 'Sensors',
      price: 120.0,
      stockQuantity: 203,
      minStockThreshold: 20,
      isFeatured: true,
      shortDescription: 'Non-contact ultrasonic range detector measuring 2cm to 400cm.',
      fullDescription: 'The HC-SR04 ultrasonic distance sensor measures distances from 2cm to 4m using ultrasonic sound waves.',
      imageUrls: [
        '/images/products/hc-sr04-ultrasonic.jpg',
      ],
      specifications: {
        'Operating Voltage': '5V DC',
        'Max Range': '4 m',
        'Min Range': '2 cm',
      },
    },
    {
      sku: 'DHT22-SENSOR-MOD',
      name: 'DHT22 Temp & Humidity Sensor Module',
      brand: 'Aosong',
      category: 'Sensors',
      price: 165.0,
      stockQuantity: 8,
      minStockThreshold: 15,
      isFeatured: false,
      shortDescription: 'High precision calibrated digital temperature and humidity sensor module.',
      fullDescription: 'The DHT22 (AM2302) is a digital temperature and humidity sensor with calibrated digital signal output.',
      imageUrls: [
        '/images/products/dht22-sensor-module.jpg',
      ],
      specifications: {
        'Temperature Range': '-40°C to +80°C',
        'Humidity Range': '0–100% RH',
      },
    },
    {
      sku: 'L298N-DUAL-HBRIDGE',
      name: 'L298N Dual H-Bridge Motor Driver',
      brand: 'ST',
      category: 'ICs',
      price: 145.0,
      stockQuantity: 61,
      minStockThreshold: 15,
      isFeatured: false,
      shortDescription: 'Dual motor driver module for driving DC motors and stepper motors up to 46V/2A.',
      fullDescription: 'The L298N dual H-bridge motor driver module can control two DC motors or one stepper motor.',
      imageUrls: [
        '/images/products/l298n-motor-driver.jpg',
      ],
      specifications: {
        'Motor Channels': '2 (dual H-bridge)',
        'Max Current': '2A per channel',
      },
    },
    {
      sku: 'NE555-DIP8-TIMER',
      name: 'NE555 Precision Timer IC DIP-8',
      brand: 'Texas Instruments',
      category: 'ICs',
      price: 35.0,
      stockQuantity: 500,
      minStockThreshold: 50,
      isFeatured: false,
      shortDescription: 'Classic monolithic timing circuit for accurate time delays and oscillations.',
      fullDescription: 'The NE555 precision timing IC provides accurate time delays and oscillation from microseconds to hours.',
      imageUrls: [
        '/images/products/ne555-timer-ic.jpg',
      ],
      specifications: {
        Package: 'DIP-8',
        'Supply Voltage': '4.5V – 16V',
      },
    },
  ];

  for (const item of productsData) {
    const categoryId = categoryMap.get(item.category) || Array.from(categoryMap.values())[0];
    await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        brand: item.brand,
        categoryId,
        price: item.price,
        stockQuantity: item.stockQuantity,
        minStockThreshold: item.minStockThreshold,
        isFeatured: item.isFeatured,
        shortDescription: item.shortDescription,
        fullDescription: item.fullDescription,
        imageUrls: item.imageUrls,
        specifications: item.specifications,
      },
      create: {
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        categoryId,
        price: item.price,
        stockQuantity: item.stockQuantity,
        minStockThreshold: item.minStockThreshold,
        isFeatured: item.isFeatured,
        shortDescription: item.shortDescription,
        fullDescription: item.fullDescription,
        imageUrls: item.imageUrls,
        specifications: item.specifications,
      },
    });
  }

  console.log(`✔ Seeded ${productsData.length} canonical hardware products.`);
  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
