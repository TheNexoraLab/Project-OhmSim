import React from "react";

interface TrustItem {
  id: string;
  title: string;
  detail: string;
  accent: string;
  hoverBorder: string;
  badgeBg: string;
  icon: React.ReactNode;
}

const trustItems: TrustItem[] = [
  {
    id: "pickup",
    title: "In-Store Pickup",
    detail: "Ready in 2 hours",
    accent: "#89B4FA",
    hoverBorder: "hover:border-[#89B4FA]",
    badgeBg: "bg-[#89B4FA]/10 text-[#89B4FA]",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <polyline
          points="9 22 9 12 15 12 15 22"
          fill="currentColor"
          fillOpacity="0.35"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    id: "delivery",
    title: "Region 3 Delivery",
    detail: "3–5 business days",
    accent: "#94E2D5",
    hoverBorder: "hover:border-[#94E2D5]",
    badgeBg: "bg-[#94E2D5]/10 text-[#94E2D5]",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect
          x="1"
          y="3"
          width="15"
          height="13"
          rx="1"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M16 8h4l3 3v5h-7V8z"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="5.5"
          cy="18.5"
          r="2.5"
          fill="currentColor"
          fillOpacity="0.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="18.5"
          cy="18.5"
          r="2.5"
          fill="currentColor"
          fillOpacity="0.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    id: "authentic",
    title: "Verified Authentic",
    detail: "No counterfeit parts",
    accent: "#A6E3A1",
    hoverBorder: "hover:border-[#A6E3A1]",
    badgeBg: "bg-[#A6E3A1]/10 text-[#A6E3A1]",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    ),
  },
  {
    id: "inventory",
    title: "Live Inventory",
    detail: "Real-time stock levels",
    accent: "#F9E2AF",
    hoverBorder: "hover:border-[#F9E2AF]",
    badgeBg: "bg-[#F9E2AF]/10 text-[#F9E2AF]",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline
          points="22 12 18 12 15 21 9 3 6 12 2 12"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <polyline
          points="22 12 18 12 15 21 9 3 6 12 2 12"
          stroke="currentColor"
          strokeWidth="6"
          strokeOpacity="0.15"
        />
      </svg>
    ),
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
        <div className="w-full h-px bg-gradient-to-r from-transparent via-mocha-panel-high/60 to-transparent mb-10" />

        {/* 2-column on compact screens, 4-column on large screens */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {trustItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-panel bg-mocha-panel border border-mocha-border shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-colors duration-200 ${item.hoverBorder}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center p-2.5 ${item.badgeBg}`}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-mocha-text leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-mocha-text-subtle">
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
