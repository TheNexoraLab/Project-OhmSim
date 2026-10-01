import React from "react";
import Image from "next/image";

interface TrustItem {
  id: string;
  title: string;
  detail: string;
  iconSrc: string;
  accent: string;
  hoverBorder: string;
  badgeBg: string;
}

const trustItems: TrustItem[] = [
  {
    id: "pickup",
    title: "In-Store Pickup",
    detail: "Ready in 2 hours",
    iconSrc: "/icons/pickup.svg",
    accent: "#89B4FA",
    hoverBorder: "hover:border-[#89B4FA]",
    badgeBg: "bg-[#89B4FA]/10 text-[#89B4FA]",
  },
  {
    id: "delivery",
    title: "Region 3 Delivery",
    detail: "3–5 business days",
    iconSrc: "/icons/delivery.svg",
    accent: "#94E2D5",
    hoverBorder: "hover:border-[#94E2D5]",
    badgeBg: "bg-[#94E2D5]/10 text-[#94E2D5]",
  },
  {
    id: "authentic",
    title: "Verified Authentic",
    detail: "No counterfeit parts",
    iconSrc: "/icons/authentic.svg",
    accent: "#A6E3A1",
    hoverBorder: "hover:border-[#A6E3A1]",
    badgeBg: "bg-[#A6E3A1]/10 text-[#A6E3A1]",
  },
  {
    id: "inventory",
    title: "Live Inventory",
    detail: "Real-time stock levels",
    iconSrc: "/icons/inventory.svg",
    accent: "#F9E2AF",
    hoverBorder: "hover:border-[#F9E2AF]",
    badgeBg: "bg-[#F9E2AF]/10 text-[#F9E2AF]",
  },
];

export function TrustSection() {
  return (
    <section
      aria-label="Trust and Reliability Highlights"
      className="py-10 md:py-16"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subtle Horizontal Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#45475A]/60 to-transparent mb-10" />

        {/* 2-column on compact screens, 4-column on large screens */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {trustItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-[18px] bg-[#1E1E2E] border border-[#313244] shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-colors duration-200 ${item.hoverBorder}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center p-2 ${item.badgeBg}`}
                >
                  <Image
                    src={item.iconSrc}
                    alt=""
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#CDD6F4] leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-[#A6ADC8]">
                    {item.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
