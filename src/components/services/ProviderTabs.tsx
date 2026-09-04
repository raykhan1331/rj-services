"use client";

import { useState } from "react";
import BankProviderCard, { type BankProvider } from "@/components/media/BankProviderCard";

export default function ProviderTabs({
  personal,
  business,
}: {
  personal: BankProvider[];
  business: BankProvider[];
}) {
  const [tab, setTab] = useState<"personal" | "business">("personal");
  const list = tab === "personal" ? personal : business;

  return (
    <div>
      <div className="flex justify-center gap-2">
        {(["personal", "business"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-black" : "border border-white/20 text-white hover:bg-white/10"
            }`}
          >
            {t === "personal" ? "Personal Accounts" : "Business Accounts"}
          </button>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {list.map((p) => (
          <BankProviderCard key={p.name} {...p} />
        ))}
      </div>
    </div>
  );
}
