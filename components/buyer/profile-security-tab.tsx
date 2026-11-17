"use client";

import React, { useState } from "react";
import { Shield, KeyRound, Check, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/toast";

export function ProfileSecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update password.");
        toast(data.error || "Failed to update password.", "error");
        return;
      }

      setSuccess("Your password has been changed successfully.");
      toast("Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Network error: Could not connect to the security service.");
      toast("Could not update password. Please check your connection.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-[620px] w-full">
      {/* Security Status Card */}
      <div
        role="region"
        aria-label="Security status overview"
        className="p-4 sm:p-5 rounded-[18px] bg-mocha-panel border border-mocha-border shadow-sm flex items-start gap-3.5"
      >
        <div className="w-8 h-8 rounded-xl bg-mocha-accent/15 text-mocha-accent flex items-center justify-center shrink-0 mt-0.5">
          <Shield size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-mocha-text tracking-tight">Security &amp; Account Protection</h2>
          <p className="text-xs text-mocha-text-muted mt-1 leading-relaxed">
            Manage your credentials and sign-in authentication. Use a strong password containing at least 8 characters.
          </p>
        </div>
      </div>

      {/* Active Password Management Form (GR-002) */}
      <form
        onSubmit={handleSubmitPassword}
        className="p-5 sm:p-6 rounded-[18px] bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4"
      >
        <div className="pb-3 border-b border-mocha-border flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-mocha-text">Password Credentials</h3>
            <p className="text-[11px] text-mocha-text-muted mt-0.5">
              Change your OhmSim buyer account password
            </p>
          </div>
          <span className="w-6 h-6 rounded-lg bg-mocha-accent/10 text-mocha-accent flex items-center justify-center">
            <KeyRound size={13} />
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-mocha-danger/15 border border-mocha-danger/30 text-mocha-danger text-xs flex items-center gap-2"
          >
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-3 rounded-xl bg-mocha-success/15 border border-mocha-success/30 text-mocha-success text-xs flex items-center gap-2"
          >
            <Check size={15} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="current-password" className="text-xs font-semibold text-mocha-text">
              Current Password <span className="text-mocha-danger">*</span>
            </label>
            <input
              id="current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none min-h-[44px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-xs font-semibold text-mocha-text">
              New Password <span className="text-mocha-danger">*</span>
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none min-h-[44px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-xs font-semibold text-mocha-text">
              Confirm New Password <span className="text-mocha-danger">*</span>
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-bg border border-mocha-border text-mocha-text placeholder-mocha-text-subtle focus:border-mocha-accent focus:ring-2 focus:ring-mocha-accent/20 outline-none min-h-[44px]"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-mocha-accent text-mocha-bg hover:opacity-95 shadow-sm transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-mocha-accent disabled:opacity-50"
          >
            {isSubmitting ? "Updating Password..." : "Update Password"}
          </button>
        </div>
      </form>

      {/* Active Session Info */}
      <div className="p-5 sm:p-6 rounded-[18px] bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-3">
        <div className="pb-3 border-b border-mocha-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mocha-text-muted">Active Sessions</h3>
          <p className="text-[11px] text-mocha-text-muted mt-0.5">
            Devices currently signed in to your OhmSim buyer account
          </p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-mocha-bg border border-mocha-border">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-mocha-success" />
            <div>
              <p className="text-xs font-semibold text-mocha-text">Current Browser Session</p>
              <p className="text-[10px] font-mono text-mocha-text-muted mt-0.5">
                Central Luzon (Region III) · Active Now
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-mocha-success px-2 py-0.5 rounded-full bg-mocha-success/15 border border-mocha-success/30">
            Current
          </span>
        </div>
      </div>
    </div>
  );
}
