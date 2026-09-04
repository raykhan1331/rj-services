import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { IconUsers } from "@/components/home/icons";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description:
    "Book a consultation with RJ Services to discuss your specific business needs — banking, UK company formation, KYC, e-commerce, or digital growth — and get tailored guidance.",
  alternates: { canonical: "/services/consultation" },
};

export default function ConsultationPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <IconUsers className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">Consultation</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Talk to Us Before You Decide
          </h1>
          <p className="text-zinc-400">
            Every business is different. Book a consultation and we&apos;ll discuss your specific
            needs — whether that&apos;s banking, UK company formation, KYC, e-commerce, or digital
            growth — and point you toward the right next step.
          </p>
          <Link
            href="/contact?service=consultation"
            className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-medium hover:opacity-90"
          >
            Book a Consultation
          </Link>
        </div>
      </Container>
    </div>
  );
}
