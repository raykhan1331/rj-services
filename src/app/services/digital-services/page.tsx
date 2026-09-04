import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { SectionHeading } from "@/components/home/Section";
import Reveal from "@/components/home/Reveal";
import BusinessImageCard from "@/components/media/BusinessImageCard";
import { MEDIA } from "@/lib/media";
import {
  IconChecklist,
  IconDocument,
  IconShield,
  IconAd,
  IconSearch,
  IconShare,
  IconMegaphone,
  IconTarget,
  IconGear,
  IconBag,
} from "@/components/home/icons";

export const metadata: Metadata = {
  title: "Digital Services — Google AdSense & Digital Marketing",
  description:
    "Google AdSense readiness and application guidance, plus SEO, social media, paid advertising, and e-commerce marketing services from RJ Services.",
  alternates: { canonical: "/services/digital-services" },
};

const adsenseFeatures = [
  { icon: <IconChecklist />, title: "Website Readiness", description: "Review your site's structure and content so it's ready to be considered for AdSense." },
  { icon: <IconDocument />, title: "Application Guidance", description: "Step-by-step support preparing and submitting your AdSense application." },
  { icon: <IconShield />, title: "Policy/Readiness Review", description: "A check against Google's own AdSense policies before you apply." },
  { icon: <IconAd />, title: "Monetization Setup Assistance", description: "Help configuring ad units and placements once your account is approved." },
];

const marketingServices = [
  { icon: <IconSearch />, title: "SEO", description: "Improve your site's visibility in search results with on-page and technical SEO." },
  { icon: <IconShare />, title: "Social Media Marketing", description: "Build and grow your brand's presence across social platforms." },
  { icon: <IconDocument />, title: "Content Strategy", description: "Plan content that speaks to your audience and supports your goals." },
  { icon: <IconMegaphone />, title: "Paid Advertising", description: "Targeted ad campaigns designed around your budget and goals." },
  { icon: <IconTarget />, title: "Lead Generation", description: "Campaigns and funnels built to bring in qualified leads." },
  { icon: <IconGear />, title: "Website Optimization", description: "Improve site speed, usability, and conversion performance." },
  { icon: <IconBag />, title: "E-commerce Marketing", description: "Marketing strategies tailored to online stores and product sales." },
];

export default function DigitalServicesPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">Digital Services</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
            Grow Your Online Presence
          </h1>
          <p className="mt-5 text-zinc-400">
            From AdSense readiness to full digital marketing support, we help your business get
            discovered and grow online.
          </p>
        </div>
      </Container>

      <Reveal>
        <Container>
          <div className="pb-16 max-w-2xl mx-auto">
            <BusinessImageCard
              image={MEDIA.marketing}
              caption="Grow with a clear strategy"
              description="From AdSense readiness to targeted marketing campaigns."
            />
          </div>
        </Container>
      </Reveal>

      {/* Google AdSense Assistance */}
      <Reveal>
        <Container>
          <div className="pb-20">
            <SectionHeading eyebrow="Service 1" title="Google AdSense Assistance" />
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {adsenseFeatures.map((f) => (
                <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-amber-400/80 max-w-xl mx-auto">
              We never guarantee AdSense approval. Google independently reviews and approves every
              application based on its own policies.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/contact?service=google-adsense"
                className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-medium hover:opacity-90"
              >
                Enquire about AdSense Assistance
              </Link>
            </div>
          </div>
        </Container>
      </Reveal>

      {/* Digital Marketing */}
      <Reveal>
        <Container>
          <div className="pb-20">
            <SectionHeading eyebrow="Service 2" title="Digital Marketing" />
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {marketingServices.map((s) => (
                <div key={s.title} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.06] hover:border-white/20">
                  <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    {s.icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed flex-1">{s.description}</p>
                  <Link
                    href="/contact?service=digital-marketing"
                    className="mt-5 text-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10"
                  >
                    Enquire
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Reveal>
    </div>
  );
}
