import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { SectionHeading } from "@/components/home/Section";
import { IconChecklist } from "@/components/home/icons";

export const metadata: Metadata = {
  title: "Business Setup Assistance",
  description:
    "General guidance and coordination support to help you get your UK or e-commerce business up and running smoothly, from company formation through to your first sale.",
  alternates: { canonical: "/services/business-setup-assistance" },
};

export default function BusinessSetupAssistancePage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <IconChecklist className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">Business Setup Assistance</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            One Point of Contact for Getting Started
          </h1>
          <p className="text-zinc-400">
            If you&apos;re not sure where to begin, RJ Services offers general guidance and
            coordination support across company formation, banking, and e-commerce setup — helping
            you get organised before you dive into any one service.
          </p>
          <Link
            href="/contact?service=business-setup-assistance"
            className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-medium hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </Container>

      <Container>
        <div className="pb-24">
          <SectionHeading eyebrow="Explore" title="Popular starting points" />
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto text-center">
            <Link href="/services/uk-business-setup" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06]">
              <span className="font-semibold text-white">UK Business Setup</span>
              <p className="mt-2 text-sm text-zinc-400">Formation, address, KYC, and banking together.</p>
            </Link>
            <Link href="/services/ecommerce" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06]">
              <span className="font-semibold text-white">E-commerce Services</span>
              <p className="mt-2 text-sm text-zinc-400">eBay and Shopify store setup.</p>
            </Link>
            <Link href="/services/consultation" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06]">
              <span className="font-semibold text-white">Consultation</span>
              <p className="mt-2 text-sm text-zinc-400">Talk through your specific situation first.</p>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
