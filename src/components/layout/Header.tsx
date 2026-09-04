"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "./Container";
import Logo from "@/components/Logo";
import { mainNav } from "@/lib/nav";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-white/10">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" onClick={() => setOpen(false)} className="transition-opacity hover:opacity-80">
            <Logo size="sm" />
          </Link>

          <nav className="hidden md:flex gap-6 text-sm font-medium">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-zinc-300 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex flex-col gap-1.5 p-2"
          >
            <span className={`h-0.5 w-6 bg-white transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-6 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-6 bg-white transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </Container>

      <div
        className={`md:hidden overflow-hidden border-t border-white/10 bg-black transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <Container>
          <div className="flex flex-col items-start gap-1 py-4">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="w-full py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </header>
  );
}
