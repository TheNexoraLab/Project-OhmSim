"use client";

import React, { Suspense, useEffect } from "react";
import { CartProvider } from "@/hooks/use-cart";
import { BomProvider } from "@/hooks/use-bom";
import { BuyerHeader } from "@/components/buyer/buyer-header";
import { BuyerMobileHeader, BuyerMobileBottomNav } from "@/components/buyer/buyer-mobile-nav";
import { ToastContainer } from "@/components/ui/toast";
import { chatStore } from "@/services/chat-service";
import { resetProfileStore } from "@/services/profile-service";
import { CartFeedbackProvider } from "@/components/buyer/cart-feedback";

function BuyerShell({ children }: { children: React.ReactNode }) {
  // Client navigation retains Buyer mock state; leaving the Buyer shell resets it.
  useEffect(() => () => {
    chatStore.cleanup();
    resetProfileStore();
  }, []);
  return (
    <div className="min-h-screen flex flex-col bg-mocha-bg text-mocha-text selection:bg-mocha-accent/30 selection:text-mocha-text w-full max-w-full overflow-x-clip">
      {/* Desktop Header */}
      <Suspense fallback={<div className="h-[64px] hidden md:block" />}>
        <BuyerHeader />
      </Suspense>

      {/* Mobile Top Header */}
      <BuyerMobileHeader />

      {/* Main Content Area — id="main-content" connects root skip link */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col pb-16 md:pb-0 focus:outline-none w-full max-w-full overflow-x-clip"
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BuyerMobileBottomNav />

      {/* Accessible Consolidated Notification Toast System */}
      <ToastContainer />
    </div>
  );
}

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <BomProvider>
        <CartFeedbackProvider>
          <BuyerShell>{children}</BuyerShell>
        </CartFeedbackProvider>
      </BomProvider>
    </CartProvider>
  );
}
