"use client";

import React from "react";

export function ProfileSecurityTab() {
  return (
    <div className="flex flex-col gap-5 max-w-[620px] w-full">
      {/* Notice Banner: Truthful Concise Unavailable State */}
      <div
        role="region"
        aria-label="Security status notice"
        className="p-4 sm:p-5 rounded-[18px] bg-mocha-panel border border-mocha-border shadow-sm flex items-start gap-3.5"
      >
        <div className="w-8 h-8 rounded-xl bg-mocha-accent/15 text-mocha-accent flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-mocha-text tracking-tight">Security & Access</h2>
          <p className="text-xs text-mocha-text-muted mt-1 leading-relaxed">
            Security settings, including password management, two-factor authentication, and session controls, are currently unavailable in this preview.
          </p>
        </div>
      </div>

      {/* Password Management (Disabled with programmatically associated labels) */}
      <div className="p-5 sm:p-6 rounded-[18px] bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
        <div className="pb-3 border-b border-mocha-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mocha-text-muted">Password Credentials</h3>
          <p className="text-[11px] text-mocha-text-muted mt-0.5">
            Password changes are currently unavailable
          </p>
        </div>

        <div className="flex flex-col gap-3.5 opacity-60">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="current-password" className="text-xs font-semibold text-mocha-text-muted">
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              disabled
              aria-disabled="true"
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text-muted cursor-not-allowed outline-none min-h-[44px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-xs font-semibold text-mocha-text-muted">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              disabled
              aria-disabled="true"
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text-muted cursor-not-allowed outline-none min-h-[44px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-xs font-semibold text-mocha-text-muted">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              disabled
              aria-disabled="true"
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text-muted cursor-not-allowed outline-none min-h-[44px]"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-mocha-panel-raised border border-mocha-border text-mocha-text-muted/60 cursor-not-allowed min-h-[44px] flex items-center justify-center"
          >
            Update Password (Unavailable)
          </button>
        </div>
      </div>

      {/* Active Sessions (Truthful unavailable state, no fake claims) */}
      <div className="p-5 sm:p-6 rounded-[18px] bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-3">
        <div className="pb-3 border-b border-mocha-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mocha-text-muted">Active Sessions</h3>
          <p className="text-[11px] text-mocha-text-muted mt-0.5">
            Signed-in devices and active browser sessions
          </p>
        </div>

        <p className="text-xs text-mocha-text-muted leading-relaxed">
          Session information is unavailable.
        </p>
      </div>

      {/* Danger Zone (Truthful copy, no invented administrator rule) */}
      <div className="p-5 sm:p-6 rounded-[18px] bg-mocha-danger/5 border border-mocha-danger/25 shadow-sm flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-mocha-danger">Danger Zone</h3>
          <p className="text-[11px] text-mocha-text-muted mt-0.5">
            Permanent account termination and data removal
          </p>
        </div>

        <p className="text-xs text-mocha-text-muted leading-relaxed">
          Account deletion is currently unavailable.
        </p>

        <div className="pt-2">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="px-4 py-2 text-xs font-bold rounded-xl border border-mocha-danger/30 text-mocha-danger/50 bg-transparent cursor-not-allowed min-h-[44px] flex items-center justify-center"
          >
            Delete Account (Unavailable)
          </button>
        </div>
      </div>
    </div>
  );
}
