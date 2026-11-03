import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatClient } from "./chat-client";

export const metadata: Metadata = {
  title: "Support Chat Responder — OhmSim Admin",
  description:
    "Two-pane technical and fulfillment helpdesk for responding to buyer component inquiries and Region III orders.",
};

export default function AdminChatPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-20 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="h-[600px] animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E] lg:col-span-4" />
            <div className="h-[600px] animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E] lg:col-span-8" />
          </div>
        </div>
      }
    >
      <ChatClient />
    </Suspense>
  );
}

