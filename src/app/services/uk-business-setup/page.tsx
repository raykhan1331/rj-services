import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { SectionHeading, ServiceCard } from "@/components/home/Section";
import Reveal from "@/components/home/Reveal";
import ProcessSteps from "@/components/services/ProcessSteps";
import EnquiryForm from "@/components/services/EnquiryForm";

export const metadata: Metadata = {
  title: "UK Business Setup — Formation, Address, KYC & Banking",
  description:
    "A combined UK business setup package: company formation, registered address, KYC preparation, and bank account assistance, guided step by step by RJ Services.",
  alternates: { canonical: "/services/uk-business-setup" },
};
import {
  IconBuilding,
  IconMapPin,
  IconShield,
  IconChecklist,
  IconBank,
} from "@/components/home/icons";

const overview = [
  { icon: <IconBuilding />, title: "UK Company Formation", description: "Register and structure your UK company correctly.", href: "#company-formation" },
  { icon: <IconMapPin />, title: "UK Company Address", description: "A registered office address for your company.", href: "#virtual-address" },
  { icon: <IconMapPin />, title: "Virtual Business Address", description: "A professional address for correspondence.", href: "#virtual-address" },
  { icon: <IconShield />, title: "KYC Assistance", description: "Support preparing documents for verification.", href: "#kyc" },
  { icon: <IconChecklist />, title: "Business Setup Guidance", description: "General coordination support as you get started.", href: "/services/business-setup-assistance" },
  { icon: <IconBank />, title: "Bank Account Application Assistance", description: "Guidance applying for a UK bank account.", href: "#banking" },
];

const steps = ["Consultation", "Documentation", "Application", "Verification/KYC", "Provider/Authority Review", "Completion"];

const faqs = [
  { q: "Do you guarantee company registration or account approval?", a: "No. Company registration is approved solely by Companies House, and account or verification outcomes are decided solely by the relevant provider or authority. We cannot guarantee any outcome." },
  { q: "How long does UK company formation take?", a: "Timing depends on Companies House's own processing, which is outside our control. We keep you informed at each stage." },
  { q: "Is KYC verification guaranteed to pass?", a: "No. Verification is determined solely by the provider or authority carrying it out, based on the documents and information provided." },
  { q: "Can a virtual address be used as my registered office?", a: "Often yes, where the specific address provider's terms support it — this should be confirmed with that provider directly." },
];

export default function UkBusinessSetupPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">UK Business Setup</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
            Set Up Your UK Business, Step by Step
          </h1>
          <p className="mt-5 text-zinc-400">
            From company formation to banking, RJ Services helps you prepare and submit everything
            needed to get your UK business up and running &mdash; with approval always decided by the
            relevant authority or provider.
          </p>
        </div>
      </Container>

      {/* Overview */}
      <Reveal>
        <Container>
          <div className="pb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {overview.map((s) => (
                <ServiceCard key={s.title} {...s} />
              ))}
            </div>
          </div>
        </Container>
      </Reveal>

      {/* Process */}
      <Reveal>
        <Container>
          <div className="pb-20">
            <SectionHeading eyebrow="How it works" title="Our process" />
            <div className="mt-10">
              <ProcessSteps steps={steps} />
            </div>
          </div>
        </Container>
      </Reveal>

      {/* Company Formation */}
      <Reveal>
        <Container>
          <div id="company-formation" className="pb-16 scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
            <h2 className="text-2xl font-semibold text-white">Company Formation</h2>
            <p className="mt-3 text-zinc-400 leading-relaxed max-w-2xl">
              UK companies are registered with Companies House, the UK&apos;s official company
              registrar. We help you prepare accurate company details and documentation for
              submission; Companies House independently reviews and approves each registration.
            </p>
            <Link href="/services/uk-company-formation" className="mt-4 inline-block text-sm font-medium hover:opacity-70">
              Learn more about Company Formation &rarr;
            </Link>
          </div>
        </Container>
      </Reveal>

      {/* Virtual Address */}
      <Reveal>
        <Container>
          <div id="virtual-address" className="pb-16 scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
            <h2 className="text-2xl font-semibold text-white">Virtual &amp; Registered Address</h2>
            <p className="mt-3 text-zinc-400 leading-relaxed max-w-2xl">
              A UK company needs a registered office address, and many businesses also use a
              separate virtual address for day-to-day correspondence. We help you choose and set up
              an address service that fits your company&apos;s needs.
            </p>
            <Link href="/services/virtual-addresses" className="mt-4 inline-block text-sm font-medium hover:opacity-70">
              Learn more about Virtual Addresses &rarr;
            </Link>
          </div>
        </Container>
      </Reveal>

      {/* KYC */}
      <Reveal>
        <Container>
          <div id="kyc" className="pb-16 scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
            <h2 className="text-2xl font-semibold text-white">KYC Verification</h2>
            <p className="mt-3 text-zinc-400 leading-relaxed max-w-2xl">
              Providers and authorities carry out their own Know Your Customer (KYC) checks before
              approving an account or application. We help you prepare and organise the
              documentation typically required, but verification and approval are decided solely by
              that provider or authority.
            </p>
            <Link href="/services/kyc-assistance" className="mt-4 inline-block text-sm font-medium hover:opacity-70">
              Learn more about KYC Assistance &rarr;
            </Link>
          </div>
        </Container>
      </Reveal>

      {/* Banking */}
      <Reveal>
        <Container>
          <div id="banking" className="pb-20 scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
            <h2 className="text-2xl font-semibold text-white">Banking Assistance</h2>
            <p className="mt-3 text-zinc-400 leading-relaxed max-w-2xl">
              Once your company and documentation are ready, we help you apply for a suitable UK
              personal or business bank account. Final approval always depends on the bank or
              provider&apos;s own eligibility, verification, and compliance checks.
            </p>
            <Link href="/services/banking" className="mt-4 inline-block text-sm font-medium hover:opacity-70">
              Learn more about Banking Services &rarr;
            </Link>
          </div>
        </Container>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <Container>
          <div className="pb-20 max-w-2xl mx-auto">
            <SectionHeading eyebrow="Questions" title="Business Setup FAQ" />
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
          </div>
        </Container>
      </Reveal>

      {/* Enquiry + CTA */}
      <Reveal>
        <div className="relative overflow-hidden border-t border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/60 via-black to-black" />
          <Container>
            <div className="relative py-20 max-w-xl mx-auto text-center">
              <h2 className="text-3xl font-semibold tracking-tight">Ready to set up your UK business?</h2>
              <p className="mt-4 text-zinc-400">
                Send us an enquiry and we&apos;ll get back to you to discuss the next steps.
              </p>
              <div className="mt-10 text-left">
                <EnquiryForm />
              </div>
            </div>
          </Container>
        </div>
      </Reveal>
    </div>
  );
}
