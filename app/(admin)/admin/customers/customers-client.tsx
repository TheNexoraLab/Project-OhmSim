"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INITIAL_ORDERS } from "@/lib/mocks/orders";
import { PRODUCTS as MOCK_PRODUCTS } from "@/lib/mocks/products";
import { INITIAL_USER_PROFILE } from "@/lib/mocks/profile";
import { INITIAL_SAVED_ADDRESSES } from "@/lib/mocks/addresses";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

type AdminOrderStatusDisplay =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface CustomerOrderHistoryItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  fulfillmentType: "DELIVERY" | "PICKUP";
  paymentMethod: "COD" | "PAY_ON_PICKUP";
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
    | "Pampanga"
    | "Bulacan"
    | "Nueva Ecija"
    | "Bataan"
    | "Tarlac"
    | "Zambales";
  cityMunicipality: string;
  defaultAddress: string;
  campusLabVerified: boolean;
  activeCentralLuzon: boolean;
  joinedAt: string;
  orders: CustomerOrderHistoryItem[];
}

const ORDER_STATUS_STYLES: Record<
  AdminOrderStatusDisplay,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING: {
    label: "PENDING",
    color: "#F9E2AF",
    bg: "rgba(249, 226, 175, 0.12)",
    border: "rgba(249, 226, 175, 0.3)",
  },
  PROCESSING: {
    label: "PROCESSING",
    color: "#89B4FA",
    bg: "rgba(137, 180, 250, 0.12)",
    border: "rgba(137, 180, 250, 0.3)",
  },
  SHIPPED: {
    label: "SHIPPED",
    color: "#CBA6F7",
    bg: "rgba(203, 166, 247, 0.12)",
    border: "rgba(203, 166, 247, 0.3)",
  },
  DELIVERED: {
    label: "DELIVERED",
    color: "#A6E3A1",
    bg: "rgba(166, 227, 161, 0.12)",
    border: "rgba(166, 227, 161, 0.3)",
  },
  CANCELLED: {
    label: "CANCELLED",
    color: "#F38BA8",
    bg: "rgba(243, 139, 168, 0.12)",
    border: "rgba(243, 139, 168, 0.3)",
  },
};

function mapMockStatusToAdmin(status: string): AdminOrderStatusDisplay {
  switch (status) {
    case "PENDING":
      return "PENDING";
    case "PREPARING":
      return "PROCESSING";
    case "OUT_FOR_DELIVERY":
    case "READY_FOR_PICKUP":
      return "SHIPPED";
    case "COMPLETED":
      return "DELIVERED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "PROCESSING";
  }
}

