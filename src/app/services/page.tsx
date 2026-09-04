import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import { SectionHeading } from "@/components/home/Section";
import ServiceCard from "@/components/services/ServiceCard";
import {
  IconBank,
  IconBuilding,
  IconMapPin,
  IconShield,
  IconBag,
  IconStore,
  IconAd,
  IconMegaphone,
  IconChecklist,
  IconUsers,
} from "@/components/home/icons";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Explore RJ Services' full range of UK business services: banking, company formation, virtual addresses, KYC, eBay, Shopify, AdSense, digital marketing, and more.",
  alternates: { canonical: "/services" },
};

const APPROVAL_NOTE =
  "Final approval depends on the provider's eligibility criteria, verification, and compliance checks. Approval is never guaranteed.";

const services = [
  {
    icon: <IconBank />,
    title: "UK Bank Account Assistance",
    description:
      "Guidance through the requirements for opening a business bank account, helping you prepare the right documentation for eligible providers.",
    href: "/services/banking",
    disclaimer: APPROVAL_NOTE,
  },
  {
    icon: <IconBuilding />,
    title: "UK Company Formation",
    description:
      "End-to-end support registering your UK company, from documentation to initial compliance basics.",
    href: "/services/uk-company-formation",
  },
  {
    icon: <IconMapPin />,
    title: "UK Business/Virtual Address",
    description:
      "A professional UK business address service to support your company's registration and correspondence.",
    href: "/services/virtual-addresses",
  },
  {
    icon: <IconShield />,
    title: "KYC Assistance",
    description:
      "Support preparing and organizing documentation required for identity and business verification.",
    href: "/services/kyc-assistance",
    disclaimer:
      "Verification outcomes are determined solely by the relevant provider or authority. Approval is never guaranteed.",
  },
  {
    icon: <IconBag />,
    title: "eBay Store Services",
    description: "Guidance to set up, optimize, and grow your presence on eBay marketplaces.",
    href: "/services/ebay",
  },
  {
    icon: <IconStore />,
    title: "Shopify Store Services",
    description: "Store setup, design, and configuration support to launch a professional Shopify store.",
    href: "/services/shopify",
  },
  {
    icon: <IconAd />,
    title: "Google AdSense Assistance",
    description: "Assistance preparing your site and content to apply for Google AdSense, in line with Google's policies.",
    href: "/services/google-adsense",
  },
  {
    icon: <IconMegaphone />,
    title: "Digital Marketing",
    description: "Targeted campaigns and strategy to help your brand reach the right audience.",
    href: "/services/digital-marketing",
  },
  {
    icon: <IconChecklist />,
    title: "Business Setup Assistance",
    description: "General guidance and coordination support to help you get your business up and running smoothly.",
    href: "/services/business-setup-assistance",
  },
  {
    icon: <IconUsers />,
    title: "Consultation",
    description: "Book a consultation to discuss your specific business needs and get tailored guidance from our team.",
    href: "/services/consultation",
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24">
          <SectionHeading
            level="h1"
            eyebrow="What we offer"
            title="Our Services"
            subtitle="Practical support across banking, company formation, e-commerce, and growth — tailored to your business."
          />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <ServiceCard key={s.href} {...s} />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
