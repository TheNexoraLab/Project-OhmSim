export type AdminOrderStatusDisplay =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface CustomerOrderHistoryItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  paymentMethod: 'COD' | 'PAY_ON_PICKUP';
  status: AdminOrderStatusDisplay;
  totalAmount: number;
  itemCount: number;
  primarySkuSummary: string;
  deliveryAddress: string;
}

export interface AdminCustomerRecord {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  email: string;
  phone: string;
  affiliation: string;
  role: string;
  province:
    | 'Pampanga'
    | 'Bulacan'
    | 'Nueva Ecija'
    | 'Bataan'
    | 'Tarlac'
    | 'Zambales';
  cityMunicipality: string;
  defaultAddress: string;
  campusLabVerified: boolean;
  activeCentralLuzon: boolean;
  joinedAt: string;
  orders: CustomerOrderHistoryItem[];
}

export const CANONICAL_CUSTOMERS: AdminCustomerRecord[] = [
  {
    id: "cust-alex-rivera",
    name: "Alex Rivera",
    initials: "AR",
    avatarColor: "#89B4FA",
    email: "alex.rivera@ohmsim.ph",
    phone: "+63 917 123 4567",
    affiliation: "MakerSpace PH",
    role: "Electronics Engineer",
    province: "Pampanga",
    cityMunicipality: "San Fernando",
    defaultAddress: "123 Rizal Ave, Dolores, San Fernando, Pampanga, Region III",
    campusLabVerified: true,
    activeCentralLuzon: true,
    joinedAt: "2026-06-12T08:00:00Z",
    orders: [
      {
        id: "o-ar-1",
        orderNumber: "#OHM-2026-094",
        createdAt: "2026-08-30T10:15:00Z",
        fulfillmentType: "DELIVERY",
        paymentMethod: "COD",
        status: "PENDING",
        totalAmount: 980.0,
        itemCount: 5,
        primarySkuSummary: "ESP32-WROOM-32U (2x) +2 more",
        deliveryAddress: "123 Rizal Ave, Dolores, San Fernando, Pampanga",
      },
      {
        id: "o-ar-2",
        orderNumber: "#OHM-2026-089",
        createdAt: "2026-08-28T09:40:00Z",
        fulfillmentType: "DELIVERY",
        paymentMethod: "COD",
        status: "PROCESSING",
        totalAmount: 615.0,
        itemCount: 3,
        primarySkuSummary: "ARD-UNO-R3-COMP (1x) +1 more",
        deliveryAddress: "123 Rizal Ave, Dolores, San Fernando, Pampanga",
      },
      {
        id: "o-ar-3",
        orderNumber: "#OHM-2026-074",
        createdAt: "2026-08-21T14:20:00Z",
        fulfillmentType: "DELIVERY",
        paymentMethod: "COD",
        status: "SHIPPED",
        totalAmount: 1225.0,
        itemCount: 6,
        primarySkuSummary: "OLED-096-I2C-BLU (3x) +1 more",
        deliveryAddress: "123 Rizal Ave, Dolores, San Fernando, Pampanga",
      },
      {
        id: "o-ar-4",
        orderNumber: "#OHM-2026-041",
        createdAt: "2026-07-31T11:00:00Z",
        fulfillmentType: "DELIVERY",
        paymentMethod: "COD",
        status: "DELIVERED",
        totalAmount: 225.0,
        itemCount: 1,
        primarySkuSummary: "DHT22-SENSOR-MOD (1x)",
        deliveryAddress: "123 Rizal Ave, Dolores, San Fernando, Pampanga",
      },
    ],
  },
  {
    id: "cust-camille-santos",
    name: "Engr. Camille Santos",
    initials: "CS",
    avatarColor: "#94E2D5",
    email: "c.santos@hau-ece-lab.edu.ph",
    phone: "+63 918 345 9912",
    affiliation: "Holy Angel University — ECE Lab",
    role: "Capstone Lab Coordinator",
    province: "Pampanga",
    cityMunicipality: "Angeles City",
    defaultAddress: "Campus Electronics Lab Station — Building 3, Room 204, Angeles City, Pampanga",
    campusLabVerified: true,
    activeCentralLuzon: true,
    joinedAt: "2026-06-20T10:15:00Z",
    orders: [
      {
        id: "o-cs-1",
        orderNumber: "#OHM-2026-091",
        createdAt: "2026-08-29T13:10:00Z",
        fulfillmentType: "PICKUP",
        paymentMethod: "PAY_ON_PICKUP",
        status: "PROCESSING",
        totalAmount: 800.0,
        itemCount: 3,
        primarySkuSummary: "ESP32-WROOM-32U (2x) +1 more",
        deliveryAddress: "Designated Campus Electronics Lab Station (Building 3, Room 204)",
      },
      {
        id: "o-cs-2",
        orderNumber: "#OHM-2026-055",
        createdAt: "2026-08-10T15:40:00Z",
        fulfillmentType: "PICKUP",
        paymentMethod: "PAY_ON_PICKUP",
        status: "SHIPPED",
        totalAmount: 535.0,
        itemCount: 3,
        primarySkuSummary: "ARD-UNO-R3-COMP (1x) +1 more",
        deliveryAddress: "Designated Campus Electronics Lab Station (Building 3, Room 204)",
      },
    ],
  },
  {
    id: "cust-miguel-delacruz",
    name: "Miguel Dela Cruz",
    initials: "MD",
    avatarColor: "#CBA6F7",
    email: "miguel.delacruz@bulsu-mechatronics.ph",
    phone: "+63 927 881 0345",
    affiliation: "BulSU Mechatronics & Robotics Society",
    role: "Embedded Systems Lead",
    province: "Bulacan",
    cityMunicipality: "Malolos City",
    defaultAddress: "Capitol View Park Subd., Brgy. Guinhawa, Malolos City, Bulacan, Region III",
    campusLabVerified: true,
    activeCentralLuzon: true,
    joinedAt: "2026-07-02T09:30:00Z",
    orders: [
      {
        id: "o-md-1",
        orderNumber: "#OHM-2026-084",
        createdAt: "2026-08-25T11:20:00Z",
        fulfillmentType: "DELIVERY",
        paymentMethod: "COD",
        status: "DELIVERED",
        totalAmount: 1170.0,
        itemCount: 12,
        primarySkuSummary: "L298N-DUAL-HBRIDGE (6x) +1 more",
        deliveryAddress: "Capitol View Park Subd., Brgy. Guinhawa, Malolos City, Bulacan",
      },
      {
        id: "o-md-2",
        orderNumber: "#OHM-2026-049",
        createdAt: "2026-08-04T16:05:00Z",
        fulfillmentType: "DELIVERY",
        paymentMethod: "COD",
        status: "DELIVERED",
        totalAmount: 980.0,
        itemCount: 2,
        primarySkuSummary: "ARD-UNO-R3-COMP (2x)",
        deliveryAddress: "Capitol View Park Subd., Brgy. Guinhawa, Malolos City, Bulacan",
      },
    ],
  },
  {
    id: "cust-jennifer-pangilinan",
    name: "Jennifer Pangilinan",
    initials: "JP",
    avatarColor: "#F9E2AF",
    email: "jpangilinan@clsu-agritech.org",
    phone: "+63 917 552 9088",
    affiliation: "CLSU Agri-Telemetry IoT Station",
    role: "IoT Instrumentation Researcher",
    province: "Nueva Ecija",
    cityMunicipality: "Cabanatuan City",
    defaultAddress: "789 Maharlika Hwy, Brgy. Sumacab Este, Cabanatuan City, Nueva Ecija, Region III",
    campusLabVerified: true,
    activeCentralLuzon: true,
    joinedAt: "2026-07-14T14:00:00Z",
    orders: [
      {
        id: "o-jp-1",
        orderNumber: "#OHM-2026-081",
        createdAt: "2026-08-23T10:00:00Z",
        fulfillmentType: "DELIVERY",
        paymentMethod: "COD",
        status: "SHIPPED",
        totalAmount: 1620.0,
        itemCount: 7,
        primarySkuSummary: "DHT22-SENSOR-MOD (5x) +1 more",
        deliveryAddress: "789 Maharlika Hwy, Brgy. Sumacab Este, Cabanatuan City, Nueva Ecija",
      },
    ],
  },
  {
    id: "cust-kenneth-galang",
    name: "Kenneth Galang",
    initials: "KG",
    avatarColor: "#A6E3A1",
    email: "k.galang@bpsu-robotics.edu.ph",
    phone: "+63 998 412 7760",
    affiliation: "BPSU Embedded Prototyping Guild",
    role: "Student Hardware Lead",
    province: "Bataan",
    cityMunicipality: "Balanga City",
    defaultAddress: "Don Manuel Banzon Ave, Brgy. Poblacion, Balanga City, Bataan, Region III",
    campusLabVerified: true,
    activeCentralLuzon: true,
    joinedAt: "2026-07-22T11:45:00Z",
    orders: [
      {
        id: "o-kg-1",
        orderNumber: "#OHM-2026-069",
        createdAt: "2026-08-18T09:15:00Z",
        fulfillmentType: "DELIVERY",
        paymentMethod: "COD",
        status: "DELIVERED",
        totalAmount: 1100.0,
        itemCount: 4,
        primarySkuSummary: "ESP32-WROOM-32U (3x) +1 more",
        deliveryAddress: "Don Manuel Banzon Ave, Brgy. Poblacion, Balanga City, Bataan",
      },
    ],
  },
  {
    id: "cust-trisha-mendoza",
    name: "Trisha Mendoza",
    initials: "TM",
    avatarColor: "#74C7EC",
    email: "trisha.mendoza@tsu-automation.ph",
    phone: "+63 915 609 3321",
    affiliation: "Tarlac Industrial PCB Fab Studio",
    role: "Hardware Test Engineer",
    province: "Tarlac",
    cityMunicipality: "Tarlac City",
    defaultAddress: "Romulo Blvd, Brgy. San Vicente, Tarlac City, Tarlac, Region III",
    campusLabVerified: false,
    activeCentralLuzon: true,
    joinedAt: "2026-08-01T13:20:00Z",
    orders: [
      {
        id: "o-tm-1",
        orderNumber: "#OHM-2026-044",
        createdAt: "2026-08-02T16:45:00Z",
        fulfillmentType: "DELIVERY",
        paymentMethod: "COD",
        status: "DELIVERED",
        totalAmount: 600.0,
        itemCount: 4,
        primarySkuSummary: "OLED-096-I2C-BLU (4x)",
        deliveryAddress: "Romulo Blvd, Brgy. San Vicente, Tarlac City, Tarlac",
      },
    ],
  },
];