function buildCustomersDataset(): AdminCustomerRecord[] {
  const alexDefaultAddr =
    INITIAL_SAVED_ADDRESSES.find((a) => a.isDefault) ??
    INITIAL_SAVED_ADDRESSES[0];

  const alexOrders: CustomerOrderHistoryItem[] = INITIAL_ORDERS.map((order) => {
    const totalUnits = order.items.reduce((acc, item) => acc + item.qty, 0);
    const firstItem = order.items[0];
    const summary = firstItem
      ? `${firstItem.productSku} (${firstItem.qty}x)${
          order.items.length > 1 ? ` +${order.items.length - 1} more` : ""
        }`
      : "Hardware Kit";

    return {
      id: order.id,
      orderNumber: `#${order.orderNumber}`,
      createdAt: order.createdAt,
      fulfillmentType: order.fulfillmentType,
      paymentMethod: order.paymentMethod,
      status: mapMockStatusToAdmin(order.status),
      totalAmount: order.totalAmount,
      itemCount: totalUnits,
      primarySkuSummary: summary,
      deliveryAddress:
        order.deliveryAddress ??
        "Designated Campus Electronics Lab / Store Station",
    };
  });

  const esp32 = MOCK_PRODUCTS[0];
  const uno = MOCK_PRODUCTS[1];
  const oled = MOCK_PRODUCTS[2];
  const resKit = MOCK_PRODUCTS[3];
  const hcsr04 = MOCK_PRODUCTS[4];
  const dht22 = MOCK_PRODUCTS[5];
  const l298n = MOCK_PRODUCTS[6];

  return [
    {
      id: "cust-alex-rivera",
      name: `${INITIAL_USER_PROFILE.firstName} ${INITIAL_USER_PROFILE.lastName}`,
      initials: "AR",
      avatarColor: "#89B4FA",
      email: INITIAL_USER_PROFILE.email,
      phone: INITIAL_USER_PROFILE.mobile,
      affiliation: INITIAL_USER_PROFILE.company || "MakerSpace PH",
      role: INITIAL_USER_PROFILE.role || "Electronics Engineer",
      province: "Pampanga",
      cityMunicipality: alexDefaultAddr?.cityMunicipality || "San Fernando",
      defaultAddress: alexDefaultAddr
        ? `${alexDefaultAddr.streetAddress}, Brgy. ${alexDefaultAddr.barangay}, ${alexDefaultAddr.cityMunicipality}, ${alexDefaultAddr.province}, ${alexDefaultAddr.region}`
        : "123 Rizal Ave, Dolores, San Fernando, Pampanga, Region III",
      campusLabVerified: true,
      activeCentralLuzon: true,
      joinedAt: "2026-06-12T08:00:00Z",
      orders: alexOrders,
    },
    {
      id: "cust-camille-santos",
      name: "Engr. Camille Santos",
      initials: "CS",
      avatarColor: "#94E2D5",
      email: "c.santos@hau-ece-lab.edu.ph",
      phone: "09183459912",
      affiliation: "Holy Angel University — ECE Lab",
      role: "Capstone Lab Coordinator",
      province: "Pampanga",
      cityMunicipality: "Angeles City",
      defaultAddress:
        "Campus Electronics Lab Station — Building 3, Room 204, Angeles City, Pampanga",
      campusLabVerified: true,
      activeCentralLuzon: true,
      joinedAt: "2026-06-20T10:15:00Z",
      orders: [
        {
          id: "o-cs-1",
          orderNumber: "#OHM-2026-092",
          createdAt: "2026-08-29T13:10:00Z",
          fulfillmentType: "PICKUP",
          paymentMethod: "PAY_ON_PICKUP",
          status: "PENDING",
          totalAmount: (esp32?.price ?? 285) * 4 + (oled?.price ?? 150) * 4,
          itemCount: 8,
          primarySkuSummary: `${esp32?.sku ?? "ESP32-WROOM-32U"} (4x) +1 more`,
          deliveryAddress:
            "Designated Campus Electronics Lab / Store Station (Building 3, Room 204)",
        },
        {
          id: "o-cs-2",
          orderNumber: "#OHM-2026-063",
          createdAt: "2026-08-14T15:40:00Z",
          fulfillmentType: "PICKUP",
          paymentMethod: "PAY_ON_PICKUP",
          status: "DELIVERED",
          totalAmount: (uno?.price ?? 450) * 3 + (resKit?.price ?? 165) * 2,
          itemCount: 5,
          primarySkuSummary: `${uno?.sku ?? "ARD-UNO-R3-COMP"} (3x) +1 more`,
          deliveryAddress:
            "Designated Campus Electronics Lab / Store Station (Building 3, Room 204)",
        },
      ],
    },
    {
      id: "cust-miguel-delacruz",
      name: "Miguel Dela Cruz",
      initials: "MD",
      avatarColor: "#CBA6F7",
      email: "miguel.delacruz@bulsu-mechatronics.ph",
      phone: "09278810345",
      affiliation: "BulSU Mechatronics & Robotics Society",
      role: "Embedded Systems Lead",
      province: "Bulacan",
      cityMunicipality: "Malolos City",
      defaultAddress:
        "Capitol View Park Subd., Brgy. Guinhawa, Malolos City, Bulacan, Region III",
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
          totalAmount: (l298n?.price ?? 120) * 6 + (hcsr04?.price ?? 75) * 6,
          itemCount: 12,
          primarySkuSummary: `${l298n?.sku ?? "L298N-DUAL-HBRIDGE"} (6x) +1 more`,
          deliveryAddress:
            "Capitol View Park Subd., Brgy. Guinhawa, Malolos City, Bulacan, Region III",
        },
        {
          id: "o-md-2",
          orderNumber: "#OHM-2026-049",
          createdAt: "2026-08-04T16:05:00Z",
          fulfillmentType: "DELIVERY",
          paymentMethod: "COD",
          status: "DELIVERED",
          totalAmount: (uno?.price ?? 450) * 2 + 80,
          itemCount: 2,
          primarySkuSummary: `${uno?.sku ?? "ARD-UNO-R3-COMP"} (2x)`,
          deliveryAddress:
            "Capitol View Park Subd., Brgy. Guinhawa, Malolos City, Bulacan, Region III",
        },
      ],
    },
    {
      id: "cust-jennifer-pangilinan",
      name: "Jennifer Pangilinan",
      initials: "JP",
      avatarColor: "#F9E2AF",
      email: "jpangilinan@clsu-agritech.org",
      phone: "09175529088",
      affiliation: "Nueva Ecija Smart Agri-Telemetry Lab",
      role: "IoT Instrumentation Researcher",
      province: "Nueva Ecija",
      cityMunicipality: "Cabanatuan City",
      defaultAddress:
        "789 Maharlika Hwy, Brgy. Sumacab Este, Cabanatuan City, Nueva Ecija, Region III",
      campusLabVerified: false,
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
          totalAmount: (dht22?.price ?? 210) * 5 + (esp32?.price ?? 285) * 2,
          itemCount: 7,
          primarySkuSummary: `${dht22?.sku ?? "DHT22-SENSOR-MOD"} (5x) +1 more`,
          deliveryAddress:
            "789 Maharlika Hwy, Brgy. Sumacab Este, Cabanatuan City, Nueva Ecija, Region III",
        },
      ],
    },
    {
      id: "cust-kenneth-galang",
      name: "Kenneth Galang",
      initials: "KG",
      avatarColor: "#A6E3A1",
      email: "k.galang@bpsu-robotics.edu.ph",
      phone: "09984127760",
      affiliation: "BPSU Embedded Prototyping Guild",
      role: "Student Hardware Lead",
      province: "Bataan",
      cityMunicipality: "Balanga City",
      defaultAddress:
        "Don Manuel Banzon Ave, Brgy. Poblacion, Balanga City, Bataan, Region III",
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
          totalAmount: (esp32?.price ?? 285) * 3 + (resKit?.price ?? 165) + 80,
          itemCount: 4,
          primarySkuSummary: `${esp32?.sku ?? "ESP32-WROOM-32U"} (3x) +1 more`,
          deliveryAddress:
            "Don Manuel Banzon Ave, Brgy. Poblacion, Balanga City, Bataan, Region III",
        },
      ],
    },
    {
      id: "cust-trisha-mendoza",
      name: "Trisha Mendoza",
      initials: "TM",
      avatarColor: "#74C7EC",
      email: "trisha.mendoza@tsu-automation.ph",
      phone: "09156093321",
      affiliation: "Tarlac Industrial PCB Fab Studio",
      role: "Hardware Test Engineer",
      province: "Tarlac",
      cityMunicipality: "Tarlac City",
      defaultAddress:
        "Romulo Blvd, Brgy. San Vicente, Tarlac City, Tarlac, Region III",
      campusLabVerified: false,
      activeCentralLuzon: true,
      joinedAt: "2026-08-01T13:20:00Z",
      orders: [
        {
          id: "o-tm-1",
          orderNumber: "#OHM-2026-077",
          createdAt: "2026-08-22T17:30:00Z",
          fulfillmentType: "DELIVERY",
          paymentMethod: "COD",
          status: "PROCESSING",
          totalAmount: (oled?.price ?? 150) * 4 + (hcsr04?.price ?? 75) * 4 + 80,
          itemCount: 8,
          primarySkuSummary: `${oled?.sku ?? "OLED-096-I2C-BLU"} (4x) +1 more`,
          deliveryAddress:
            "Romulo Blvd, Brgy. San Vicente, Tarlac City, Tarlac, Region III",
        },
      ],
    },
  ];
}

