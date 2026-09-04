import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { SectionHeading } from "@/components/home/Section";
import Reveal from "@/components/home/Reveal";
import ProcessSteps from "@/components/services/ProcessSteps";

export const metadata: Metadata = {
  title: "Tide Business Finance & Loan Assistance",
  description:
    "Assistance with eligible Tide business finance/loan applications for UK nationals and eligible UK residents/PR holders. Final lending decisions are always Tide's own.",
  alternates: { canonical: "/services/tide-business-loan" },
};

const eligibility = [
  "UK nationals and eligible UK residents/PR holders, where applicable.",
  "An active or eligible UK-registered business.",
  "Meeting Tide's own lending criteria, credit assessment, and affordability checks.",
  "Final eligibility is determined solely by Tide, not by RJ Services.",
];

const documents = [
  "Valid government-issued photo ID.",
  "Proof of UK address.",
  "Company registration and business details.",
  "Recent business bank statements or financial records, as requested by Tide.",
];

const steps = ["Consultation", "Documentation", "Application", "Assessment", "Lending Decision", "Completion"];

const faqs = [
  { q: "Can you guarantee my loan will be approved?", a: "No. Final lending decisions are made solely by Tide, based on their own eligibility criteria, credit assessment, and affordability checks. We cannot guarantee any outcome." },
  { q: "Who makes the final lending decision?", a: "Tide does. RJ Services helps you prepare and submit your application; the assessment and decision are entirely Tide's own." },
  { q: "What can affect my eligibility?", a: "Factors such as credit history, business financials, and affordability are assessed by Tide according to their own criteria." },
  { q: "How long does the process take?", a: "Timelines depend on Tide's own review process and are outside our control. We'll keep you informed at each stage." },
];

export default function TideBusinessLoanPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">Business Finance</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
            Tide Business Finance &amp; Loan Assistance
          </h1>
          <p className="mt-5 text-zinc-400">
            Assistance with eligible Tide business finance/loan applications &mdash; for UK nationals
            and eligible UK residents/PR holders, where applicable. RJ Services is not affiliated
            with, endorsed by, or partnered with Tide unless explicitly stated. Tide and its
            trademarks belong to their respective owner.
          </p>
        </div>
      </Container>

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
              <h3 className="text-lg font-semibold text-white">Documentation Guidance</h3>
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
            <div className="mt-10">
              <ProcessSteps steps={steps} />
            </div>
            <p className="mt-8 text-center text-xs text-amber-400/80 max-w-xl mx-auto">
              Final lending decisions are made by Tide, based on their own eligibility criteria and
              assessment. Approval is never guaranteed.
            </p>
          </div>
        </Container>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <Container>
          <div className="pb-20 max-w-2xl mx-auto">
            <SectionHeading eyebrow="Questions" title="Tide Finance FAQ" />
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

      {/* CTA */}
      <Reveal>
        <div className="relative overflow-hidden border-t border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/60 via-black to-black" />
          <Container>
            <div className="relative py-20 text-center flex flex-col items-center gap-6">
              <h2 className="text-3xl font-semibold tracking-tight max-w-xl">
                Ready to explore Tide business finance?
              </h2>
              <Link
                href="/contact?service=tide-business-loan"
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
