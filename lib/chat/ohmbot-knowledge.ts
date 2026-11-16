import { PRODUCTS } from "@/lib/mocks/products";

export interface BotAnswer {
  text: string;
  category: "circuit" | "bom" | "logistics" | "payment" | "seller" | "general";
  suggestedAction?: {
    type: "switch_seller" | "view_catalog" | "view_bom" | "view_orders" | "copy_spec";
    label: string;
    payload?: string;
  };
  relatedChips?: { label: string; prompt: string }[];
}

export function matchOhmBotQuery(query: string, productContext?: { id: string; name: string } | null): BotAnswer {
  const q = query.trim().toLowerCase();

  // 1. Human / Seller / Admin handoff request
  if (
    q.includes("human") ||
    q.includes("seller") ||
    q.includes("admin") ||
    q.includes("person") ||
    q.includes("technician") ||
    q.includes("staff") ||
    q.includes("agent") ||
    q.includes("speak to") ||
    q.includes("talk to")
  ) {
    return {
      category: "seller",
      text: "I can immediately connect you with our store engineering staff and laboratory technician. Click below to switch to the direct Seller Chat thread. Our desk is staffed 8:00 AM – 8:00 PM PHT.",
      suggestedAction: {
        type: "switch_seller",
        label: "👤 Switch to Store Seller Chat",
      },
      relatedChips: [
        { label: "Reserve 30+ units for class", prompt: "Can our university laboratory class reserve 30+ units before checkout?" },
        { label: "Warranty & DOA replacement", prompt: "What is OhmSim's warranty policy for defective or DOA components?" },
      ],
    };
  }

  // 2. Logic Levels & 3.3V vs 5V
  if (
    q.includes("3.3v") ||
    q.includes("5v") ||
    q.includes("logic level") ||
    q.includes("gpio") ||
    q.includes("voltage") ||
    q.includes("level shifter")
  ) {
    return {
      category: "circuit",
      text: `⚠️ **Crucial Circuit Rule:**
• **ESP32 & ESP8266 GPIO pins are strictly 3.3V logic!** Supplying 5V directly to GPIO will permanently degrade or burn the internal ESD protection diodes.
• **Safe Solution:** Use a 4-channel bidirectional I2C logic level shifter (TXS0108E or BSS138-based) or a resistor voltage divider (e.g. 1kΩ & 2kΩ) to step 5V signals down to 3.3V.
• **Powering via VIN:** You can safely feed 5V into the **VIN pin** of the ESP32 NodeMCU board because it passes through an onboard AMS1117 3.3V linear regulator.`,
      relatedChips: [
        { label: "Suggest IoT Weather parts", prompt: "Recommend components for an IoT Weather / Smart Agriculture capstone project." },
        { label: "ESP32 Battery & Power", prompt: "What battery or power supply should I use to power an ESP32 or Arduino in the field?" },
      ],
    };
  }

  // 3. Sensor Comparisons (DHT22 vs BME280 vs Ultrasonic)
  if (
    q.includes("dht22") ||
    q.includes("dht11") ||
    q.includes("bme280") ||
    q.includes("ultrasonic") ||
    q.includes("hc-sr04") ||
    q.includes("sensor")
  ) {
    return {
      category: "circuit",
      text: `📊 **Sensor Selection Guide:**
• **BME280 (Recommended for Thesis):** Measures Temperature, Humidity, AND Barometric Pressure with 3.3V I2C digital output. Ultra-fast 1-second refresh rate and high accuracy (±3% RH, ±1 hPa).
• **DHT22 (AM2302):** Digital Temp & Humidity (±2% RH accuracy). 2-second sampling rate. Simple 1-wire bus.
• **DHT11:** Entry-level educational sensor (±5% RH). Not recommended for research or calibrated thesis setups.
• **HC-SR04 (Ultrasonic):** 2cm–400cm distance sensing via 40kHz ultrasound pulses (5V VCC, requires voltage divider on ECHO pin for 3.3V MCUs).`,
      suggestedAction: {
        type: "view_catalog",
        label: "🔍 Browse Sensors in Catalog",
        payload: "Sensors",
      },
      relatedChips: [
        { label: "Check 3.3V vs 5V logic", prompt: "Can I connect a 5V sensor directly to the ESP32 GPIO pins?" },
        { label: "Suggest IoT Weather parts", prompt: "Recommend components for an IoT Weather / Smart Agriculture capstone project." },
      ],
    };
  }

  // 4. IoT Weather & Capstone Project Recommendations
  if (
    q.includes("weather") ||
    q.includes("capstone") ||
    q.includes("agriculture") ||
    q.includes("smart") ||
    q.includes("recommend") ||
    q.includes("iot") ||
    q.includes("project")
  ) {
    return {
      category: "circuit",
      text: `🌱 **Recommended IoT Environmental & Capstone BOM:**
1. **Core MCU:** ESP32-WROOM-32D Development Board (Wi-Fi + BLE, 38-pin).
2. **Climate Sensor:** BME280 Environmental Sensor (Temp, Humidity, Pressure via I2C).
3. **Soil Sensor:** Capacitive Soil Moisture Sensor v1.2 (Corrosion resistant analog output).
4. **Display:** 0.96" I2C OLED 128x64 (SSD1306) for real-time field telemetry without PC.
5. **Power:** 18650 Battery Shield with TP4056 micro-USB/Type-C charging module.
6. **Actuator:** 5V 1-Channel Relay Module (Optocoupler isolated) for water pump or fan control.`,
      suggestedAction: {
        type: "view_bom",
        label: "📋 Build this in BOM Estimator",
      },
      relatedChips: [
        { label: "Estimate capstone budget", prompt: "How does the Bill of Materials (BOM) cost estimator calculate our project budget?" },
        { label: "How to export BOM CSV", prompt: "How can our engineering group export our BOM project list to CSV or spreadsheet for our thesis defense?" },
      ],
    };
  }

  // 5. Battery & Power Supply
  if (
    q.includes("battery") ||
    q.includes("power") ||
    q.includes("18650") ||
    q.includes("lipo") ||
    q.includes("9v") ||
    q.includes("boost") ||
    q.includes("buck")
  ) {
    return {
      category: "circuit",
      text: `🔋 **Power & Battery Best Practices:**
• **Avoid Standard 9V Carbon-Zinc Batteries:** They have high internal resistance (30–40Ω) and will instantly drop voltage under Wi-Fi transmit bursts (ESP32 peaks at ~250mA).
• **Recommended Field Power:** Two 18650 Li-ion cells in series (7.4V nominal) fed into an LM2596 buck converter stepped down to 5.0V on the VIN pin.
• **Single Cell 3.7V Li-ion:** Use an MT3608 boost module (3.7V → 5V VIN) or supply regulated 3.3V directly to the 3V3 pin with a low-dropout protector.`,
      relatedChips: [
        { label: "Check 3.3V vs 5V logic", prompt: "Can I connect a 5V sensor directly to the ESP32 GPIO pins?" },
        { label: "Ask for pinouts & specs", prompt: "Where can I find pinout diagrams and datasheet specifications for components in the catalog?" },
      ],
    };
  }

  // 6. Payments & Official Receipts (OR)
  if (
    q.includes("payment") ||
    q.includes("gcash") ||
    q.includes("maya") ||
    q.includes("qr") ||
    q.includes("cod") ||
    q.includes("receipt") ||
    q.includes("invoice")
  ) {
    return {
      category: "payment",
      text: `💳 **Payment Methods & Liquidation:**
• **GCash & Maya QR Ph:** Scan the static QR on checkout. Upload your screenshot slip for automated reconciliation.
• **Official Receipts (OR):** BIR-registered sales invoices with student/group names and TIN/Student ID are included inside every parcel for department liquidation.
• **Cash on Delivery (COD):** Available across verified Central Luzon residential and school addresses.
• **Campus Lab Counter:** Pay in cash or QR upon parcel collection at the lab station.`,
      relatedChips: [
        { label: "Campus Lab Station pickup", prompt: "Where is the Campus Electronics Lab Station pickup point located, and is pickup free (₱0)?" },
        { label: "Connect to live seller/admin", prompt: "I need to speak directly with the store administrator or laboratory technician." },
      ],
    };
  }

  // 7. BOM (Bill of Materials) & Budget Estimator
  if (
    q.includes("bom") ||
    q.includes("budget") ||
    q.includes("csv") ||
    q.includes("export") ||
    q.includes("thesis") ||
    q.includes("designator") ||
    q.includes("group discount")
  ) {
    return {
      category: "bom",
      text: `📋 **OhmSim BOM Estimator Features:**
• **Interactive Budgeting:** Create named projects (e.g., *Automated Hydroponics v2*), assign reference designators (R1, C1, U1), and track cost per board.
• **Defense-Ready CSV Export:** Export one-click CSV with Part Number, Quantity, Unit Price, and Subtotal for thesis defense panels and department liquidation.
• **Group Order Merging:** Transfer items from multiple team BOMs directly into a single shared cart to split Region III courier fees.
• **Student Bulk Pricing:** 10% discount applied automatically on qualifying classroom kit orders (10+ units).`,
      suggestedAction: {
        type: "view_bom",
        label: "📋 Open BOM Workspace",
      },
      relatedChips: [
        { label: "Official Receipt for thesis", prompt: "Can I request an Official Receipt (OR) or printed sales invoice for university capstone liquidation?" },
        { label: "Student group discounts", prompt: "Do you offer bulk student discounts or department laboratory kit pricing?" },
      ],
    };
  }

  // 8. Region III Logistics & Campus Pickup
  if (
    q.includes("pickup") ||
    q.includes("station") ||
    q.includes("campus") ||
    q.includes("shipping") ||
    q.includes("courier") ||
    q.includes("j&t") ||
    q.includes("flash") ||
    q.includes("region 3") ||
    q.includes("central luzon") ||
    q.includes("pampanga") ||
    q.includes("bulacan") ||
    q.includes("tarlac") ||
    q.includes("bataan") ||
    q.includes("nueva ecija") ||
    q.includes("zambales") ||
    q.includes("aurora")
  ) {
    return {
      category: "logistics",
      text: `🚚 **Central Luzon (Region III) Fulfillment:**
• **🏫 Campus Lab Station Pickup (Free · ₱0):**
  Located at Building 3, Room 304 (Campus Electronics Laboratory). Present your order number (#ORD-...) during lab hours (Mon–Sat, 8:00 AM – 5:00 PM).
• **Courier Coverage (J&T Express & Flash Express):**
  • Pampanga: ₱65 (1–2 days)
  • Bulacan / Tarlac / Bataan: ₱75–₱80 (1–2 days)
  • Nueva Ecija / Zambales: ₱85–₱95 (2–3 days)
  • Aurora: ₱120 (2–4 days)
• Real-time courier waybill barcodes are generated upon parcel handover.`,
      suggestedAction: {
        type: "view_orders",
        label: "📦 View My Active Orders",
      },
      relatedChips: [
        { label: "Track order status", prompt: "How do I track my active order status and delivery waybill barcode?" },
        { label: "Pay via GCash / Maya QR", prompt: "How do I pay using GCash QR Ph or Maya QR scan-to-pay?" },
      ],
    };
  }

  // 9. Specific Product Context inquiry
  if (productContext) {
    const prod = PRODUCTS.find((p) => p.id === productContext.id);
    const prodName = prod?.name || productContext.name;
    const prodCategory = prod?.category || "Electronics Component";
    const prodPrice = prod?.price;
    const prodStock = prod ? prod.stock : 10;
    const specsSummary = prod?.specs ? Object.entries(prod.specs).map(([k, v]) => `• ${k}: ${v}`).join("\n") : "";
    return {
      category: "circuit",
      text: `🔍 **${prodName} Technical Overview:**
• **Category:** ${prodCategory}
${prodPrice !== undefined ? `• **Price:** ₱${prodPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}\n` : ""}• **Stock Status:** ${prodStock > 0 ? `In Stock (${prodStock} units ready)` : "Out of stock / Pre-order"}
${specsSummary ? `\n📋 **Key Specifications:**\n${specsSummary}` : ""}
${prod?.about ? `\nℹ️ **Description:**\n${prod.about}` : ""}

Would you like circuit integration advice, pinouts, or to speak to our lab technician regarding this part?`,
      suggestedAction: {
        type: "switch_seller",
        label: `👤 Inquire Seller about ${prodName}`,
      },
      relatedChips: [
        { label: "Check 3.3V vs 5V logic", prompt: `Is the ${prodName} 3.3V or 5V logic compatible?` },
        { label: "Ask for pinouts & specs", prompt: `Where can I find the official datasheet and pinout for ${prodName}?` },
      ],
    };
  }

  // 10. Default General Electronics & Catalog Assistant Response
  return {
    category: "general",
    text: `⚡ **OhmBot Engineering Assistant:**
I can assist you with:
• **Circuit Integration:** 3.3V vs 5V logic levels, microcontroller selection, sensor wiring, and battery sizing.
• **BOM & Budget:** Estimating project costs, assigning schematic designators, and exporting CSVs for thesis defense.
• **Fulfillment:** Region III delivery rates, free Campus Lab pickup, and GCash/Maya QR payments.
• **Seller Direct:** Connect directly to our electronics store administrators.

What component or project question do you have today?`,
    suggestedAction: {
      type: "view_catalog",
      label: "🔍 Explore Catalog",
    },
    relatedChips: [
      { label: "Check 3.3V vs 5V logic", prompt: "Can I connect a 5V sensor directly to the ESP32 GPIO pins?" },
      { label: "Suggest IoT Weather parts", prompt: "Recommend components for an IoT Weather / Smart Agriculture capstone project." },
      { label: "Campus Lab Station pickup", prompt: "Where is the Campus Electronics Lab Station pickup point located, and is pickup free (₱0)?" },
      { label: "Connect to live seller/admin", prompt: "I need to speak directly with the store administrator or laboratory technician." },
    ],
  };
}