const INITIAL_CUSTOMERS = buildCustomersDataset();

type CustomerSegmentFilter = "ALL" | "CAMPUS_VERIFIED" | "REGION_III";

interface CustomerDetailDrawerProps {
  customer: AdminCustomerRecord | null;
  onClose: () => void;
}

function CustomerDetailDrawer({
  customer,
  onClose,
}: CustomerDetailDrawerProps) {
  useEffect(() => {
    if (!customer) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customer, onClose]);

  if (!customer) return null;

  const validSpend = customer.orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-drawer-title"
        className="flex h-full w-full max-w-2xl flex-col border-l border-[#45475A] bg-[#1E1E2E] shadow-2xl"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#313244] bg-[#181825] px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold text-[#11111B]"
              style={{ backgroundColor: customer.avatarColor }}
            >
              {customer.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="customer-drawer-title"
                  className="text-base font-bold text-[#CDD6F4]"
                >
                  {customer.name}
                </h2>
                {customer.campusLabVerified && (
                  <span className="rounded-full border border-[#94E2D5]/30 bg-[#94E2D5]/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#94E2D5]">
                    CAMPUS LAB VERIFIED
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A6ADC8]">
                {customer.affiliation} • {customer.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer drawer"
            className="rounded-lg border border-transparent p-1.5 text-[#A6ADC8] transition-colors hover:border-[#313244] hover:bg-[#1E1E2E] hover:text-[#CDD6F4]"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Contact & Default Delivery Address Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#313244] bg-[#181825] p-4">
              <p className="text-[11px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Customer Contact Details
              </p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#A6ADC8]">Email:</span>
                  <span className="font-mono text-[#CDD6F4]">
                    {customer.email}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#A6ADC8]">Mobile (SMS/COD):</span>
                  <span className="font-mono text-[#89B4FA]">
                    {customer.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#A6ADC8]">Member Since:</span>
                  <span className="text-[#BAC2DE]">
                    {formatDate(customer.joinedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#313244] bg-[#181825] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                  Default Delivery / Hub Address
                </p>
                <span className="rounded border border-[#89B4FA]/30 bg-[#89B4FA]/12 px-1.5 py-0.5 font-mono text-[10px] text-[#89B4FA]">
                  {customer.province}
                </span>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-[#CDD6F4]">
                {customer.defaultAddress}
              </p>
              <p className="mt-2 font-mono text-[11px] text-[#94E2D5]">
                Region III Central Luzon Coverage Verified
              </p>
            </div>
          </div>

          {/* Spend & Order Summary Strip */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#313244] bg-[#11111B] p-4 text-center">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Total Orders Placed
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-[#CDD6F4]">
                {customer.orders.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Lifetime Spend
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-[#A6E3A1]">
                {formatPrice(validSpend)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Avg. Order Value
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-[#89B4FA]">
                {formatPrice(
                  customer.orders.length > 0
                    ? validSpend /
                        Math.max(
                          1,
                          customer.orders.filter(
                            (o) => o.status !== "CANCELLED",
                          ).length,
                        )
                    : 0,
                )}
              </p>
            </div>
          </div>

          {/* Order History List */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#CDD6F4]">
                Customer Order History ({customer.orders.length})
              </h3>
              <Link
                href="/admin/orders"
                prefetch={false}
                className="text-xs font-semibold text-[#89B4FA] hover:underline"
              >
                Open Full Orders Manager →
              </Link>
            </div>

            <div className="space-y-3">
              {customer.orders.map((order) => {
                const badgeStyle = ORDER_STATUS_STYLES[order.status];
                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[#313244] bg-[#181825] p-4 transition-colors hover:border-[#45475A]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-bold text-[#89B4FA]">
                          {order.orderNumber}
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold"
                          style={{
                            color: badgeStyle.color,
                            backgroundColor: badgeStyle.bg,
                            border: `1px solid ${badgeStyle.border}`,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: badgeStyle.color }}
                          />
                          {badgeStyle.label}
                        </span>
                      </div>

                      <span className="font-mono text-sm font-bold text-[#CDD6F4]">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#BAC2DE]">
                      <span>{order.primarySkuSummary}</span>
                      <span className="text-[#A6ADC8]">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#313244]/70 pt-2.5 text-[11px] text-[#A6ADC8]">
                      <span>
                        {order.fulfillmentType === "PICKUP"
                          ? "Store / Lab Pickup (₱0.00)"
                          : "Region III Delivery"}
                      </span>
                      <span className="font-mono text-[#BAC2DE]">
                        {order.paymentMethod === "COD"
                          ? "Cash on Delivery (COD)"
                          : "Pay on Pickup"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-between border-t border-[#313244] bg-[#181825] px-6 py-4">
          <Link
            href="/admin/chat"
            prefetch={false}
            className="text-xs font-semibold text-[#94E2D5] hover:underline"
          >
            Message Buyer in Support Chat →
          </Link>
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={onClose}
          >
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CustomersClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] =
    useState<CustomerSegmentFilter>("ALL");
  const [selectedCustomer, setSelectedCustomer] =
    useState<AdminCustomerRecord | null>(null);

  const overviewStats = useMemo(() => {
    const totalBuyers = INITIAL_CUSTOMERS.length;
    const activeCentralLuzon = INITIAL_CUSTOMERS.filter(
      (c) => c.activeCentralLuzon,
    ).length;
    const campusLabVerified = INITIAL_CUSTOMERS.filter(
      (c) => c.campusLabVerified,
    ).length;

    return {
      totalBuyers,
      activeCentralLuzon,
      campusLabVerified,
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return INITIAL_CUSTOMERS.filter((customer) => {
      if (
        segmentFilter === "CAMPUS_VERIFIED" &&
        !customer.campusLabVerified
      ) {
        return false;
      }
      if (segmentFilter === "REGION_III" && !customer.activeCentralLuzon) {
        return false;
      }
      if (!q) return true;
      return (
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.province.toLowerCase().includes(q) ||
        customer.cityMunicipality.toLowerCase().includes(q) ||
        customer.affiliation.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, segmentFilter]);

  return (
    <div
      data-testid="admin-customers-page"
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-6"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-[#313244] pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#89B4FA]/30 bg-[#89B4FA]/12 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#89B4FA] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#89B4FA]" />
              CENTRAL LUZON BUYER DIRECTORY
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[#CDD6F4] sm:text-2xl">
            Customers &amp; Lab Accounts
          </h1>
          <p className="mt-0.5 text-xs text-[#BAC2DE] sm:text-sm">
            Inspect registered hardware buyers, Region III delivery addresses,
            campus lab verifications, and lifetime order history.
          </p>
        </div>
      </div>

      {/* Customer Overview Cards (3 Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Total Registered Buyers
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#CDD6F4]">
                {overviewStats.totalBuyers}
              </p>
            </div>
            <Badge variant="primary" className="font-mono">
              ACCOUNTS
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8]">
            Verified individual engineers, students &amp; university labs
          </p>
        </Surface>

        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Active Central Luzon Accounts
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#89B4FA]">
                {overviewStats.activeCentralLuzon}
              </p>
            </div>
            <Badge variant="secondary" className="font-mono">
              REGION III
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8]">
            Pampanga, Bulacan, Nueva Ecija, Bataan &amp; Tarlac coverage
          </p>
        </Surface>

        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Campus Lab Verified
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#94E2D5]">
                {overviewStats.campusLabVerified}
              </p>
            </div>
            <Badge variant="success" className="font-mono">
              LAB VERIFIED
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8]">
            Eligible for Building 3, Room 204 Store / Lab Station pickup
          </p>
        </Surface>
      </div>

      {/* Search & Segment Filter Bar */}
      <Surface
        variant="panel"
        className="border border-[#313244] bg-[#1E1E2E] p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "ALL", label: "All Registered Buyers" },
                { id: "CAMPUS_VERIFIED", label: "Campus Lab Verified" },
                { id: "REGION_III", label: "Central Luzon (Region III)" },
              ] as const
            ).map((tab) => {
              const isActive = segmentFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSegmentFilter(tab.id)}
                  style={
                    isActive
                      ? {
                          color: "#89B4FA",
                          backgroundColor: "rgba(137, 180, 250, 0.14)",
                          borderColor: "rgba(137, 180, 250, 0.45)",
                        }
                      : undefined
                  }
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "shadow-xs"
                      : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:max-w-sm">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#A6ADC8]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Email, or City/Province..."
              aria-label="Search customers by Name, Email, or City/Province"
              className="h-9 w-full rounded-lg border border-[#313244] bg-[#181825] pr-8 pl-10 text-xs text-[#CDD6F4] placeholder-[#A6ADC8] transition-colors focus:border-[#89B4FA] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-[#A6ADC8] hover:text-[#CDD6F4]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </Surface>

      {/* Customers Master Table */}
      <Surface
        variant="panel"
        className="overflow-hidden border border-[#313244] bg-[#1E1E2E] p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#313244] bg-[#181825] text-[11px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                <th className="px-4 py-3.5">Customer Name &amp; Avatar</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5">
                  Region III Province / Campus Address
                </th>
                <th className="px-4 py-3.5 text-center">Total Orders Placed</th>
                <th className="px-4 py-3.5 text-right">Total Lifetime Spend</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#313244]/60 text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-[#CDD6F4]">
                      No matching customers found
                    </p>
                    <p className="mt-1 text-xs text-[#A6ADC8]">
                      Try clearing your search filter or selecting All
                      Registered Buyers.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const lifetimeSpend = customer.orders
                    .filter((o) => o.status !== "CANCELLED")
                    .reduce((sum, o) => sum + o.totalAmount, 0);

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="cursor-pointer transition-colors hover:bg-[#181825]/80"
                    >
                      {/* Customer Name & Avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold text-[#11111B]"
                            style={{ backgroundColor: customer.avatarColor }}
                          >
                            {customer.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#CDD6F4]">
                                {customer.name}
                              </span>
                              {customer.campusLabVerified && (
                                <span className="rounded border border-[#94E2D5]/30 bg-[#94E2D5]/10 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-[#94E2D5]">
                                  LAB
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#A6ADC8]">
                              {customer.affiliation}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-[#BAC2DE]">
                          {customer.email}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-[#89B4FA]">
                          {customer.phone}
                        </span>
                      </td>

                      {/* Region III Province / Campus Address */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded border border-[#313244] bg-[#181825] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#89B4FA]">
                              {customer.province}
                            </span>
                            <span className="text-xs font-medium text-[#CDD6F4]">
                              {customer.cityMunicipality}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-[#A6ADC8]">
                            {customer.defaultAddress}
                          </p>
                        </div>
                      </td>

                      {/* Total Orders Placed */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-[#313244] bg-[#181825] px-2 font-mono text-xs font-bold text-[#CDD6F4]">
                          {customer.orders.length}
                        </span>
                      </td>

                      {/* Total Lifetime Spend */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-[#A6E3A1]">
                          {formatPrice(lifetimeSpend)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-4 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          View History
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}
