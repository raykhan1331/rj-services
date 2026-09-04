import Link from "next/link";
import Container from "@/components/layout/Container";
import Logo from "@/components/Logo";
import Reveal from "@/components/home/Reveal";
import { SectionHeading, ServiceCard, FeatureRow } from "@/components/home/Section";
import BusinessImageCard from "@/components/media/BusinessImageCard";
import HeroHoverVideo from "@/components/media/HeroHoverVideo";
import ProviderLogoCard from "@/components/media/ProviderLogoCard";
import StatisticsSection from "@/components/media/StatisticsSection";
import VideoShowcase from "@/components/media/VideoShowcase";
import { MEDIA, SERVICE_VIDEOS } from "@/lib/media";
import { PROVIDERS } from "@/lib/providers";
import {
  IconBank,
  IconBuilding,
  IconMapPin,
  IconShield,
  IconBag,
  IconStore,
  IconMegaphone,
  IconBot,
  IconAd,
  IconArrowRight,
} from "@/components/home/icons";

const overviewServices = [
  { icon: <IconBank />, title: "Banking", description: "Guidance to access business-friendly banking solutions.", href: "/services/banking" },
  { icon: <IconBuilding />, title: "UK Company Formation", description: "Register and structure your UK company with confidence.", href: "/services/uk-company-formation" },
  { icon: <IconMapPin />, title: "Virtual Addresses", description: "Professional UK business addresses for your company.", href: "/services/virtual-addresses" },
  { icon: <IconShield />, title: "KYC Assistance", description: "Support preparing documentation for verification checks.", href: "/services/kyc-assistance" },
  { icon: <IconBag />, title: "eBay", description: "Set up and grow your presence on eBay marketplaces.", href: "/services/ebay" },
  { icon: <IconStore />, title: "Shopify", description: "Launch and manage a professional Shopify storefront.", href: "/services/shopify" },
  { icon: <IconAd />, title: "Google AdSense", description: "Guidance on setting up and approving AdSense accounts.", href: "/services/google-adsense" },
  { icon: <IconMegaphone />, title: "Digital Marketing", description: "Grow your brand with targeted digital marketing support.", href: "/services/digital-marketing" },
];

const faqs = [
  { q: "What countries does RJ Services support?", a: "We primarily support clients in the United Kingdom and Pakistan, with services designed for international business owners." },
  { q: "Can you help if I'm just starting my company?", a: "Yes. We guide first-time business owners through formation, banking, and account setup step by step." },
  { q: "Do you offer ongoing support after setup?", a: "Yes, our team remains available to assist as your business and requirements grow." },
];

