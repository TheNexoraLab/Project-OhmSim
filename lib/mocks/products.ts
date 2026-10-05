import type { Product, BomProject } from "@/types/product";

/**
 * OhmSim Mock Products
 * Faithful reference extraction from 01-shared.txt (lines 98-213).
 * NOTE: These are mock fixtures for frontend development, not verified production catalog data.
 */
export const PRODUCTS: Product[] = [
  {
    id: "1",
    sku: "ESP32-WROOM-32U",
    category: "Microcontrollers",
    label: "ESP32 Development Board",
    brand: "Espressif",
    name: "Espressif ESP32-WROOM-32U Kit",
    price: 295,
    voltage: 5,
    resistance: null,
    stock: 142,
    status: "in-stock",
    image: "https://images.unsplash.com/photo-1634452015397-ad0686a2ae2d?w=400&h=300&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1634452015397-ad0686a2ae2d?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1603732551658-5fabbafa84eb?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1631376604263-5d803038b389?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1649959168260-2eb9702d7b69?w=600&h=500&fit=crop&auto=format",
    ],
    specs: {
      "Microcontroller": "ESP32-D0WD",
      "Flash Memory": "4 MB",
      "SRAM": "520 KB",
      "Operating Voltage": "3.3V (5V tolerant)",
      "Wi-Fi": "802.11 b/g/n",
      "Bluetooth": "BT 4.2 & BLE",
      "GPIO Pins": "34",
      "ADC Channels": "18 × 12-bit",
      "Clock Speed": "Up to 240 MHz",
      "Dimensions": "18 × 20 mm",
    },
    about:
      "The ESP32-WROOM-32U is a powerful, generic Wi-Fi+BT+BLE MCU module targeting a wide variety of applications. At the core of this module is the ESP32-D0WD-V3 chip. The chip embedded is designed to be scalable and adaptive. Its CPU and memory can be reconfigured, and its power supply, clock, and peripheral interfaces are highly configurable.",
  },
  {
    id: "2",
    sku: "ARD-UNO-R3-COMP",
    category: "Microcontrollers",
    label: "Arduino Uno R3",
    brand: "Arduino",
    name: "Arduino Uno R3 Compatible Board",
    price: 450,
    voltage: 5,
    resistance: null,
    stock: 87,
    status: "in-stock",
    image: "https://images.unsplash.com/photo-1603732551658-5fabbafa84eb?w=400&h=300&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1603732551658-5fabbafa84eb?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1634452015397-ad0686a2ae2d?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1603732551681-2e91159b9dc2?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1649959168260-2eb9702d7b69?w=600&h=500&fit=crop&auto=format",
    ],
    specs: {
      "Microcontroller": "ATmega328P",
      "Operating Voltage": "5V",
      "Input Voltage": "7–12V",
      "Digital I/O Pins": "14 (6 PWM)",
      "Analog Input Pins": "6",
      "Flash Memory": "32 KB",
      "SRAM": "2 KB",
      "EEPROM": "1 KB",
      "Clock Speed": "16 MHz",
      "Dimensions": "68.6 × 53.4 mm",
    },
    about:
      "The Arduino UNO R3 is a microcontroller board based on the ATmega328P. It has 14 digital input/output pins, 6 analog inputs, a 16 MHz ceramic resonator, a USB connection, a power jack, an ICSP header, and a reset button. It contains everything needed to support the microcontroller.",
  },
  {
    id: "3",
    sku: "OLED-096-I2C-BLU",
    category: "ICs",
    label: "0.96 inch OLED Display",
    brand: "Generic",
    name: "0.96 inch I2C OLED Display (Blue)",
    price: 185,
    voltage: 3.3,
    resistance: null,
    stock: 12,
    status: "low-stock",
    image: "https://images.unsplash.com/photo-1631376604263-5d803038b389?w=400&h=300&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1631376604263-5d803038b389?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1631376604269-6f42b26fa9b7?w=600&h=500&fit=crop&auto=format",
    ],
    specs: {
      "Driver IC": "SSD1306",
      "Display Size": "0.96 inch",
      "Resolution": "128 × 64 px",
      "Interface": "I2C (SDA, SCL)",
      "I2C Address": "0x3C / 0x3D",
      "Operating Voltage": "3.3V – 5V",
      "Color": "Blue",
      "Viewing Angle": "160°",
      "Dimensions": "27 × 27 × 4 mm",
    },
    about:
      "A compact 0.96 inch OLED display module using the SSD1306 driver. Communicates via I2C, making it easy to connect with just two wires. Ideal for displaying sensor readings, menus, and status information in embedded projects.",
  },
  {
    id: "4",
    sku: "RES-KIT-30V-600",
    category: "Passive",
    label: "Resistor Kits",
    brand: "Generic",
    name: "Assorted Resistor Kit (1/4W, 30 Values, 600pcs)",
    price: 220,
    voltage: 12,
    resistance: 1000,
    stock: 55,
    status: "in-stock",
    image: "https://images.unsplash.com/photo-1746016805172-86dc8aaf6484?w=400&h=300&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1746016805172-86dc8aaf6484?w=600&h=500&fit=crop&auto=format",
    ],
    specs: {
      "Values": "30 (10Ω – 1MΩ)",
      "Total Pieces": "600 pcs",
      "Power Rating": "1/4W (0.25W)",
      "Tolerance": "±5%",
      "Package": "Through-hole (axial)",
      "Type": "Carbon Film",
      "Voltage Rating": "250V max",
    },
    about:
      "A comprehensive assorted resistor kit containing 600 pieces across 30 different resistance values from 10Ω to 1MΩ. Perfect for prototyping, breadboard work, and general electronics projects. All resistors are 1/4W carbon film with ±5% tolerance.",
  },
  {
    id: "5",
    sku: "HC-SR04-ULTRA",
    category: "Sensors",
    label: "Ultrasonic Sensor Module",
    brand: "HC",
    name: "HC-SR04 Ultrasonic Distance Sensor",
    price: 120,
    voltage: 5,
    resistance: null,
    stock: 203,
    status: "in-stock",
    image: "https://images.unsplash.com/photo-1649959168260-2eb9702d7b69?w=400&h=300&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1649959168260-2eb9702d7b69?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1675602488453-c3897a475af5?w=600&h=500&fit=crop&auto=format",
    ],
    specs: {
      "Operating Voltage": "5V DC",
      "Operating Current": "15 mA",
      "Frequency": "40 kHz",
      "Max Range": "4 m",
      "Min Range": "2 cm",
      "Measuring Angle": "15°",
      "Trigger Input": "10µs TTL pulse",
      "Interface": "Trigger + Echo pins",
      "Dimensions": "45 × 20 × 15 mm",
    },
    about:
      "The HC-SR04 ultrasonic distance sensor measures distances from 2cm to 4m using ultrasonic sound waves. It operates on 5V, uses only two GPIO pins, and provides accurate non-contact distance measurements ideal for robotics, obstacle detection, and level sensing.",
  },
  {
    id: "6",
    sku: "DHT22-SENSOR-MOD",
    category: "Sensors",
    label: "Temperature & Humidity Sensor",
    brand: "Aosong",
    name: "DHT22 Temp & Humidity Sensor Module",
    price: 165,
    voltage: 3.3,
    resistance: null,
    stock: 8,
    status: "low-stock",
    image: "https://images.unsplash.com/photo-1675602488453-c3897a475af5?w=400&h=300&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1675602488453-c3897a475af5?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1649959168260-2eb9702d7b69?w=600&h=500&fit=crop&auto=format",
    ],
    specs: {
      "Temperature Range": "-40°C to +80°C",
      "Temp Accuracy": "±0.5°C",
      "Humidity Range": "0–100% RH",
      "Humidity Accuracy": "±2–5% RH",
      "Operating Voltage": "3.3V – 5.5V",
      "Sampling Rate": "0.5 Hz (1 reading/2s)",
      "Interface": "Single-wire digital",
      "Dimensions": "15.1 × 25 mm",
    },
    about:
      "The DHT22 (AM2302) is a digital temperature and humidity sensor with a calibrated digital signal output. It uses a capacitive humidity sensor and a thermistor to measure surrounding air, providing reliable readings with better accuracy and range than the DHT11.",
  },
  {
    id: "7",
    sku: "L298N-DUAL-HBRIDGE",
    category: "ICs",
    label: "Motor Driver Module",
    brand: "ST",
    name: "L298N Dual H-Bridge Motor Driver",
    price: 145,
    voltage: 12,
    resistance: null,
    stock: 61,
    status: "in-stock",
    image: "https://images.unsplash.com/photo-1603732551681-2e91159b9dc2?w=400&h=300&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1603732551681-2e91159b9dc2?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1603732551658-5fabbafa84eb?w=600&h=500&fit=crop&auto=format",
    ],
    specs: {
      "Driver IC": "L298N",
      "Motor Channels": "2 (dual H-bridge)",
      "Max Motor Voltage": "46V",
      "Max Motor Current": "2A per channel",
      "Logic Voltage": "5V",
      "Control Input": "TTL compatible",
      "Onboard Regulator": "5V (up to 3A load)",
      "Dimensions": "43 × 43 × 27 mm",
    },
    about:
      "The L298N dual H-bridge motor driver module can control two DC motors or one stepper motor. It supports motor voltages up to 46V and 2A per channel, with an onboard 5V voltage regulator for powering the logic and microcontroller. Widely used in robotics and automation.",
  },
  {
    id: "8",
    sku: "NE555-DIP8-TIMER",
    category: "ICs",
    label: "Timer IC",
    brand: "Texas Instruments",
    name: "NE555 Precision Timer IC DIP-8",
    price: 35,
    voltage: 12,
    resistance: 100,
    stock: 500,
    status: "in-stock",
    image: "https://images.unsplash.com/photo-1631376604269-6f42b26fa9b7?w=400&h=300&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1631376604269-6f42b26fa9b7?w=600&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1631376604263-5d803038b389?w=600&h=500&fit=crop&auto=format",
    ],
    specs: {
      "Package": "DIP-8",
      "Supply Voltage": "4.5V – 16V",
      "Timing Range": "μs to hours",
      "Output Current": "200 mA (source/sink)",
      "Operating Temp": "0°C to +70°C",
      "Trigger Threshold": "1/3 VCC",
      "Modes": "Astable, Monostable",
      "Dimensions": "9.4 × 6.2 × 3.6 mm",
    },
    about:
      "The NE555 is a highly stable timer IC capable of producing accurate time delays and oscillations. With its versatile design, it can be used in astable (oscillator) and monostable (one-shot) modes. A cornerstone component in electronics prototyping.",
  },
];

