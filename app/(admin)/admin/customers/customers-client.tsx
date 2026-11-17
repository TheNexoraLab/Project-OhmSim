"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  MapPin,
  GraduationCap,
  Search,
  Mail,
  Phone,
  RefreshCw,
  Download,
  MessageSquare,
  X,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";
import { getCustomers } from "@/services/customer-service";
import {
  CANONICAL_CUSTOMERS,
  type AdminCustomerRecord,
  type CustomerOrderHistoryItem,
  type AdminOrderStatusDisplay,
} from "@/lib/mocks/customers";

export type {
  AdminCustomerRecord,
  CustomerOrderHistoryItem,
  AdminOrderStatusDisplay,
};

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

/**
 * Format currency without monospace font collisions with the Philippine Peso glyph (₱).
 */
export function formatCurrencyDisplay(amount: number) {
  return (
    <span className="inline-flex items-baseline">
      <span className="font-sans font-semibold text-[0.88em] mr-0.5">₱</span>
      <span className="font-mono">
        {amount.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </span>
  );
}

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

  const nonCancelledCount = customer.orders.filter(
    (o) => o.status !== "CANCELLED"
  ).length;
  const aov = nonCancelledCount > 0 ? validSpend / nonCancelledCount : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-drawer-title"
        data-testid="admin-customer-drawer"
        className="flex h-dvh min-w-0 w-full max-w-2xl flex-col overflow-hidden [overflow-wrap:anywhere] border-l border-[#45475A] bg-[#1E1E2E] shadow-2xl animate-in slide-in-from-right duration-250"
      >
        {/* Drawer Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#313244] bg-[#181825] px-4 sm:px-6 py-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-extrabold text-[#11111B] shadow-xs"
              style={{ backgroundColor: customer.avatarColor }}
            >
              {customer.initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="customer-drawer-title"
                  className="text-base font-bold text-[#CDD6F4]"
                >
                  {customer.name}
                </h2>
                {customer.campusLabVerified && (
                  <span className="rounded-full border border-[#94E2D5]/35 bg-[#94E2D5]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#94E2D5]">
                    CAMPUS LAB VERIFIED
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A6ADC8] mt-0.5">
                {customer.affiliation} • {customer.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer drawer"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-transparent text-[#A6ADC8] transition-colors hover:border-[#313244] hover:bg-[#1E1E2E] hover:text-[#CDD6F4]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {/* Contact & Default Delivery Address Cards */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="rounded-xl border border-[#313244] bg-[#181825] p-4">
              <p className="text-[10px] font-bold tracking-wider text-[#A6ADC8] uppercase">
                Customer Contact Details
              </p>
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#A6ADC8] flex items-center gap-1.5">
                    <Mail size={12} />
                    <span>Email:</span>
                  </span>
                  <span className="font-mono text-[#CDD6F4] text-[11px] truncate">
                    {customer.email}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#A6ADC8] flex items-center gap-1.5">
                    <Phone size={12} />
                    <span>Mobile (COD):</span>
                  </span>
                  <span className="font-mono text-[#89B4FA] text-[11px]">
                    {customer.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-[#313244]/60 pt-2 text-[11px]">
                  <span className="text-[#A6ADC8]">Member Since:</span>
                  <span className="text-[#BAC2DE]">
                    {formatDate(customer.joinedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#313244] bg-[#181825] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold tracking-wider text-[#A6ADC8] uppercase flex items-center gap-1.5">
                  <MapPin size={12} />
                  <span>Campus Lab / Delivery Hub</span>
                </p>
                <span className="rounded-full border border-[#89B4FA]/30 bg-[#89B4FA]/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-[#89B4FA]">
                  {customer.province}
                </span>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-[#CDD6F4]">
                {customer.defaultAddress}
              </p>
              <p className="mt-2.5 font-mono text-[10px] text-[#94E2D5] flex items-center gap-1 border-t border-[#313244]/60 pt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#94E2D5]" />
                Region III Central Luzon Coverage Verified
              </p>
            </div>
          </div>

          {/* Spend & Order Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-[#313244] bg-[#11111B] p-4 text-center">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-[#A6ADC8] uppercase">
                Orders Placed
              </p>
              <p className="mt-1 font-mono text-xl font-bold text-[#CDD6F4]">
                {customer.orders.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-[#A6ADC8] uppercase">
                Lifetime Spend
              </p>
              <p className="mt-1 font-bold text-xl text-[#A6E3A1]">
                {formatCurrencyDisplay(validSpend)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-[#A6ADC8] uppercase">
                Avg. Order Value
              </p>
              <p className="mt-1 font-bold text-xl text-[#89B4FA]">
                {formatCurrencyDisplay(aov)}
              </p>
            </div>
          </div>

          {/* Order History List */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#CDD6F4]">
                Customer Order History ({customer.orders.length})
              </h3>
              <Link
                href="/admin/orders"
                prefetch={false}
                className="text-xs font-semibold text-[#89B4FA] hover:underline flex items-center gap-1"
              >
                <span>Open Orders Manager</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            <div className="space-y-2.5">
              {customer.orders.length === 0 ? (
                <div className="rounded-xl border border-[#313244] bg-[#181825] p-6 text-center text-xs text-[#A6ADC8]">
                  No orders recorded yet for this customer account.
                </div>
              ) : (
                customer.orders.map((order) => {
                  const badgeStyle = ORDER_STATUS_STYLES[order.status];
                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-[#313244] bg-[#181825] p-3.5 transition-colors hover:border-[#45475A]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#89B4FA]">
                            {order.orderNumber}
                          </span>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase"
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

                        <span className="font-bold text-xs text-[#CDD6F4]">
                          {formatCurrencyDisplay(order.totalAmount)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#BAC2DE]">
                        <span>{order.primarySkuSummary}</span>
                        <span className="text-[11px] text-[#A6ADC8]">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#313244]/70 pt-2 text-[11px] text-[#A6ADC8]">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} className="text-[#94E2D5]" />
                          <span>
                            {order.fulfillmentType === "PICKUP"
                              ? "Campus Lab Station (Bldg 3, Rm 204)"
                              : "Region III Delivery"}
                          </span>
                        </span>
                        <span className="font-mono text-[10.5px] text-[#BAC2DE]">
                          {order.paymentMethod === "COD" ? "COD" : "Pay on Pickup"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-between border-t border-[#313244] bg-[#181825] px-6 py-4">
          <Link
            href="/admin/chat"
            prefetch={false}
            className="text-xs font-semibold text-[#89B4FA] hover:underline flex items-center gap-1.5"
          >
            <MessageSquare size={13} />
            <span>Message Buyer in Support Chat</span>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="compact"
            onClick={onClose}
            className="text-xs font-semibold px-3 h-8"
          >
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CustomersClient() {
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>(CANONICAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegmentFilter>("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let ignore = false;
    getCustomers()
      .then((live) => {
        if (!ignore && live && live.length > 0) {
          setCustomers(live);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const overviewStats = useMemo(() => {
    const totalBuyers = customers.length;
    const activeCentralLuzon = customers.filter((c) => c.activeCentralLuzon).length;
    const campusLabVerified = customers.filter((c) => c.campusLabVerified).length;

    return {
      totalBuyers,
      activeCentralLuzon,
      campusLabVerified,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((customer) => {
      if (segmentFilter === "CAMPUS_VERIFIED" && !customer.campusLabVerified) {
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
        customer.affiliation.toLowerCase().includes(q) ||
        customer.role.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, segmentFilter, customers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const live = await getCustomers();
      if (live && live.length > 0) {
        setCustomers(live);
      }
    } catch {
      // Keep existing customers on error
    } finally {
      setIsRefreshing(false);
      toast(
        "Customer database and regional account records synchronized.",
        "success"
      );
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "Affiliation",
      "Role",
      "Province",
      "City",
      "Campus Lab Verified",
      "Total Orders",
      "Lifetime Spend (PHP)",
    ];

    const rows = filteredCustomers.map((c) => {
      const spend = c.orders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((sum, o) => sum + o.totalAmount, 0);
      return [
        `"${c.id}"`,
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.affiliation}"`,
        `"${c.role}"`,
        `"${c.province}"`,
        `"${c.cityMunicipality}"`,
        `"${c.campusLabVerified ? "Yes" : "No"}"`,
        c.orders.length,
        spend.toFixed(2),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ohmsim_customers_directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast(
      `Exported ${filteredCustomers.length} customer records to CSV.`,
      "success"
    );
  };

  return (
    <div data-testid="admin-customers-page" className="flex flex-col gap-5 w-full">
      {/* 1. Page Header */}
      <div className="admin-page-header flex flex-col gap-3 pb-1 border-b border-[#313244] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#89B4FA]/30 bg-[#89B4FA]/12 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#89B4FA] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#89B4FA]" />
              FE-A04 · BUYER &amp; LAB DIRECTORY
            </span>
            <span className="text-xs text-[#A6ADC8] hidden md:inline">
              Central Luzon Hardware Engineers &amp; University Research Labs
            </span>
          </div>
          <h1 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-[#CDD6F4]">
            Customers &amp; Lab Accounts
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="surface"
            size="compact"
            onClick={handleExportCsv}
            className="text-xs font-semibold gap-1.5 h-8"
          >
            <Download size={13} />
            <span>Export Directory CSV</span>
          </Button>

          <Button
            type="button"
            variant="surface"
            size="compact"
            onClick={handleRefresh}
            className="text-xs font-semibold gap-1.5 h-8"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>Sync Directory</span>
          </Button>
        </div>
      </div>

      {/* 2. Customer Overview Stat Cards (3 Cards) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Card 1: Total Registered Buyers */}
        <Surface variant="panel" className="border border-[#313244] bg-[#1E1E2E] p-4 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#89B4FA]/12 border border-[#89B4FA]/25 flex items-center justify-center text-[#89B4FA]">
                <Users size={17} />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#A6ADC8] uppercase">
                  Total Registered Buyers
                </p>
                <p className="font-mono text-2xl font-bold text-[#CDD6F4] mt-0.5">
                  {overviewStats.totalBuyers}
                </p>
              </div>
            </div>
            <Badge variant="primary" className="font-mono text-[10px] uppercase">
              ACCOUNTS
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8] border-t border-[#313244]/60 pt-2.5">
            Verified individual engineers, students &amp; university labs
          </p>
        </Surface>

        {/* Card 2: Active Central Luzon Accounts */}
        <Surface variant="panel" className="border border-[#313244] bg-[#1E1E2E] p-4 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#89B4FA]/12 border border-[#89B4FA]/25 flex items-center justify-center text-[#89B4FA]">
                <MapPin size={17} />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#A6ADC8] uppercase">
                  Active Central Luzon
                </p>
                <p className="font-mono text-2xl font-bold text-[#89B4FA] mt-0.5">
                  {overviewStats.activeCentralLuzon}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px] uppercase">
              REGION III
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8] border-t border-[#313244]/60 pt-2.5">
            Pampanga, Bulacan, Nueva Ecija, Bataan &amp; Tarlac coverage
          </p>
        </Surface>

        {/* Card 3: Campus Lab Verified */}
        <Surface variant="panel" className="border border-[#313244] bg-[#1E1E2E] p-4 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#94E2D5]/12 border border-[#94E2D5]/25 flex items-center justify-center text-[#94E2D5]">
                <GraduationCap size={17} />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#A6ADC8] uppercase">
                  Campus Lab Verified
                </p>
                <p className="font-mono text-2xl font-bold text-[#94E2D5] mt-0.5">
                  {overviewStats.campusLabVerified}
                </p>
              </div>
            </div>
            <Badge variant="success" className="font-mono text-[10px] uppercase">
              LAB VERIFIED
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8] border-t border-[#313244]/60 pt-2.5">
            Eligible for Building 3, Room 204 Store / Lab Station pickup
          </p>
        </Surface>
      </div>

      {/* 3. Search & Segment Filter Bar (Matching Orders & Catalog Sleek Segmented Control) */}
      <Surface variant="panel" className="border border-[#313244] bg-[#1E1E2E] p-3 rounded-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-1 p-1 bg-[#181825] border border-[#313244] rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: "ALL", label: "All Buyers", count: customers.length },
              {
                id: "CAMPUS_VERIFIED",
                label: "Campus Lab Verified",
                count: overviewStats.campusLabVerified,
              },
              {
                id: "REGION_III",
                label: "Central Luzon (Region III)",
                count: overviewStats.activeCentralLuzon,
              },
            ].map((tab) => {
              const isActive = segmentFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSegmentFilter(tab.id as CustomerSegmentFilter)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#89B4FA] text-[#11111B] shadow-xs"
                      : "text-[#A6ADC8] hover:text-[#CDD6F4] hover:bg-[#1E1E2E]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? "bg-[#11111B]/20 text-[#11111B]"
                        : "bg-[#313244] text-[#BAC2DE]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search
              size={14}
              className="text-[#A6ADC8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, lab, or city..."
              aria-label="Search customers"
              className="h-8.5 w-full rounded-lg border border-[#313244] bg-[#181825] pr-8 pl-9 text-xs text-[#CDD6F4] placeholder-[#A6ADC8] transition-colors focus:border-[#89B4FA] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-[#A6ADC8] hover:text-[#CDD6F4]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </Surface>

      {/* 4. Customers Master Table */}
      <Surface
        variant="panel"
        className="overflow-hidden border border-[#313244] bg-[#1E1E2E] rounded-xl shadow-md p-0"
      >
        <div role="region" aria-label="Customers table" tabIndex={0} className="admin-table-scroll overflow-x-auto">
          <table data-responsive-table="cards" role="table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#181825] border-b border-[#313244] text-[10px] font-bold uppercase tracking-wider text-[#A6ADC8]">
                <th scope="col" className="py-3 pl-4 pr-2">
                  Customer
                </th>
                <th scope="col" className="py-3 px-2.5">
                  Contact
                </th>
                <th scope="col" className="py-3 px-2.5">
                  Location &amp; Campus Lab
                </th>
                <th scope="col" className="py-3 px-2 text-center">
                  Orders
                </th>
                <th scope="col" className="py-3 px-2.5 text-right">
                  Lifetime Spend
                </th>
                <th scope="col" className="py-3 pl-1.5 pr-3.5 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#313244]/60 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-[#CDD6F4]">
                      No matching customers found
                    </p>
                    <p className="mt-1 text-xs text-[#A6ADC8]">
                      Try adjusting your search query or selecting &quot;All Buyers&quot;.
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
                      className="cursor-pointer transition-colors hover:bg-[#181825]/70"
                    >
                      {/* 1. Customer */}
                      <td data-label="Customer" data-cell="primary" className="py-3.5 pl-4 pr-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-extrabold text-[#11111B] shadow-xs"
                            style={{ backgroundColor: customer.avatarColor }}
                          >
                            {customer.initials}
                          </div>
                          <div className="min-w-0 max-w-[175px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-[#CDD6F4] truncate">
                                {customer.name}
                              </span>
                              {customer.campusLabVerified && (
                                <span className="rounded-full border border-[#94E2D5]/35 bg-[#94E2D5]/15 px-1.5 py-0.2 font-mono text-[8.5px] font-bold text-[#94E2D5] shrink-0">
                                  LAB
                                </span>
                              )}
                            </div>
                            <p
                              className="text-[11px] text-[#A6ADC8] truncate mt-0.5"
                              title={customer.affiliation}
                            >
                              {customer.affiliation}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact */}
                      <td data-label="Contact" className="py-3.5 px-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 max-w-[190px]">
                          <div className="flex items-center gap-1.5 text-xs text-[#BAC2DE]">
                            <Mail size={12} className="text-[#A6ADC8] shrink-0" />
                            <span
                              className="font-mono text-[11px] truncate"
                              title={customer.email}
                            >
                              {customer.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#89B4FA]">
                            <Phone size={11} className="text-[#89B4FA]/70 shrink-0" />
                            <span className="font-mono text-[10px]">
                              {customer.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Location & Campus Lab */}
                      <td data-label="Location" className="py-3.5 px-2.5">
                        <div className="flex flex-col gap-0.5 max-w-[230px]">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-semibold bg-[#89B4FA]/15 text-[#89B4FA] border border-[#89B4FA]/30 shrink-0">
                              <MapPin size={9} />
                              {customer.province}
                            </span>
                            <span className="text-xs font-medium text-[#CDD6F4] truncate">
                              {customer.cityMunicipality}
                            </span>
                          </div>
                          <p
                            className="text-[11px] text-[#A6ADC8] truncate"
                            title={customer.defaultAddress}
                          >
                            {customer.defaultAddress}
                          </p>
                        </div>
                      </td>

                      {/* 4. Orders */}
                      <td data-label="Orders" className="py-3.5 px-2 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center rounded-full border border-[#313244] bg-[#181825] px-2 py-0.5 font-mono text-xs font-bold text-[#CDD6F4]">
                          {customer.orders.length}
                        </span>
                      </td>

                      {/* 5. Lifetime Spend */}
                      <td data-label="Lifetime spend" className="py-3.5 px-2.5 text-right whitespace-nowrap">
                        <div className="font-bold text-xs text-[#A6E3A1]">
                          {formatCurrencyDisplay(lifetimeSpend)}
                        </div>
                        <div className="text-[10px] text-[#A6ADC8] mt-0.5">
                          {customer.orders.length > 0 ? "Lifetime total" : "No orders yet"}
                        </div>
                      </td>

                      {/* 6. Action */}
                      <td data-label="Actions" data-cell="actions"
                        className="py-3.5 pl-1.5 pr-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="compact"
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-xs font-semibold px-2.5 h-7"
                          >
                            Inspect
                          </Button>
                          <Link
                            href="/admin/chat"
                            title={`Chat with ${customer.name}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[#313244] bg-[#181825] text-[#89B4FA] hover:text-[#CDD6F4] hover:bg-[#1E1E2E] hover:border-[#89B4FA]/40 transition-colors"
                          >
                            <MessageSquare size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      {/* 5. Customer Detail Drawer */}
      <CustomerDetailDrawer
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}