export default function Home() {
  return (
    <div className="bg-black text-white">
      {/* 1. Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/60 via-black to-black" />
        <Container>
          <div className="relative py-24 sm:py-32 flex flex-col items-center text-center gap-8">
            <Logo size="lg" />
            <h1 className="max-w-3xl text-4xl sm:text-6xl font-semibold tracking-tight">
              Global Business Solutions, Simplified
            </h1>
            <p className="max-w-xl text-lg text-zinc-400">
              Banking, UK company formation, virtual addresses, and e-commerce
              growth support &mdash; built for entrepreneurs across the UK and
              Pakistan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/services"
                className="rounded-full bg-white text-black px-7 py-3 text-sm font-medium hover:opacity-90"
              >
                Explore Services
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-white/20 px-7 py-3 text-sm font-medium hover:bg-white/10"
              >
                Contact Us
              </Link>
            </div>
            <HeroHoverVideo
              image={MEDIA.banking}
              videoSrc="/media/video/rj-services-hero-preview.mp4"
            />
          </div>
        </Container>
      </section>

      {/* 2. Introduction */}
      <Reveal>
        <Container>
          <div className="py-16 max-w-2xl mx-auto text-center">
            <p className="text-lg text-zinc-300 leading-relaxed">
              RJ Services helps entrepreneurs and businesses access banking,
              company formation, and digital growth solutions with clarity and
              confidence &mdash; from opening a UK company to scaling an
              online store.
            </p>
          </div>
        </Container>
      </Reveal>

      {/* 2b. Business imagery */}
      <Reveal>
        <Container>
          <div className="pb-16 grid grid-cols-2 lg:grid-cols-4 gap-5">
            <BusinessImageCard
              image={MEDIA.banking}
              video={SERVICE_VIDEOS.banking}
              caption="Banking"
              description="Guidance through UK personal and business account applications."
            />
            <BusinessImageCard
              image={MEDIA.companyFormation}
              video={SERVICE_VIDEOS.companyFormation}
              caption="UK Company Formation"
              description="Register and structure your UK company correctly."
            />
            <BusinessImageCard
              image={MEDIA.virtualAddresses}
              video={SERVICE_VIDEOS.virtualAddresses}
              caption="Virtual Addresses"
              description="A professional UK business address for your company."
            />
            <BusinessImageCard
              image={MEDIA.kyc}
              video={SERVICE_VIDEOS.kyc}
              caption="KYC Assistance"
              description="Get your documents organised for verification checks."
            />
            <BusinessImageCard
              image={MEDIA.ebay}
              video={SERVICE_VIDEOS.ebay}
              caption="eBay"
              description="Set up and grow your presence on eBay marketplaces."
            />
            <BusinessImageCard
              image={MEDIA.shopify}
              video={SERVICE_VIDEOS.shopify}
              caption="Shopify"
              description="Launch and manage a professional Shopify storefront."
            />
            <BusinessImageCard
              image={MEDIA.googleAdsense}
              video={SERVICE_VIDEOS.googleAdsense}
              caption="Google AdSense"
              description="Guidance on setting up and approving AdSense accounts."
            />
            <BusinessImageCard
              image={MEDIA.marketing}
              video={SERVICE_VIDEOS.marketing}
              caption="Digital Marketing"
              description="Grow your brand with targeted digital marketing support."
            />
          </div>
        </Container>
      </Reveal>

      {/* 2c. Statistics */}
      <Reveal>
        <Container>
          <div className="pb-16 border-y border-white/10 py-14">
            <StatisticsSection />
          </div>
        </Container>
      </Reveal>

      {/* 2d. Banking providers */}
      <Reveal>
        <Container>
          <div className="pb-16">
            <SectionHeading
              eyebrow="Providers"
              title="Who we help you apply to"
              subtitle="We assist with applications to these UK banking and payment providers. We are not affiliated with, endorsed by, or partnered with them unless explicitly stated."
            />
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PROVIDERS.map((p) => (
                <ProviderLogoCard key={p.name} {...p} />
              ))}
            </div>
          </div>
        </Container>
      </Reveal>

      {/* 3. Main services overview */}
      <Reveal>
        <Container>
          <div className="py-16">
            <SectionHeading
              eyebrow="What we offer"
              title="Services built for global growth"
              subtitle="A complete set of business support services, in one place."
            />
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {overviewServices.map((s) => (
                <ServiceCard key={s.href} {...s} />
              ))}
            </div>
          </div>
        </Container>
      </Reveal>

      {/* 4-9. Feature spotlights */}
      <Reveal>
        <Container>
          <div className="py-10 divide-y divide-white/10">
            <FeatureRow
              icon={<IconBank className="w-full h-full" />}
              title="Banking Assistance"
              description="We guide you through the process of accessing business banking options suited to your company's needs."
              href="/services/banking"
            />
            <FeatureRow
              icon={<IconBuilding className="w-full h-full" />}
              title="UK Company Formation"
              description="From registration to compliance basics, we help you set up a UK company the right way."
              href="/services/uk-company-formation"
              reverse
            />
            <FeatureRow
              icon={<IconMapPin className="w-full h-full" />}
              title="Virtual Addresses"
              description="Present your business professionally with a UK virtual address service."
              href="/services/virtual-addresses"
            />
            <FeatureRow
              icon={<IconBag className="w-full h-full" />}
              title="eBay Services"
              description="Get support setting up, optimizing, and growing your eBay store."
              href="/services/ebay"
              reverse
            />
            <FeatureRow
              icon={<IconStore className="w-full h-full" />}
              title="Shopify Services"
              description="Launch a professional Shopify store built to convert visitors into customers."
              href="/services/shopify"
            />
            <FeatureRow
              icon={<IconMegaphone className="w-full h-full" />}
              title="Digital Marketing"
              description="Reach the right audience with marketing support tailored to your business goals."
              href="/services/digital-marketing"
              reverse
            />
          </div>
        </Container>
      </Reveal>

      {/* 9b. Video / motion showcase */}
      <Reveal>
        <Container>
          <div className="pb-20">
            <VideoShowcase
              sources={[{ src: "/media/video/rj-business-showcase.mp4", type: "video/mp4" }]}
              poster="/media/video/rj-business-showcase-poster.webp"
            />
          </div>
        </Container>
      </Reveal>

      {/* 10. AI Assistant */}
      <Reveal>
        <Container>
          <div className="py-20 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-6 sm:px-12 text-center flex flex-col items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <IconBot className="w-7 h-7" />
            </div>
            <SectionHeading
              eyebrow="Always available"
              title="Meet the RJ AI Assistant"
              subtitle="Get instant answers about our services, guided step by step, any time you need."
            />
            <Link
              href="/ai-assistant"
              className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-7 py-3 text-sm font-medium hover:opacity-90"
            >
              Try AI Assistant <IconArrowRight />
            </Link>
          </div>
        </Container>
      </Reveal>

      {/* 11. Locations */}
      <Reveal>
        <Container>
          <div className="py-16">
            <SectionHeading eyebrow="Where we operate" title="United Kingdom &amp; Pakistan" />
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {["United Kingdom", "Pakistan"].map((country) => (
                <div
                  key={country}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex items-start gap-4"
                >
                  <IconMapPin className="w-6 h-6 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white">{country}</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      Supporting clients and businesses across {country}.
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/locations" className="text-sm font-medium hover:opacity-70 inline-flex items-center gap-1.5">
                View locations <IconArrowRight />
              </Link>
            </div>
          </div>
        </Container>
      </Reveal>

      {/* 12. FAQ preview */}
      <Reveal>
        <Container>
          <div className="py-16 max-w-2xl mx-auto">
            <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
            <div className="mt-10 divide-y divide-white/10">
              {faqs.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-white">
                    {f.q}
                    <IconArrowRight className="w-4 h-4 rotate-90 transition-transform group-open:-rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/faq" className="text-sm font-medium hover:opacity-70 inline-flex items-center gap-1.5">
                View all FAQs <IconArrowRight />
              </Link>
            </div>
          </div>
        </Container>
      </Reveal>

      {/* 13. Contact CTA */}
      <Reveal>
        <div className="relative overflow-hidden border-t border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/60 via-black to-black" />
          <Container>
            <div className="relative py-24 text-center flex flex-col items-center gap-6">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-xl">
                Ready to grow your business globally?
              </h2>
              <p className="max-w-md text-zinc-400">
                Get in touch with our team and let&apos;s discuss how RJ Services can support you.
              </p>
              <Link
                href="/contact"
                className="rounded-full bg-white text-black px-8 py-3.5 text-sm font-medium hover:opacity-90"
              >
                Contact Us
              </Link>
            </div>
          </Container>
        </div>
      </Reveal>
    </div>
  );
}
