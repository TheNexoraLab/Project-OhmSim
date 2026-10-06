"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  getProfileSnapshot,
  subscribeProfile,
  updateProfile,
  validatePhilippineMobile,
} from "@/services/profile-service";
import { toast } from "@/components/ui/toast";

const emptySubscribe = () => () => {};

export function ProfilePersonalInfo() {
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...profile });
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = () => {
    setDraft({ ...profile });
    setError(null);
    setEditing(true);
    setTimeout(() => {
      document.getElementById("profile-first-name")?.focus();
    }, 50);
  };

  const handleCancel = () => {
    setDraft({ ...profile });
    setError(null);
    setEditing(false);
    setTimeout(() => {
      document.getElementById("profile-edit-btn")?.focus();
    }, 50);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!draft.lastName.trim()) {
      setError("Last name is required.");
      return;
    }
    if (!validatePhilippineMobile(draft.mobile)) {
      setError("Mobile number must be an 11-digit Philippine mobile starting with 09 (e.g. 09171234567).");
      return;
    }

    const result = updateProfile(draft);
    if (!result.success) {
      setError(result.error || "Failed to update profile.");
      return;
    }

    setError(null);
    setEditing(false);
    toast("Personal information updated successfully", "success");
    setTimeout(() => {
      document.getElementById("profile-edit-btn")?.focus();
    }, 50);
  };

  return (
    <div
      data-hydrated={hydrated ? "true" : undefined}
      className="flex-1 w-full p-5 sm:p-6 flex flex-col gap-5 rounded-[18px] bg-mocha-panel border border-mocha-border shadow-sm"
    >
      <div className="flex items-center justify-between pb-3 border-b border-mocha-border">
        <div>
          <h2 className="text-sm font-bold text-mocha-text tracking-tight">Personal Information</h2>
          <p className="text-[11px] text-mocha-text-muted mt-0.5">
            Your identity and contact details used for orders and fulfillment
          </p>
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={handleStartEdit}
            id="profile-edit-btn"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-mocha-panel-raised border border-mocha-border text-mocha-accent hover:border-mocha-accent transition-colors min-h-[44px] min-w-[72px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent"
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              id="profile-cancel-btn"
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-mocha-text-muted hover:text-mocha-text hover:bg-mocha-panel-high transition-colors min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              id="profile-save-btn"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-mocha-accent text-mocha-bg hover:opacity-95 transition-opacity min-h-[44px] min-w-[72px] flex items-center justify-center shadow-sm focus-visible:outline-2 focus-visible:outline-mocha-accent"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          id="profile-error-alert"
          className="p-3 rounded-xl bg-mocha-danger/10 border border-mocha-danger/25 text-xs text-mocha-danger flex items-center gap-2"
        >
          <span className="font-bold">✕</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-first-name" className="text-xs font-semibold text-mocha-text-muted">
              First Name *
            </label>
            <input
              id="profile-first-name"
              type="text"
              readOnly={!editing}
              value={editing ? draft.firstName : profile.firstName}
              onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl transition-all min-h-[44px] ${
                editing
                  ? "bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none"
                  : "bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text cursor-default outline-none"
              }`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-last-name" className="text-xs font-semibold text-mocha-text-muted">
              Last Name *
            </label>
            <input
              id="profile-last-name"
              type="text"
              readOnly={!editing}
              value={editing ? draft.lastName : profile.lastName}
              onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl transition-all min-h-[44px] ${
                editing
                  ? "bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none"
                  : "bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text cursor-default outline-none"
              }`}
            />
          </div>
        </div>

        {/* Email (Read-only per spec) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="profile-email" className="text-xs font-semibold text-mocha-text-muted">
              Email Address
            </label>
            <span className="text-[10px] text-mocha-text-muted">Read-only (identity changes unavailable)</span>
          </div>
          <input
            id="profile-email"
            type="email"
            readOnly
            value={profile.email}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text-muted cursor-not-allowed outline-none min-h-[44px]"
          />
        </div>

        {/* Mobile (11 digits 09XXXXXXXXX) */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-mobile" className="text-xs font-semibold text-mocha-text-muted">
            Mobile Number (11-digit Philippine mobile starting with 09) *
          </label>
          <input
            id="profile-mobile"
            type="tel"
            readOnly={!editing}
            value={editing ? draft.mobile : profile.mobile}
            placeholder="09171234567"
            maxLength={11}
            onChange={(e) => setDraft((d) => ({ ...d, mobile: e.target.value }))}
            className={`w-full px-3.5 py-2.5 text-xs rounded-xl transition-all min-h-[44px] font-mono ${
              editing
                ? "bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none"
                : "bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text cursor-default outline-none"
            }`}
          />
        </div>

        {/* Company / Organization (Separate full-width row per reference) */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-company" className="text-xs font-semibold text-mocha-text-muted">
            Company / Organization
          </label>
          <input
            id="profile-company"
            type="text"
            readOnly={!editing}
            value={editing ? draft.company : profile.company}
            placeholder="e.g. MakerSpace PH"
            onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}
            className={`w-full px-3.5 py-2.5 text-xs rounded-xl transition-all min-h-[44px] ${
              editing
                ? "bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none"
                : "bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text cursor-default outline-none"
            }`}
          />
        </div>

        {/* Role / Position (Separate full-width row per reference) */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-role" className="text-xs font-semibold text-mocha-text-muted">
            Role / Position
          </label>
          <input
            id="profile-role"
            type="text"
            readOnly={!editing}
            value={editing ? draft.role : profile.role}
            placeholder="e.g. Electronics Engineer"
            onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
            className={`w-full px-3.5 py-2.5 text-xs rounded-xl transition-all min-h-[44px] ${
              editing
                ? "bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none"
                : "bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text cursor-default outline-none"
            }`}
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-bio" className="text-xs font-semibold text-mocha-text-muted">
            Bio
          </label>
          <textarea
            id="profile-bio"
            rows={3}
            readOnly={!editing}
            value={editing ? draft.bio : profile.bio}
            placeholder="Tell us about your engineering interests and hardware projects..."
            onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
            className={`w-full px-3.5 py-2.5 text-xs rounded-xl transition-all resize-none min-h-[88px] ${
              editing
                ? "bg-mocha-bg border border-mocha-border text-mocha-text focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none"
                : "bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text cursor-default outline-none"
            }`}
          />
        </div>
      </form>
    </div>
  );
}
