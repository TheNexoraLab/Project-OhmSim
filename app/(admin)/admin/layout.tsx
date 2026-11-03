"use client";

import React, { useState } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { ToastContainer } from "@/components/ui/toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div
      data-testid="admin-shell"
      className="min-h-screen w-full max-w-full flex bg-[#11111B] text-[#CDD6F4] font-sans selection:bg-[#89B4FA]/30 selection:text-[#CDD6F4] overflow-x-clip"
    >
      {/* Persistent Desktop 250px Sidebar & Mobile Slide-over Drawer */}
      <AdminSidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#11111B]">
        <AdminTopbar
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 focus:outline-none"
        >
          {children}
        </main>
      </div>

      {/* Shared Toast Feedback System */}
      <ToastContainer />
    </div>
  );
}
