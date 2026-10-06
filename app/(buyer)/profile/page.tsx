import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "Buyer Profile | OhmSim",
  description: "Manage your personal information, saved delivery addresses, security posture, and notification preferences.",
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 text-mocha-text-muted text-xs">
          Loading profile...
        </div>
      }
    >
      <ProfileClient />
    </Suspense>
  );
}
