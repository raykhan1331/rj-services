import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/home/Reveal";
import { IconBag, IconStore, IconCheck } from "@/components/home/icons";
import BusinessImageCard from "@/components/media/BusinessImageCard";
import { MEDIA } from "@/lib/media";

export const metadata: Metadata = {
  title: "E-commerce Services — eBay & Shopify Store Setup",
  description:
    "Legitimate, policy-compliant eBay store setup (our primary e-commerce service) and Shopify store setup, design, and configuration support from RJ Services.",
  alternates: { canonical: "/services/ecommerce" },
};

const ebayFeatures = [
  "eBay store setup",
  "Legitimate business store setup",
  "Store configuration",
  "Listing setup",
  "Store optimization",
  "E-commerce guidance",
  "Multi-store setup for businesses with multiple legitimate trading entities, where legally permitted",
  "Store management assistance",
];

const shopifyFeatures = ["Shopify store setup", "Design", "Product setup", "Configuration", "Optimization", "Basic e-commerce setup"];

export default function EcommercePage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">E-commerce Services</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
            Build a Legitimate, Well-Run Online Store
          </h1>
          <p className="mt-5 text-zinc-400">
            RJ Services helps businesses set up and manage professional eBay and Shopify stores &mdash;
            eBay as our primary e-commerce service, with Shopify support alongside it.
          </p>
        </div>
      </Container>

      <Reveal>
        <Container>
          <div className="pb-16 max-w-2xl mx-auto">
            <BusinessImageCard
              image={MEDIA.ecommerce}
              caption="A professional store, done right"
              description="From setup to optimization, built to convert."
            />
          </div>
        </Container>
      </Reveal>

      {/* Standards notice */}
      <Reveal>
        <Container>
          <div className="pb-16">
            <div className="max-w-3xl mx-auto rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-6 text-center">
              <h3 className="font-semibold text-white">Our Commitment to Legitimate Business</h3>
              <p className="mt-2 text-sm text-amber-400/80 leading-relaxed">
                We only provide legitimate, platform-policy-compliant store setup and management
                assistance. We do not offer or support fake identities, fake documents, account
                farming, bypassing platform policies, or deceptive accounts of any kind.
              </p>
            </div>
          </div>
        </Container>
      </Reveal>

      {/* eBay — PRIMARY */}
      <Reveal>
        <Container>
          <div className="pb-20">
            <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.08] to-transparent p-8 sm:p-14">
              <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
                  <IconBag className="w-8 h-8" />
                </div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">Primary Service</p>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">eBay Store Services</h2>
                <p className="text-zinc-400">
                  Our flagship e-commerce service &mdash; end-to-end support to launch and grow a
                  professional, compliant eBay store.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {ebayFeatures.map((f) => (
                  <div key={f} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                    <IconCheck className="w-5 h-5 shrink-0 text-white mt-0.5" />
                    <span className="text-sm text-zinc-300">{f}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex justify-center">
                <Link
                  href="/contact?service=ebay"
                  className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-medium hover:opacity-90"
                >
                  Enquire about eBay Services
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Reveal>

      {/* Shopify — SECONDARY */}
      <Reveal>
        <Container>
          <div className="pb-20">
            <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <IconStore className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500">Secondary Service</p>
                  <h2 className="text-xl font-semibold text-white">Shopify Store Services</h2>
                </div>
              </div>
              <ul className="mt-6 space-y-2">
                {shopifyFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-400">
                    <IconCheck className="w-4 h-4 shrink-0 text-white" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact?service=shopify"
                className="mt-6 inline-block rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium hover:bg-white/10"
              >
                Enquire about Shopify Services
              </Link>
            </div>
          </div>
        </Container>
      </Reveal>
    </div>
  );
}
