export interface InquiryChip {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: string;
}

export interface InquiryCategory {
  id: string;
  label: string;
  icon: string;
  chips: InquiryChip[];
}

export const INQUIRY_CATEGORIES: InquiryCategory[] = [
  {
    id: "circuits",
    label: "Circuit Help",
    icon: "🔬",
    chips: [
      {
        id: "c-volt",
        label: "Check 3.3V vs 5V logic",
        icon: "⚡",
        prompt: "Can I connect a 5V sensor directly to the ESP32 GPIO pins?",
        category: "circuits",
      },
      {
        id: "c-iot",
        label: "Suggest IoT Weather parts",
        icon: "🔌",
        prompt: "Recommend components for an IoT Weather / Smart Agriculture capstone project.",
        category: "circuits",
      },
      {
        id: "c-sensors",
        label: "DHT22 vs BME280 vs Ultrasonic",
        icon: "🧩",
        prompt: "What is the difference between DHT22, BME280, and HC-SR04 sensors?",
        category: "circuits",
      },
      {
        id: "c-power",
        label: "ESP32 Battery & Power supply",
        icon: "🔋",
        prompt: "What battery or power supply should I use to power an ESP32 or Arduino Uno in the field?",
        category: "circuits",
      },
      {
        id: "c-pinout",
        label: "Ask for pinouts & specs",
        icon: "📄",
        prompt: "Where can I find pinout diagrams and datasheet specifications for components in the catalog?",
        category: "circuits",
      },
      {
        id: "c-alt",
        label: "Find out-of-stock alternative",
        icon: "🔄",
        prompt: "Can you recommend a drop-in alternative for a component that is currently low on stock?",
        category: "circuits",
      },
    ],
  },
  {
    id: "bom",
    label: "BOM & Budget",
    icon: "📋",
    chips: [
      {
        id: "b-calc",
        label: "Estimate capstone budget",
        icon: "💰",
        prompt: "How does the Bill of Materials (BOM) cost estimator calculate our project budget?",
        category: "bom",
      },
      {
        id: "b-csv",
        label: "How to export BOM CSV",
        icon: "📋",
        prompt: "How can our engineering group export our BOM project list to CSV or spreadsheet for our thesis defense?",
        category: "bom",
      },
      {
        id: "b-discount",
        label: "Student group discounts",
        icon: "🎓",
        prompt: "Do you offer bulk student discounts or department laboratory kit pricing?",
        category: "bom",
      },
      {
        id: "b-desig",
        label: "Reference designators (R1, C1)",
        icon: "🏷️",
        prompt: "How do schematic reference designators (like R1, C1, U1) work when adding components to a BOM project?",
        category: "bom",
      },
      {
        id: "b-combine",
        label: "Combine group orders",
        icon: "📦",
        prompt: "Can we transfer multiple student BOM projects into a single cart to save on shipping fees?",
        category: "bom",
      },
    ],
  },
  {
    id: "logistics",
    label: "Region III Delivery",
    icon: "🚚",
    chips: [
      {
        id: "l-pickup",
        label: "Campus Lab Station pickup",
        icon: "🏫",
        prompt: "Where is the Campus Electronics Lab Station pickup point located, and is pickup free (₱0)?",
        category: "logistics",
      },
      {
        id: "l-fees",
        label: "Shipping fees by province",
        icon: "🚚",
        prompt: "What is the delivery fee and courier coverage across Central Luzon (Pampanga, Bulacan, Tarlac, Bataan, Nueva Ecija, Zambales, Aurora)?",
        category: "logistics",
      },
      {
        id: "l-couriers",
        label: "J&T / Flash delivery times",
        icon: "⏱️",
        prompt: "How long does standard delivery take via J&T Express or Flash Express within Region III?",
        category: "logistics",
      },
      {
        id: "l-track",
        label: "Track order status",
        icon: "📦",
        prompt: "How do I track my active order status and delivery waybill barcode?",
        category: "logistics",
      },
    ],
  },
  {
    id: "payments",
    label: "Payments & Proof",
    icon: "💳",
    chips: [
      {
        id: "p-qr",
        label: "Pay via GCash / Maya QR",
        icon: "📱",
        prompt: "How do I pay using GCash QR Ph or Maya QR scan-to-pay?",
        category: "payments",
      },
      {
        id: "p-receipt",
        label: "Official Receipt (OR) for thesis",
        icon: "🧾",
        prompt: "Can I request an Official Receipt (OR) or printed sales invoice for university capstone liquidation?",
        category: "payments",
      },
      {
        id: "p-cod",
        label: "Cash on Delivery availability",
        icon: "💵",
        prompt: "Is Cash on Delivery (COD) supported in my Central Luzon municipality?",
        category: "payments",
      },
      {
        id: "p-proof",
        label: "Payment slip upload help",
        icon: "⚠️",
        prompt: "My payment slip image upload failed or is taking long to review, how can I confirm my payment?",
        category: "payments",
      },
    ],
  },
  {
    id: "seller",
    label: "Chat to Seller",
    icon: "👤",
    chips: [
      {
        id: "s-human",
        label: "Connect to live seller/admin",
        icon: "👤",
        prompt: "I need to speak directly with the store administrator or laboratory technician.",
        category: "seller",
      },
      {
        id: "s-tested",
        label: "Are microcontrollers pre-tested?",
        icon: "🧪",
        prompt: "Are all microcontrollers, dev boards, and sensor modules tested before courier dispatch?",
        category: "seller",
      },
      {
        id: "s-warranty",
        label: "Warranty & DOA replacement",
        icon: "🛡️",
        prompt: "What is OhmSim's warranty policy for Dead-On-Arrival (DOA) or defective electronics components?",
        category: "seller",
      },
      {
        id: "s-bulk",
        label: "Reserve 30+ units for class",
        icon: "🏢",
        prompt: "Can our university laboratory class reserve 30+ units of components before checkout?",
        category: "seller",
      },
    ],
  },
];