/**
 * Initial BOM projects faithful to 01-shared.txt (lines 215-242).
 * Project IDs: b1, b2, b3.
 * Names and lineItem IDs match the exact products defined above.
 */
export const INITIAL_BOM_PROJECTS: BomProject[] = [
  {
    id: "b1",
    name: "Arduino Line-Following Robot",
    lineItems: [
      { productId: "1", qty: 1 }, // Espressif ESP32-WROOM-32U Kit
      { productId: "5", qty: 2 }, // HC-SR04 Ultrasonic Distance Sensor
      { productId: "7", qty: 1 }, // L298N Dual H-Bridge Motor Driver
      { productId: "4", qty: 1 }, // Assorted Resistor Kit (1/4W, 30 Values, 600pcs)
    ],
  },
  {
    id: "b2",
    name: "IoT Weather Station",
    lineItems: [
      { productId: "2", qty: 1 }, // Arduino Uno R3 Compatible Board
      { productId: "6", qty: 1 }, // DHT22 Temp & Humidity Sensor Module
      { productId: "3", qty: 1 }, // 0.96 inch I2C OLED Display (Blue)
    ],
  },
  {
    id: "b3",
    name: "Smart Plant Watering System",
    lineItems: [
      { productId: "1", qty: 1 }, // Espressif ESP32-WROOM-32U Kit
      { productId: "5", qty: 1 }, // HC-SR04 Ultrasonic Distance Sensor
      { productId: "8", qty: 2 }, // NE555 Precision Timer IC DIP-8
    ],
  },
];
