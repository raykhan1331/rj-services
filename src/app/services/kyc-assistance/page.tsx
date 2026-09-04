import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { SectionHeading } from "@/components/home/Section";
import Reveal from "@/components/home/Reveal";
import { IconShield, IconCheck } from "@/components/home/icons";
import BusinessImageCard from "@/components/media/BusinessImageCard";
import { MEDIA } from "@/lib/media";

export const metadata: Metadata = {
  title: "KYC Assistance for UK Business Verification",
  description:
    "Support preparing documentation for identity and business verification (KYC) checks required by UK banks and providers. Verification decisions always remain with the provider.",
  alternates: { canonical: "/services/kyc-assistance" },
};

const documents = [
  "Valid government-issued photo ID (passport or driving licence)",
  "Proof of address (recent utility bill or bank statement)",
  "Company registration and director details, for business verification",
  "Details of anyone with significant control over the business",
];

const faqs = [
  { q: "Is KYC verification guaranteed to pass?", a: "No. Verification is determined solely by the provider or authority carrying it out, based on the documents and information provided." },
  { q: "What is KYC?", a: "Know Your Customer — the identity and business checks providers run before opening an account or approving an application." },
  { q: "How can RJ Services help with KYC?", a: "We help you understand what's typically requested and organise your documentation, so your application is complete and accurate before you submit it." },
];

export default function KycAssistancePage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <IconShield className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">KYC Assistance</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Get Your Documents Ready for Verification
          </h1>
          <p className="text-zinc-400">
            RJ Services helps you prepare and organise the documentation typically required for
            identity and business verification checks.
          </p>
          <Link
            href="/contact?service=kyc-assistance"
            className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-medium hover:opacity-90"
          >
            Get KYC Help
          </Link>
        </div>
      </Container>

      <Reveal>
        <Container>
          <div className="pb-16 max-w-2xl mx-auto">
            <BusinessImageCard
              image={MEDIA.kyc}
              caption="Identity verification, made straightforward"
              description="We help you organise the right documents before you apply."
            />
          </div>
        </Container>
      </Reveal>

      <Reveal>
        <Container>
          <div className="pb-20">
            <SectionHeading eyebrow="What's typically needed" title="Common KYC documents" />
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {documents.map((d) => (
                <div key={d} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <IconCheck className="w-5 h-5 shrink-0 text-white mt-0.5" />
                  <span className="text-sm text-zinc-300">{d}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-amber-400/80 max-w-xl mx-auto">
              Verification outcomes are always decided by the relevant provider or authority. We
              can&apos;t guarantee verification will pass.
            </p>
          </div>
        </Container>
      </Reveal>

      <Reveal>
        <Container>
          <div className="pb-20 max-w-2xl mx-auto">
            <SectionHeading eyebrow="Questions" title="KYC FAQ" />
            <div className="mt-10 divide-y divide-white/10">
              {faqs.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-white">
                    {f.q}
                    <span className="text-zinc-500 group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-zinc-400">
              KYC is often part of opening an account — see our{" "}
              <Link href="/services/banking" className="text-white underline hover:no-underline">
                Banking Services
              </Link>
              .
            </p>
          </div>
        </Container>
      </Reveal>
    </div>
  );
}
