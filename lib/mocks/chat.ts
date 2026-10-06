import type { ChatConversation } from "@/types/chat";

export const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: "c1",
    name: "OhmSim Support",
    subtitle: "Technical & Component Help",
    initials: "Ω",
    color: "#89B4FA",
    online: true,
    messages: [
      {
        id: "m1",
        from: "buyer",
        type: "text",
        text: "Hi! Can this ESP32 board be powered directly via the 5V VIN pin?",
        time: "9:58 AM",
      },
      {
        id: "m2",
        from: "system",
        type: "product",
        productId: "1",
        time: "9:58 AM",
      },
      {
        id: "m3",
        from: "system",
        type: "order",
        orderNumber: "OHM-2026-089",
        orderStatus: "PREPARING",
        time: "9:59 AM",
      },
      {
        id: "m4",
        from: "admin",
        type: "text",
        text: "Yes! The onboard LDO voltage regulator safely steps 5V from VIN down to 3.3V for internal MCU logic.",
        time: "10:00 AM",
      },
    ],
  },
  {
    id: "c2",
    name: "Fulfillment Team",
    subtitle: "Region III Courier Updates",
    initials: "FT",
    color: "#A6E3A1",
    online: true,
    messages: [
      {
        id: "m2-1",
        from: "admin",
        type: "text",
        text: "Hello Alex! Your order #OHM-2026-074 is out for delivery with our rider in Angeles City today.",
        time: "1:45 PM",
      },
      {
        id: "m2-2",
        from: "buyer",
        type: "text",
        text: "Thank you! I have exact cash (₱1,225.00) ready for COD.",
        time: "1:48 PM",
      },
    ],
  },
  {
    id: "c3",
    name: "Academic Projects",
    subtitle: "Lab & Bulk Inquiries",
    initials: "AP",
    color: "#FAB387",
    online: false,
    messages: [
      {
        id: "m3-1",
        from: "buyer",
        type: "text",
        text: "Do you offer bulk component reservations for capstone design projects?",
        time: "Yesterday",
      },
      {
        id: "m3-2",
        from: "admin",
        type: "text",
        text: "You can assemble your component list in the BOM workspace before contacting support.",
        time: "Yesterday",
      },
    ],
  },
];

export const CHAT_AUTO_REPLIES: Record<string, string[]> = {
  c1: [
    "Thanks for reaching out! Let me check the technical pinout and datasheet for you.",
    "Understood. For that component, our engineering team recommends adhering to 3.3V logic levels.",
    "Feel free to share your BOM or schematic if you need further pin compatibility checks!",
  ],
  c2: [
    "You can review your order status and delivery information on the Orders page.",
    "Delivery is available within Region III with Cash on Delivery.",
  ],
  c3: [
    "You can review the quantities and availability of components in your BOM workspace.",
    "Let us know if you need an official quote for university lab procurement.",
  ],
};
