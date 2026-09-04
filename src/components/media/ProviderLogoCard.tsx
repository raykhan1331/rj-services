"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Provider } from "@/lib/providers";

export default function ProviderLogoCard({ name, type, description, logo, href }: Provider) {
  const [failed, setFailed] = useState(false);
  const showLogo = logo && !failed;

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 transition-all duration-200 hover:border-white/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40">
      <div className="flex items-start justify-between gap-3">
        {showLogo ? (
          <div className="flex h-12 w-24 shrink-0 items-center justify-center rounded-xl bg-white p-2">
            <div className="relative h-full w-full">
              <Image
                src={logo}
                alt={`${name} logo`}
                fill
                sizes="96px"
                className="object-contain"
                onError={() => setFailed(true)}
              />
            </div>
          </div>
        ) : (
          <div
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black text-sm font-semibold tracking-wide text-white"
          >
            {initials}
          </div>
        )}
        <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          {type}
        </span>
      </div>

      <div>
        <h3 className="font-semibold text-white">{name}</h3>
        <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">{description}</p>
      </div>

      <Link
        href={href}
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-white transition-opacity hover:opacity-70"
      >
        Learn More
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 transition-transform group-hover:translate-x-0.5">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}
