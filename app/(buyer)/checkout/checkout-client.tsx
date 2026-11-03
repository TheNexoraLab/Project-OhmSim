"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { getProductByIdSync } from "@/services/catalog-service";
import { computeDeliveryFee } from "@/lib/fulfillment";
import { getSavedAddresses, createMockOrder } from "@/services/order-service";
import { formatPrice } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import {
  REGION_3_PROVINCES,
  type FulfillmentType,
  type PaymentMethod,
  type OrderItem,
  type Region3Province,
} from "@/types/order";

export function CheckoutClient() {
  const router = useRouter();
  const { cart, cartBundles, clearCart } = useCart();

  // Load saved addresses snapshot
  const savedAddresses = useMemo(() => getSavedAddresses(), []);

  // Form State
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("DELIVERY");
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    const defaultAddr = savedAddresses.find((a) => a.isDefault);
    return defaultAddr ? defaultAddr.id : savedAddresses[0]?.id || "new";
  });
  const [addressMode, setAddressMode] = useState<"saved" | "new">(
    savedAddresses.length > 0 ? "saved" : "new"
  );

  // New address form fields
  const [newRecipient, setNewRecipient] = useState("Alex Rivera");
  const [newContact, setNewContact] = useState("09171234567");
  const [newProvince, setNewProvince] = useState<Region3Province>("Pampanga");
  const [newCity, setNewCity] = useState("San Fernando");
  const [newBarangay, setNewBarangay] = useState("Dolores");
  const [newStreet, setNewStreet] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");

  // Pickup contact details
  const [pickupRecipient, setPickupRecipient] = useState("Alex Rivera");
  const [pickupContact, setPickupContact] = useState("09171234567");

  // General notes & submitting state
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive itemized order items from cart (standalone + bundles)
  const standaloneItems: OrderItem[] = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const product = getProductByIdSync(id);
        return {
          productId: product?.id ?? id,
          productName: product?.name ?? "Electronic Component",
          productSku: product?.sku ?? `SKU-${id}`,
          productImage: product?.image ?? "/images/products/placeholder.png",
          price: product?.price ?? 0,
          qty,
        };
      });
  }, [cart]);

  const bundleItems: OrderItem[] = useMemo(() => {
    return cartBundles.flatMap((bundle) =>
      bundle.items.map((item) => {
        const product = getProductByIdSync(item.productId);
        return {
          productId: product?.id ?? item.productId,
          productName: product?.name ?? "Component",
          productSku: product?.sku ?? `SKU-${item.productId}`,
          productImage: product?.image ?? "/images/products/placeholder.png",
          price: product?.price ?? 0,
          qty: item.qty,
          bundleName: bundle.bomName,
        };
      })
    );
  }, [cartBundles]);

  const allItems: OrderItem[] = useMemo(
    () => [...standaloneItems, ...bundleItems],
    [standaloneItems, bundleItems]
  );

  const subtotal = useMemo(
    () => allItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [allItems]
  );

  const shippingFee = useMemo(
    () => computeDeliveryFee(subtotal, fulfillmentType),
    [subtotal, fulfillmentType]
  );

  const grandTotal = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

  const paymentMethod: PaymentMethod =
    fulfillmentType === "PICKUP" ? "PAY_ON_PICKUP" : "COD";

  // Selected saved address object
  const activeSavedAddress = useMemo(
    () => savedAddresses.find((a) => a.id === selectedAddressId),
    [savedAddresses, selectedAddressId]
  );

  // Empty cart guard
  if (allItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center bg-mocha-bg">
        <div className="w-16 h-16 rounded-2xl bg-mocha-panel border border-mocha-border flex items-center justify-center mb-4 text-mocha-text-muted">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-mocha-text mb-2">Your cart is currently empty</h1>
        <p className="text-xs text-mocha-text-muted max-w-sm mb-6">
          Add components or BOM project bundles to your shopping cart before proceeding to checkout.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-mocha-accent text-mocha-bg hover:opacity-95 shadow-sm transition-opacity min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent"
          >
            ← Return to Catalog
          </Link>
          <Link
            href="/bom"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-mocha-panel border border-mocha-border text-mocha-text hover:bg-mocha-panel-raised transition-colors min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent"
          >
            View BOM Projects
          </Link>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let finalRecipient = "";
    let finalContact = "";
    let finalDeliveryAddress: string | undefined;

    if (fulfillmentType === "PICKUP") {
      if (!pickupRecipient.trim()) {
        toast("Please provide the recipient name for lab pickup", "warning");
        return;
      }
      if (!pickupContact.trim() || !/^09\d{9}$/.test(pickupContact.trim())) {
        toast("Please provide a valid 11-digit mobile number (09XXXXXXXXX)", "warning");
        return;
      }
      finalRecipient = pickupRecipient.trim();
      finalContact = pickupContact.trim();
      finalDeliveryAddress = "Campus Electronics Lab Station (Building 3, Room 204)";
    } else {
      // DELIVERY mode
      if (addressMode === "saved") {
        if (!activeSavedAddress) {
          toast("Please select a saved delivery address", "warning");
          return;
        }
        finalRecipient = activeSavedAddress.recipientName;
        finalContact = activeSavedAddress.contactNumber;
        finalDeliveryAddress = `${activeSavedAddress.streetAddress}, ${activeSavedAddress.barangay}, ${activeSavedAddress.cityMunicipality}, ${activeSavedAddress.province}, Region III`;
      } else {
        if (!newRecipient.trim()) {
          toast("Please enter the delivery recipient full name", "warning");
          return;
        }
        if (!newContact.trim() || !/^09\d{9}$/.test(newContact.trim())) {
          toast("Please enter a valid 11-digit mobile number (09XXXXXXXXX)", "warning");
          return;
        }
        if (!newStreet.trim() || !newBarangay.trim() || !newCity.trim()) {
          toast("Please complete all required address fields", "warning");
          return;
        }
        finalRecipient = newRecipient.trim();
        finalContact = newContact.trim();
        const postal = newPostalCode.trim() ? ` ${newPostalCode.trim()}` : "";
        finalDeliveryAddress = `${newStreet.trim()}, ${newBarangay.trim()}, ${newCity.trim()}, ${newProvince}${postal}, Region III`;
      }
    }

    setIsSubmitting(true);

    try {
      const order = createMockOrder({
        fulfillmentType,
        paymentMethod,
        recipientName: finalRecipient,
        contactNumber: finalContact,
        deliveryAddress: finalDeliveryAddress,
        notes: orderNotes.trim() || undefined,
        subtotalAmount: subtotal,
        deliveryFee: shippingFee,
        totalAmount: grandTotal,
        items: allItems,
        trackingNo: null,
      });

      clearCart();
      toast(`Order #${order.orderNumber} placed successfully!`, "success");
      router.push(`/orders/${order.id}`);
    } catch {
      setIsSubmitting(false);
      toast("An error occurred while placing your order. Please try again.", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-mocha-bg">
      <div className="max-w-[1200px] w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-mocha-text-muted">
          <Link href="/cart" className="hover:text-mocha-accent transition-colors flex items-center gap-1">
            <span>←</span> Back to Cart
          </Link>
          <span>/</span>
          <span className="text-mocha-text font-semibold">Checkout</span>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-mocha-text tracking-tight flex items-center gap-2">
            Checkout &amp; Fulfillment
          </h1>
          <p className="text-xs text-mocha-text-muted mt-1">
            Configure delivery or pickup details and complete your hardware order
          </p>
        </div>

        {/* Form Layout: 2 Columns on desktop */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Fulfillment, Address & Payment) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 1. Fulfillment Selection */}
            <div className="p-5 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-mocha-text uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-mocha-accent text-mocha-bg flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  Fulfillment Method
                </h2>
                <span className="text-[11px] font-medium text-mocha-text-subtle">
                  Dual fulfillment (BR-045 / BR-046)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Delivery */}
                <button
                  type="button"
                  onClick={() => setFulfillmentType("DELIVERY")}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 min-h-[96px] ${
                    fulfillmentType === "DELIVERY"
                      ? "border-mocha-accent bg-mocha-accent/10 shadow-sm"
                      : "border-mocha-border bg-mocha-bg hover:border-mocha-border-strong"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-mocha-text flex items-center gap-2">
                      <svg className="w-4 h-4 text-mocha-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                      Central Luzon Delivery
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        subtotal >= 1000
                          ? "bg-mocha-success/20 text-mocha-success"
                          : "bg-mocha-panel-raised text-mocha-text-muted"
                      }`}
                    >
                      {subtotal >= 1000 ? "FREE" : "₱80.00"}
                    </span>
                  </div>
                  <p className="text-[11px] text-mocha-text-muted">
                    Door-to-door courier strictly within Region III Central Luzon.
                  </p>
                </button>

                {/* Option B: Store / Lab Pickup */}
                <button
                  type="button"
                  onClick={() => setFulfillmentType("PICKUP")}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 min-h-[96px] ${
                    fulfillmentType === "PICKUP"
                      ? "border-mocha-accent bg-mocha-accent/10 shadow-sm"
                      : "border-mocha-border bg-mocha-bg hover:border-mocha-border-strong"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-mocha-text flex items-center gap-2">
                      <svg className="w-4 h-4 text-mocha-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Store / Lab Pickup
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mocha-success/20 text-mocha-success">
                      FREE (₱0)
                    </span>
                  </div>
                  <p className="text-[11px] text-mocha-text-muted">
                    Collect at Campus Electronics Lab Station (Building 3).
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Delivery Address or Lab Pickup Details */}
            {fulfillmentType === "DELIVERY" ? (
              <div className="p-5 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-mocha-text uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-mocha-accent text-mocha-bg flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    Region III Delivery Address
                  </h2>
                  <span className="text-[11px] text-mocha-text-subtle">
                    Central Luzon Only (BR-045)
                  </span>
                </div>

                {/* Address Mode Selector Tabs */}
                {savedAddresses.length > 0 && (
                  <div className="flex gap-2 border-b border-mocha-border pb-3">
                    <button
                      type="button"
                      onClick={() => setAddressMode("saved")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        addressMode === "saved"
                          ? "bg-mocha-panel-raised text-mocha-accent border border-mocha-accent/40"
                          : "text-mocha-text-muted hover:text-mocha-text"
                      }`}
                    >
                      Saved Addresses ({savedAddresses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressMode("new")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        addressMode === "new"
                          ? "bg-mocha-panel-raised text-mocha-accent border border-mocha-accent/40"
                          : "text-mocha-text-muted hover:text-mocha-text"
                      }`}
                    >
                      + New Region III Address
                    </button>
                  </div>
                )}

                {addressMode === "saved" && savedAddresses.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-mocha-accent bg-mocha-accent/10"
                              : "border-mocha-border bg-mocha-bg hover:border-mocha-border-strong"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-mocha-text">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-mocha-accent/20 text-mocha-accent">
                                  Default
                                </span>
                              )}
                            </div>
                            <input
                              type="radio"
                              name="selectedAddress"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="accent-[#89B4FA]"
                            />
                          </div>
                          <p className="text-xs text-mocha-text font-medium">
                            {addr.recipientName} • <span className="font-mono text-mocha-text-muted">{addr.contactNumber}</span>
                          </p>
                          <p className="text-xs text-mocha-text-muted mt-0.5">
                            {addr.streetAddress}, {addr.barangay}, {addr.cityMunicipality}, {addr.province}, {addr.region}
                            {addr.postalCode ? ` ${addr.postalCode}` : ""}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-mocha-text mb-1">
                          Recipient Full Name <span className="text-mocha-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          placeholder="e.g. Alex Rivera"
                          required
                          className="w-full px-3 py-2 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-mocha-text mb-1">
                          Mobile Number <span className="text-mocha-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          value={newContact}
                          onChange={(e) => setNewContact(e.target.value)}
                          placeholder="09XXXXXXXXX"
                          required
                          maxLength={11}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-mocha-text mb-1">
                          Region
                        </label>
                        <input
                          type="text"
                          value="Region III (Central Luzon)"
                          disabled
                          className="w-full px-3 py-2 text-xs rounded-xl bg-mocha-bg/50 border border-mocha-border text-mocha-text-muted cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-mocha-text mb-1">
                          Province <span className="text-mocha-danger">*</span>
                        </label>
                        <select
                          value={newProvince}
                          onChange={(e) => setNewProvince(e.target.value as Region3Province)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text focus:outline-none focus:border-mocha-accent"
                        >
                          {REGION_3_PROVINCES.map((prov) => (
                            <option key={prov} value={prov}>
                              {prov}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-mocha-text mb-1">
                          City / Municipality <span className="text-mocha-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          placeholder="e.g. San Fernando"
                          required
                          className="w-full px-3 py-2 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-mocha-text mb-1">
                          Barangay <span className="text-mocha-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={newBarangay}
                          onChange={(e) => setNewBarangay(e.target.value)}
                          placeholder="e.g. Dolores"
                          required
                          className="w-full px-3 py-2 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-mocha-text mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={newPostalCode}
                          onChange={(e) => setNewPostalCode(e.target.value)}
                          placeholder="e.g. 2000"
                          maxLength={6}
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-mocha-text mb-1">
                        Street Address / Landmark <span className="text-mocha-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        placeholder="House/Unit No., Street name, Building, Landmark"
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Lab Pickup Information */
              <div className="p-5 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-mocha-text uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-mocha-accent text-mocha-bg flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    Campus Lab Pickup Station
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mocha-accent-secondary/20 text-mocha-accent-secondary">
                    Always Free (₱0.00)
                  </span>
                </div>

                {/* Station Banner */}
                <div className="p-3.5 rounded-xl bg-mocha-bg border border-mocha-border flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-mocha-panel-raised flex items-center justify-center text-mocha-accent-secondary shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-mocha-text">Campus Electronics Lab Station</p>
                    <p className="text-xs text-mocha-text-muted mt-0.5">
                      Building 3, Room 204 • Electrical Engineering Wing
                    </p>
                    <p className="text-[11px] text-mocha-text-subtle mt-1">
                      Operating Hours: Monday – Saturday, 8:00 AM – 6:00 PM
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-mocha-text mb-1">
                      Pickup Recipient Name <span className="text-mocha-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={pickupRecipient}
                      onChange={(e) => setPickupRecipient(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-mocha-text mb-1">
                      Contact Mobile Number <span className="text-mocha-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      value={pickupContact}
                      onChange={(e) => setPickupContact(e.target.value)}
                      placeholder="09XXXXXXXXX"
                      required
                      maxLength={11}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-mocha-text-subtle">
                  Bring your Student/Faculty ID or valid government ID when collecting your order.
                </p>
              </div>
            )}

            {/* 3. Payment Method */}
            <div className="p-5 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-mocha-text uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-mocha-accent text-mocha-bg flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  Payment Method
                </h2>
                <span className="text-[11px] font-medium text-mocha-text-subtle">
                  v1.0 In-Person Policy (BR-047)
                </span>
              </div>

              {fulfillmentType === "DELIVERY" ? (
                <div className="p-4 rounded-xl border border-mocha-accent bg-mocha-accent/10 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-mocha-panel flex items-center justify-center text-mocha-accent shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-mocha-text flex items-center gap-2">
                        Cash on Delivery (COD)
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-mocha-accent/20 text-mocha-accent">
                          Courier
                        </span>
                      </p>
                      <p className="text-[11px] text-mocha-text-muted mt-0.5">
                        Hand exact cash to the delivery rider upon arrival of your parcel.
                      </p>
                    </div>
                  </div>
                  <input type="radio" checked readOnly className="accent-[#89B4FA] mt-1" />
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-mocha-accent bg-mocha-accent/10 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-mocha-panel flex items-center justify-center text-mocha-accent-secondary shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-mocha-text flex items-center gap-2">
                        Pay on Pickup
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-mocha-accent-secondary/20 text-mocha-accent-secondary">
                          Lab Counter
                        </span>
                      </p>
                      <p className="text-[11px] text-mocha-text-muted mt-0.5">
                        Pay via cash or campus debit at the Campus Lab station when collecting components.
                      </p>
                    </div>
                  </div>
                  <input type="radio" checked readOnly className="accent-[#89B4FA] mt-1" />
                </div>
              )}

              <p className="text-[10px] text-mocha-text-subtle bg-mocha-bg p-2.5 rounded-lg border border-mocha-border">
                Rule BR-047 / BR-050: In OhmSim Version 1.0 (MVP), digital payment gateways (credit card, GCash) are excluded. All orders are settled in cash upon fulfillment.
              </p>
            </div>

            {/* Optional Order Notes */}
            <div className="p-5 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-2">
              <label className="text-xs font-bold text-mocha-text uppercase tracking-wider">
                Order Notes / Delivery Instructions (Optional)
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. Leave with guard if not around, or estimated pickup time slot..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent"
              />
            </div>
          </div>

          {/* Right Column (Itemized Summary & Place Order CTA) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-6">
            <div className="p-5 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-mocha-border">
                <h2 className="text-sm font-bold text-mocha-text uppercase tracking-wider">
                  Order Summary
                </h2>
                <span className="text-xs font-semibold text-mocha-text-muted">
                  {allItems.length} {allItems.length === 1 ? "component" : "components"}
                </span>
              </div>

              {/* Itemized Component List */}
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                {allItems.map((item, idx) => (
                  <div
                    key={`${item.productId}-${idx}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-mocha-bg border border-mocha-border"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-mocha-border shrink-0 bg-mocha-panel">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-mocha-text truncate">
                        {item.productName}
                      </p>
                      {item.bundleName && (
                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-mocha-accent-secondary/15 text-mocha-accent-secondary mt-0.5 truncate max-w-[180px]">
                          BOM: {item.bundleName}
                        </span>
                      )}
                      <p className="text-[11px] text-mocha-text-muted font-mono mt-0.5">
                        {item.qty} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono text-mocha-accent">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="flex flex-col gap-2 pt-3 border-t border-mocha-border text-xs">
                <div className="flex items-center justify-between text-mocha-text-muted">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-mocha-text">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-mocha-text-muted">
                  <span className="flex items-center gap-1.5">
                    Shipping &amp; Handling
                    {fulfillmentType === "DELIVERY" && subtotal >= 1000 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-mocha-success/20 text-mocha-success">
                        FREE Tier
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-semibold text-mocha-text">
                    {shippingFee === 0 ? (
                      <span className="text-mocha-success font-bold">FREE (₱0.00)</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>

                {fulfillmentType === "DELIVERY" && subtotal < 1000 && (
                  <p className="text-[10px] text-mocha-accent bg-mocha-accent/10 p-2 rounded-lg border border-mocha-accent/20">
                    💡 Add <span className="font-bold font-mono">{formatPrice(1000 - subtotal)}</span> more to qualify for <span className="font-bold text-mocha-success">FREE Central Luzon delivery</span>!
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-mocha-border text-sm font-bold text-mocha-text">
                  <span>Grand Total</span>
                  <span className="font-mono text-base text-mocha-accent">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] rounded-xl text-xs font-bold bg-mocha-accent text-mocha-bg hover:opacity-95 shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-mocha-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-mocha-bg border-t-transparent rounded-full animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Place Order • {formatPrice(grandTotal)}</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-center text-mocha-text-subtle flex flex-col gap-1">
                <span>By placing this order, you agree to OhmSim Terms of Service.</span>
                <span>Protected under Region III Component Verification Guarantee.</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
