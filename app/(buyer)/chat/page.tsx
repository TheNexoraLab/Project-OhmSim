import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ChatClient } from "./chat-client";

export const metadata: Metadata = {
  title: "Support Chat | OhmSim",
  description: "Connect with OhmSim component engineering and fulfillment support.",
};

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 bg-mocha-bg text-mocha-text-muted text-xs">
          Loading conversation...
        </div>
      }
    >
      <ChatClient />
    </Suspense>
  );
}
