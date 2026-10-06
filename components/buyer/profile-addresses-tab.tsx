"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  getAddressesSnapshot,
  subscribeAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  validatePhilippineMobile,
} from "@/services/profile-service";
import { REGION_3_PROVINCES, Region3Province } from "@/types/order";
import { toast } from "@/components/ui/toast";

export function ProfileAddressesTab() {
  const addresses = useSyncExternalStore(subscribeAddresses, getAddressesSnapshot, getAddressesSnapshot);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New address form state
  const [formData, setFormData] = useState({
    label: "",
    recipientName: "",
    contactNumber: "09171234567",
    province: "Pampanga" as Region3Province,
    cityMunicipality: "",
    barangay: "",
    streetAddress: "",
    postalCode: "",
    isDefault: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isLimitReached = addresses.length >= 2;

  const handleSetDefault = (id: string, label: string) => {
    const res = setDefaultAddress(id);
    if (res.success) {
      toast(`"${label}" set as default delivery address`, "success");
      setTimeout(() => {
        // Return focus to this address card's delete button or stable section heading
        const deleteBtn = document.querySelector(`[data-delete-address-btn="${id}"]`) as HTMLElement | null;
        const target = deleteBtn || document.getElementById("address-section-heading");
        target?.focus();
      }, 50);
    } else {
      toast(res.error || "Failed to set default address", "error");
    }
  };

  const handleDelete = (id: string, label: string) => {
    const res = deleteAddress(id);
    if (res.success) {
      toast(`Address "${label}" removed`, "info");
      setTimeout(() => {
        const addBtn = document.getElementById("add-address-trigger-btn") as HTMLButtonElement | null;
        const nextDeleteBtn = document.querySelector("[data-delete-address-btn]") as HTMLElement | null;
        const nextTarget =
          (addBtn && !addBtn.disabled ? addBtn : null) ||
          nextDeleteBtn ||
          document.getElementById("address-section-heading");
        nextTarget?.focus();
      }, 50);
    } else {
      toast(res.error || "Failed to remove address", "error");
    }
  };

  const handleOpenAddForm = () => {
    setShowAddForm(true);
    setError(null);
    setFieldErrors({});
    setTimeout(() => {
      document.getElementById("address-label")?.focus();
    }, 50);
  };

  const handleCancelAddForm = () => {
    setShowAddForm(false);
    setError(null);
    setFieldErrors({});
    setTimeout(() => {
      const addBtn = document.getElementById("add-address-trigger-btn") as HTMLButtonElement | null;
      const target = (addBtn && !addBtn.disabled ? addBtn : null) || document.getElementById("address-section-heading");
      target?.focus();
    }, 50);
  };

  const handleSubmitNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      const msg = "Address label is required (e.g. Home, Campus Lab).";
      setError(msg);
      setFieldErrors({ label: msg });
      setTimeout(() => document.getElementById("address-label")?.focus(), 50);
      return;
    }
    if (!formData.recipientName.trim()) {
      const msg = "Recipient full name is required.";
      setError(msg);
      setFieldErrors({ recipientName: msg });
      setTimeout(() => document.getElementById("address-recipient")?.focus(), 50);
      return;
    }
    if (!validatePhilippineMobile(formData.contactNumber)) {
      const msg = "Contact number must be an 11-digit mobile starting with 09 (e.g. 09171234567).";
      setError(msg);
      setFieldErrors({ contactNumber: msg });
      setTimeout(() => document.getElementById("address-contact")?.focus(), 50);
      return;
    }
    if (!formData.cityMunicipality.trim()) {
      const msg = "City or municipality is required.";
      setError(msg);
      setFieldErrors({ cityMunicipality: msg });
      setTimeout(() => document.getElementById("address-city")?.focus(), 50);
      return;
    }
    if (!formData.barangay.trim()) {
      const msg = "Barangay is required.";
      setError(msg);
      setFieldErrors({ barangay: msg });
      setTimeout(() => document.getElementById("address-barangay")?.focus(), 50);
      return;
    }
    if (!formData.streetAddress.trim()) {
      const msg = "Street address is required.";
      setError(msg);
      setFieldErrors({ streetAddress: msg });
      setTimeout(() => document.getElementById("address-street")?.focus(), 50);
      return;
    }
    if (!formData.postalCode.trim()) {
      const msg = "Postal code is required.";
      setError(msg);
      setFieldErrors({ postalCode: msg });
      setTimeout(() => document.getElementById("address-postal")?.focus(), 50);
      return;
    }

    const res = addAddress({
      label: formData.label.trim(),
      recipientName: formData.recipientName.trim(),
      contactNumber: formData.contactNumber.trim(),
      region: "Region III",
      province: formData.province,
      cityMunicipality: formData.cityMunicipality.trim(),
      barangay: formData.barangay.trim(),
      streetAddress: formData.streetAddress.trim(),
      postalCode: formData.postalCode.trim(),
      isDefault: formData.isDefault,
    });

    if (!res.success) {
      setError(res.error || "Failed to add address.");
      return;
    }

    setError(null);
    setFieldErrors({});
    setShowAddForm(false);
    setFormData({
      label: "",
      recipientName: "",
      contactNumber: "09171234567",
      province: "Pampanga",
      cityMunicipality: "",
      barangay: "",
      streetAddress: "",
      postalCode: "",
      isDefault: false,
    });
    toast("New delivery address registered successfully", "success");
    setTimeout(() => {
      const addBtn = document.getElementById("add-address-trigger-btn") as HTMLButtonElement | null;
      if (addBtn && !addBtn.disabled) {
        addBtn.focus();
      } else {
        const addedCardDelete = res.address?.id
          ? (document.querySelector(`[data-delete-address-btn="${res.address.id}"]`) as HTMLElement | null)
          : null;
        const target = addedCardDelete || document.getElementById("address-section-heading");
        target?.focus();
      }
    }, 50);
  };

  return (
    <div className="flex flex-col gap-5 max-w-[720px] w-full">
      {/* Header & Limits Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm">
        <div>
          <h2 id="address-section-heading" tabIndex={-1} className="text-sm font-bold text-mocha-text outline-none">
            Saved Delivery Addresses
          </h2>
          <p className="text-xs text-mocha-text-muted mt-0.5">
            Strictly Central Luzon (Region III). Maximum of 2 delivery addresses allowed per fulfillment rules.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            id="address-capacity-badge"
            className={`text-xs font-bold font-mono px-3 py-1 rounded-full border ${
              isLimitReached
                ? "bg-mocha-accent/15 text-mocha-accent border-mocha-accent/30"
                : "bg-mocha-panel-raised text-mocha-text-muted border-mocha-border"
            }`}
          >
            {addresses.length} / 2 Saved
          </span>
        </div>
      </div>

      {/* Address Cards List */}
      <div className="flex flex-col gap-3">
        {addresses.map((addr) => (
          <article
            key={addr.id}
            data-address-id={addr.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
              addr.isDefault
                ? "bg-mocha-panel-raised border-mocha-accent/50 shadow-md ring-1 ring-mocha-accent/20"
                : "bg-mocha-panel border-mocha-border hover:border-mocha-border-strong"
            }`}
          >
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  addr.isDefault
                    ? "bg-mocha-accent text-mocha-bg"
                    : "bg-mocha-panel-raised border border-mocha-border text-mocha-text-muted"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-bold text-mocha-text">{addr.label}</h3>
                  {addr.isDefault && (
                    <span
                      data-default-badge="true"
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-mocha-accent/15 text-mocha-accent border border-mocha-accent/30"
                    >
                      Default
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mocha-accent-secondary/15 text-mocha-accent-secondary border border-mocha-accent-secondary/30">
                    {addr.province}
                  </span>
                </div>

                <p className="text-xs text-mocha-text font-semibold">
                  {addr.recipientName}{" "}
                  <span className="font-mono text-mocha-text-muted font-normal">({addr.contactNumber})</span>
                </p>

                <p className="text-xs text-mocha-text-muted mt-1 leading-relaxed">
                  {addr.streetAddress}, Brgy. {addr.barangay}, {addr.cityMunicipality}, {addr.province},{" "}
                  {addr.region} {addr.postalCode ? `· ${addr.postalCode}` : ""}
                </p>
              </div>
            </div>

            {/* Address Actions */}
            <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-mocha-border/60">
              {!addr.isDefault && (
                <button
                  type="button"
                  data-set-default-btn={addr.id}
                  onClick={() => handleSetDefault(addr.id, addr.label)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-mocha-panel-raised border border-mocha-border text-mocha-text hover:border-mocha-accent hover:text-mocha-accent transition-colors min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent"
                >
                  Set Default
                </button>
              )}
              <button
                type="button"
                data-delete-address-btn={addr.id}
                onClick={() => handleDelete(addr.id, addr.label)}
                aria-label={`Delete address ${addr.label}`}
                className="w-11 h-11 rounded-xl text-mocha-text-muted hover:text-mocha-danger hover:bg-mocha-danger/10 transition-colors flex items-center justify-center min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-mocha-danger"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Add New Address Trigger & Capacity Notice */}
      {!showAddForm ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            id="add-address-trigger-btn"
            disabled={isLimitReached}
            aria-disabled={isLimitReached}
            onClick={handleOpenAddForm}
            className={`w-full py-3.5 px-4 rounded-2xl border border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all min-h-[48px] focus-visible:outline-2 focus-visible:outline-mocha-accent ${
              isLimitReached
                ? "border-mocha-border/40 text-mocha-text-muted/60 bg-mocha-panel/30 cursor-not-allowed"
                : "border-mocha-border text-mocha-text-muted hover:text-mocha-accent hover:border-mocha-accent hover:bg-mocha-panel-raised bg-mocha-panel"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Address
          </button>

          {isLimitReached && (
            <p
              id="address-limit-notice"
              className="text-[11px] text-mocha-text-muted text-center px-2 leading-relaxed"
            >
              Maximum limit of 2 saved addresses reached per Region III fulfillment specification. Delete an existing address to register a new delivery destination.
            </p>
          )}
        </div>
      ) : (
        /* Proposed Inline Add Address Form */
        <div
          id="new-address-form-panel"
          className="p-5 sm:p-6 rounded-2xl bg-mocha-panel border border-mocha-accent/40 shadow-md flex flex-col gap-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-mocha-border">
            <div>
              <h3 className="text-sm font-bold text-mocha-text tracking-tight">
                Add New Delivery Address (Region III Only)
              </h3>
              <p className="text-[11px] text-mocha-text-muted mt-0.5">
                Eligible for door-to-door courier delivery in Central Luzon
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelAddForm}
              aria-label="Cancel new address form"
              className="w-11 h-11 flex items-center justify-center rounded-xl text-mocha-text-muted hover:text-mocha-text hover:bg-mocha-panel-raised min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-mocha-accent"
            >
              ✕
            </button>
          </div>

          {error && (
            <div
              role="alert"
              id="address-form-error"
              className="p-3 rounded-xl bg-mocha-danger/10 border border-mocha-danger/25 text-xs text-mocha-danger flex items-center gap-2"
            >
              <span className="font-bold">✕</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmitNewAddress} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="address-label" className="text-xs font-semibold text-mocha-text-muted">
                  Address Label *
                </label>
                <input
                  id="address-label"
                  type="text"
                  placeholder="e.g. Home / Dormitory, Campus Lab"
                  value={formData.label}
                  onChange={(e) => setFormData((d) => ({ ...d, label: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none min-h-[44px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="address-recipient" className="text-xs font-semibold text-mocha-text-muted">
                  Recipient Full Name *
                </label>
                <input
                  id="address-recipient"
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={formData.recipientName}
                  onChange={(e) => setFormData((d) => ({ ...d, recipientName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="address-contact" className="text-xs font-semibold text-mocha-text-muted">
                  Contact Number (11 digits starting with 09) *
                </label>
                <input
                  id="address-contact"
                  type="tel"
                  placeholder="09171234567"
                  maxLength={11}
                  value={formData.contactNumber}
                  onChange={(e) => setFormData((d) => ({ ...d, contactNumber: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none min-h-[44px] font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="address-province" className="text-xs font-semibold text-mocha-text-muted">
                  Province (Region III Only) *
                </label>
                <select
                  id="address-province"
                  value={formData.province}
                  onChange={(e) => setFormData((d) => ({ ...d, province: e.target.value as Region3Province }))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none min-h-[44px] cursor-pointer"
                >
                  {REGION_3_PROVINCES.map((prov) => (
                    <option key={prov} value={prov} className="bg-mocha-bg text-mocha-text">
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="address-city" className="text-xs font-semibold text-mocha-text-muted">
                  City / Municipality *
                </label>
                <input
                  id="address-city"
                  type="text"
                  placeholder="e.g. San Fernando, Angeles City"
                  value={formData.cityMunicipality}
                  onChange={(e) => setFormData((d) => ({ ...d, cityMunicipality: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none min-h-[44px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="address-barangay" className="text-xs font-semibold text-mocha-text-muted">
                  Barangay *
                </label>
                <input
                  id="address-barangay"
                  type="text"
                  placeholder="e.g. Dolores, Balibago"
                  value={formData.barangay}
                  onChange={(e) => setFormData((d) => ({ ...d, barangay: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="address-street" className="text-xs font-semibold text-mocha-text-muted">
                  Street Address / Building Name *
                </label>
                <input
                  id="address-street"
                  type="text"
                  placeholder="House No., Street, Building Name"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData((d) => ({ ...d, streetAddress: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none min-h-[44px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="address-postal" className="text-xs font-semibold text-mocha-text-muted">
                  Postal Code *
                </label>
                <input
                  id="address-postal"
                  type="text"
                  required
                  aria-required="true"
                  aria-invalid={fieldErrors.postalCode ? "true" : undefined}
                  aria-describedby={fieldErrors.postalCode ? "address-postal-error" : undefined}
                  placeholder="e.g. 2000"
                  value={formData.postalCode}
                  onChange={(e) => {
                    setFormData((d) => ({ ...d, postalCode: e.target.value }));
                    if (fieldErrors.postalCode) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.postalCode;
                        return next;
                      });
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border text-mocha-text focus:ring-2 outline-none min-h-[44px] font-mono ${
                    fieldErrors.postalCode
                      ? "border-mocha-danger focus:border-mocha-danger focus:ring-mocha-danger/20"
                      : "border-mocha-border focus:border-mocha-accent focus:ring-mocha-accent/20"
                  }`}
                />
                {fieldErrors.postalCode && (
                  <p id="address-postal-error" role="alert" className="text-[11px] text-mocha-danger font-medium mt-0.5">
                    {fieldErrors.postalCode}
                  </p>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-mocha-text cursor-pointer py-1 min-h-[44px]">
              <input
                type="checkbox"
                id="address-is-default-checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData((d) => ({ ...d, isDefault: e.target.checked }))}
                className="w-4 h-4 rounded text-mocha-accent focus:ring-mocha-accent/30 bg-mocha-bg border-mocha-border cursor-pointer"
              />
              <span>Set as default delivery address for checkout</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-mocha-border">
              <button
                type="button"
                onClick={handleCancelAddForm}
                id="cancel-address-btn"
                className="px-4 py-2 text-xs font-semibold rounded-xl text-mocha-text-muted hover:text-mocha-text hover:bg-mocha-panel-high transition-colors min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-address-btn"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-mocha-accent text-mocha-bg hover:opacity-95 transition-opacity min-h-[44px] min-w-[120px] flex items-center justify-center shadow-sm focus-visible:outline-2 focus-visible:outline-mocha-accent"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
