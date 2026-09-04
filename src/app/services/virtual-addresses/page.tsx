import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { SectionHeading } from "@/components/home/Section";
import Reveal from "@/components/home/Reveal";
import { IconMapPin, IconCheck } from "@/components/home/icons";

export const metadata: Metadata = {
  title: "UK Virtual Address Services",
  description:
    "A professional UK registered office or virtual business address for your company. RJ Services helps you choose and set up the right address service for correspondence and Companies House registration.",
  alternates: { canonical: "/services/virtual-addresses" },
};

const useCases = [
  { title: "Registered office address", text: "The official address your UK company is registered at with Companies House." },
  { title: "Business correspondence address", text: "A professional address for day-to-day mail, separate from your home or trading address." },
  { title: "Director's service address", text: "A private alternative to listing your home address on the public register." },
];

const faqs = [
  { q: "Can a virtual address be used as my registered office?", a: "Often yes, where the specific address provider's terms support it — this should be confirmed with that provider directly." },
  { q: "Do I need a virtual address to form a UK company?", a: "You need a UK registered office address, which a virtual address service can typically provide — it doesn't have to be where you actually work from." },
  { q: "Is a virtual address the same as a business bank account address?", a: "No, they're separate. Your bank will ask for its own proof of address requirements when you apply for an account." },
];

export default function VirtualAddressesPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <IconMapPin className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">Virtual Addresses</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            A Professional UK Business Address
          </h1>
          <p className="text-zinc-400">
            RJ Services helps you set up a UK registered office or virtual business address —
            whether you&apos;re forming a company or just need a professional presence in the UK.
          </p>
          <Link
            href="/contact?service=virtual-addresses"
            className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-medium hover:opacity-90"
          >
            Get a UK Virtual Address
          </Link>
        </div>
      </Container>

      <Reveal>
        <Container>
          <div className="pb-20">
            <SectionHeading eyebrow="How it's used" title="What a virtual address covers" />
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {useCases.map((u) => (
                <div key={u.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <IconCheck className="w-5 h-5 text-white" />
                  <h3 className="mt-4 font-semibold text-white">{u.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{u.text}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Reveal>

      <Reveal>
        <Container>
          <div className="pb-20 max-w-2xl mx-auto">
            <SectionHeading eyebrow="Questions" title="Virtual address FAQ" />
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
              Forming a company too?{" "}
              <Link href="/services/uk-company-formation" className="text-white underline hover:no-underline">
                See UK Company Formation
              </Link>
              .
            </p>
          </div>
        </Container>
      </Reveal>
    </div>
  );
}
