import React from "react";
import { PreviewDialogProvider } from "./_components/preview-dialog";
import { LandingNavbar } from "./_components/navbar";
import { Hero } from "./_components/hero";
import { Categories } from "./_components/categories";
import { TrustSection } from "./_components/trust-section";
import { BomSection } from "./_components/bom-section";
import { Footer } from "./_components/footer";

export default function LandingPage() {
  return (
    <PreviewDialogProvider>
      <div className="min-h-screen flex flex-col bg-mocha-bg text-mocha-text selection:bg-mocha-accent/30 selection:text-mocha-text">
        {/* Landing Navbar */}
        <LandingNavbar />

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 flex flex-col focus:outline-none">
          {/* Hero Section */}
          <Hero />

          {/* Browse by Category Section */}
          <Categories />

          {/* Trust / Reliability Section */}
          <TrustSection />

          {/* BOM Promotional Section */}
          <BomSection />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </PreviewDialogProvider>
  );
}
