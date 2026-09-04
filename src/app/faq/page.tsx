import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/home/Reveal";

export const metadata: Metadata = {
  title: "FAQ — UK Company Formation, Banking, KYC & E-commerce",
  description:
    "Answers to common questions about UK company formation, virtual addresses, bank account assistance, KYC, eBay and Shopify stores, AdSense, digital marketing, and business finance.",
  alternates: { canonical: "/faq" },
};

interface FaqItem {
  q: string;
  a: string;
}

interface FaqTopic {
  title: string;
  link: string;
  items: FaqItem[];
}

const TOPICS: FaqTopic[] = [
  {
    title: "UK Company Formation",
    link: "/services/uk-company-formation",
    items: [
      { q: "What do I need to register a UK company?", a: "A registered UK office address, at least one director, at least one shareholder, PSC details, a SIC code, and Companies House identity verification for each director." },
      { q: "Can I form a UK company from outside the UK?", a: "Yes — non-UK residents can be directors and shareholders, though the company still needs a UK registered office address." },
      { q: "Is company registration guaranteed?", a: "No. Companies House independently reviews and approves every registration; we can't guarantee approval." },
    ],
  },
  {
    title: "UK Virtual Addresses",
    link: "/services/virtual-addresses",
    items: [
      { q: "Can a virtual address be used as my registered office?", a: "Often yes, where the specific provider's terms support it — worth confirming directly with that provider." },
      { q: "Do I need a virtual address if I already have a UK office?", a: "No — a virtual address is only needed if you don't have a suitable UK address to register or correspond from." },
    ],
  },
  {
    title: "Bank Account Assistance",
    link: "/services/banking",
    items: [
      { q: "Do I need a UK company to open a bank account?", a: "It depends: personal accounts never require one, sole trader accounts usually don't, and limited-company business accounts normally do." },
      { q: "Can you guarantee my bank account will be approved?", a: "No. Approval always depends on the provider's own eligibility, verification, and compliance checks." },
      { q: "Which banks and providers do you work with?", a: "We assist with applications to providers including Lloyds, Halifax, Monzo, Taptap Send, Tide, Wise, and Zempler Bank." },
    ],
  },
  {
    title: "KYC Assistance",
    link: "/services/kyc-assistance",
    items: [
      { q: "What is KYC?", a: "Know Your Customer — the identity and business verification checks a provider runs before approving an account or application." },
      { q: "Is KYC verification guaranteed to pass?", a: "No. Verification is decided solely by the provider or authority carrying it out." },
    ],
  },
  {
    title: "eBay Stores",
    link: "/services/ecommerce",
    items: [
      { q: "What eBay services do you offer?", a: "Store setup, legitimate business store setup, configuration, listing setup, optimization, and management assistance — our primary e-commerce service." },
      { q: "Can you guarantee my eBay account will be approved?", a: "No. Account approval and seller eligibility checks are entirely eBay's own decision." },
    ],
  },
  {
    title: "Shopify Stores",
    link: "/services/ecommerce",
    items: [
      { q: "What Shopify services do you offer?", a: "Store setup, design, product setup, configuration, and basic optimization to help you launch a professional store." },
    ],
  },
  {
    title: "Google AdSense",
    link: "/services/digital-services",
    items: [
      { q: "Can you guarantee AdSense approval?", a: "No. Google independently reviews and approves every application based on its own policies. We help with website readiness, application guidance, and monetization setup." },
    ],
  },
  {
    title: "Digital Marketing",
    link: "/services/digital-services",
    items: [
      { q: "What digital marketing services do you offer?", a: "SEO, social media marketing, content strategy, paid advertising, lead generation, website optimization, and e-commerce marketing." },
    ],
  },
  {
    title: "Business Finance",
    link: "/services/tide-business-loan",
    items: [
      { q: "Can you guarantee my loan will be approved?", a: "No. Final lending decisions are made solely by the provider (e.g. Tide), based on their own eligibility criteria and assessment." },
      { q: "Who is eligible to apply?", a: "UK nationals and eligible UK residents/PR holders, where applicable — eligibility is ultimately set by the provider." },
    ],
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: TOPICS.flatMap((topic) =>
    topic.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    }))
  ),
};

export default function FaqPage() {
  return (
    <div className="bg-black text-white">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Container>
        <div className="py-20 sm:py-24 text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">FAQ</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-5 text-zinc-400">
            Answers about UK company formation, banking, KYC, e-commerce, and more. Can&apos;t find
            what you need? <Link href="/contact" className="text-white underline hover:no-underline">Contact us</Link>.
          </p>
        </div>
      </Container>

      <Reveal>
        <Container>
          <div className="pb-24 max-w-3xl mx-auto flex flex-col gap-14">
            {TOPICS.map((topic) => (
              <section key={topic.title} aria-labelledby={topic.title.replace(/\s+/g, "-").toLowerCase()}>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 id={topic.title.replace(/\s+/g, "-").toLowerCase()} className="text-2xl font-semibold text-white">
                    {topic.title}
                  </h2>
                  <Link href={topic.link} className="text-sm text-zinc-400 hover:text-white shrink-0">
                    Learn more &rarr;
                  </Link>
                </div>
                <div className="mt-4 divide-y divide-white/10 border-t border-white/10">
                  {topic.items.map((item) => (
                    <details key={item.q} className="group py-4">
                      <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-white">
                        {item.q}
                        <span className="text-zinc-500 group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Container>
      </Reveal>
    </div>
  );
}
