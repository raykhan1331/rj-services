import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { SectionHeading } from "@/components/home/Section";
import Reveal from "@/components/home/Reveal";
import { IconBuilding, IconCheck } from "@/components/home/icons";
import BusinessImageCard from "@/components/media/BusinessImageCard";
import { MEDIA } from "@/lib/media";

export const metadata: Metadata = {
  title: "UK Company Formation Services",
  description:
    "Register a UK limited company with confidence. RJ Services helps with company formation documents, registered address, director and PSC details, and Companies House identity verification.",
  alternates: { canonical: "/services/uk-company-formation" },
};

const checklist = [
  "A registered office address in the UK",
  "At least one director (an individual who can act as director or company secretary)",
  "At least one shareholder — who can also be a director — or a guarantor for a company limited by guarantee",
  "Details of anyone who qualifies as a Person with Significant Control (PSC)",
  "A SIC code describing what your company does",
  "Companies House identity verification for each director",
];

const faqs = [
  { q: "How long does UK company formation take?", a: "Timing depends on Companies House's own processing, which is outside our control. Online applications are typically reviewed faster than postal ones." },
  { q: "Can I form a UK company if I live outside the UK?", a: "Yes, non-UK residents can be directors and shareholders of a UK company, though the company still needs a UK registered office address." },
  { q: "Is approval guaranteed?", a: "No. Registration is reviewed and approved independently by Companies House, based on their own requirements — we cannot guarantee approval." },
];

export default function UkCompanyFormationPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <IconBuilding className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">UK Company Formation</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Register Your UK Company the Right Way
          </h1>
          <p className="text-zinc-400">
            RJ Services helps you prepare accurate company details and documentation for submission
            to Companies House — from your first registration through to identity verification.
          </p>
          <Link
            href="/contact?service=uk-company-formation"
            className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-medium hover:opacity-90"
          >
            Start Your Company Formation
          </Link>
        </div>
      </Container>

      <Reveal>
        <Container>
          <div className="pb-16 max-w-2xl mx-auto">
            <BusinessImageCard
              image={MEDIA.companyFormation}
              caption="Preparing your documentation"
              description="We help you get every detail right before submission to Companies House."
            />
          </div>
        </Container>
      </Reveal>

      <Reveal>
        <Container>
          <div className="pb-20">
            <SectionHeading eyebrow="What's involved" title="Company formation checklist" />
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {checklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <IconCheck className="w-5 h-5 shrink-0 text-white mt-0.5" />
                  <span className="text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-zinc-500 max-w-xl mx-auto">
              Registration is reviewed and approved independently by Companies House. We help you
              prepare everything accurately, but approval is never guaranteed.
            </p>
          </div>
        </Container>
      </Reveal>

      <Reveal>
        <Container>
          <div className="pb-20 max-w-2xl mx-auto">
            <SectionHeading eyebrow="Questions" title="Company formation FAQ" />
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
              Planning to open a bank account too?{" "}
              <Link href="/services/banking" className="text-white underline hover:no-underline">
                See our Banking Services
              </Link>{" "}
              or explore the combined{" "}
              <Link href="/services/uk-business-setup" className="text-white underline hover:no-underline">
                UK Business Setup
              </Link>{" "}
              package.
            </p>
          </div>
        </Container>
      </Reveal>
    </div>
  );
}
