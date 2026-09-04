import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { SectionHeading } from "@/components/home/Section";
import Reveal from "@/components/home/Reveal";
import ProviderTabs from "@/components/services/ProviderTabs";

export const metadata: Metadata = {
  title: "UK Bank Account Assistance — Personal & Business",
  description:
    "Assistance applying for UK personal and business bank accounts with Lloyds, Halifax, Monzo, Tide, Wise, Zempler Bank, and more. Eligibility and approval are always at the provider's discretion.",
  alternates: { canonical: "/services/banking" },
};

const personalProviders = [
  { name: "Lloyds Bank", type: "Personal" as const, description: "High-street personal banking.", href: "/contact?service=banking" },
  { name: "Halifax", type: "Personal" as const, description: "Part of Lloyds Banking Group.", href: "/contact?service=banking" },
  { name: "Monzo", type: "Personal" as const, description: "Digital-first personal banking.", href: "/contact?service=banking" },
  { name: "Taptap Send", type: "Personal" as const, description: "Primarily a business-focused provider; personal use may vary.", href: "/contact?service=banking" },
];

const businessProviders = [
  { name: "Tide", type: "Business" as const, description: "Business banking built for UK SMEs and sole traders.", href: "/contact?service=banking" },
  { name: "Wise", type: "Business" as const, description: "Formerly TransferWise — multi-currency business accounts.", href: "/contact?service=banking" },
  { name: "Zempler Bank", type: "Business" as const, description: "Formerly Cashplus Bank — UK business accounts.", href: "/contact?service=banking" },
];

const eligibility = [
  "Valid government-issued photo ID (passport or driving licence).",
  "Proof of UK address, or business address where applicable.",
  "UK company registration details, for business accounts.",
  "Meeting each provider's own eligibility, risk, and compliance criteria.",
];

const documents = [
  "Passport or driving licence.",
  "Proof of address (recent utility bill or bank statement).",
  "Companies House incorporation documents, for business accounts.",
  "Proof of business activity or website, where a provider requires it.",
];

const process = [
  { step: "1", title: "Consultation", text: "We discuss your situation and the providers that may suit your needs." },
  { step: "2", title: "Document preparation", text: "We help you organise the paperwork each provider typically asks for." },
  { step: "3", title: "Application submission", text: "We guide you through submitting your application accurately." },
  { step: "4", title: "Provider review", text: "The bank or provider carries out its own verification, KYC, and compliance checks. The outcome and timing are entirely at their discretion." },
];

const faqs = [
  { q: "Can you guarantee my account will be approved?", a: "No. Approval is always at the sole discretion of the bank or provider, based on their own eligibility, verification, and compliance checks. We cannot guarantee any outcome." },
  { q: "How long does the process take?", a: "Timelines vary by provider and depend on their own review process. We'll keep you informed throughout." },
  { q: "Can non-UK residents apply?", a: "Some providers accept applicants outside the UK, but this depends entirely on that provider's own criteria." },
  { q: "Is my information kept secure?", a: "We only collect the information needed to assist with your application and handle it responsibly." },
];

export default function BankingPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">Banking Services</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
            UK Personal &amp; Business Account Assistance
          </h1>
          <p className="mt-5 text-zinc-400">
            RJ Services provides practical, independent assistance with preparing and submitting UK
            personal and business bank account applications. We are not affiliated with, endorsed by,
            or partnered with the providers listed below unless explicitly stated. All brand names and
            trademarks belong to their respective owners.
          </p>
        </div>
      </Container>

      {/* Providers */}
      <Reveal>
        <Container>
          <div className="pb-20">
            <SectionHeading eyebrow="Providers" title="Who we help you apply to" />
            <div className="mt-10">
              <ProviderTabs personal={personalProviders} business={businessProviders} />
            </div>
          </div>
        </Container>
      </Reveal>

      {/* Eligibility + Documents */}
      <Reveal>
        <Container>
          <div className="pb-20 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="text-lg font-semibold text-white">Eligibility</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-400">
                {eligibility.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-white">&bull;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="text-lg font-semibold text-white">Required Documents</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-400">
                {documents.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-white">&bull;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Reveal>

      {/* Process */}
      <Reveal>
        <Container>
          <div className="pb-20">
            <SectionHeading eyebrow="How it works" title="Application process" />
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {process.map((p) => (
                <div key={p.step} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <span className="text-xs font-semibold text-zinc-500">STEP {p.step}</span>
                  <h3 className="mt-2 font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-amber-400/80 max-w-xl mx-auto">
              Final approval depends on the provider&apos;s eligibility criteria, verification, and
              compliance checks. Approval is never guaranteed.
            </p>
          </div>
        </Container>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <Container>
          <div className="pb-20 max-w-2xl mx-auto">
            <SectionHeading eyebrow="Questions" title="Banking FAQ" />
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

      {/* Enquiry CTA */}
      <Reveal>
        <div className="relative overflow-hidden border-t border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/60 via-black to-black" />
          <Container>
            <div className="relative py-20 text-center flex flex-col items-center gap-6">
              <h2 className="text-3xl font-semibold tracking-tight max-w-xl">
                Ready to start your account application?
              </h2>
              <Link
                href="/contact?service=banking"
                className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-medium hover:opacity-90"
              >
                Enquire Now
              </Link>
            </div>
          </Container>
        </div>
      </Reveal>
    </div>
  );
}
