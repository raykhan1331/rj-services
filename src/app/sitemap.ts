import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "weekly" },
  { path: "/services/banking", priority: 0.9, changeFrequency: "monthly" },
  { path: "/services/uk-company-formation", priority: 0.9, changeFrequency: "monthly" },
  { path: "/services/virtual-addresses", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services/kyc-assistance", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services/uk-business-setup", priority: 0.9, changeFrequency: "monthly" },
  { path: "/services/tide-business-loan", priority: 0.7, changeFrequency: "monthly" },
  { path: "/services/ecommerce", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services/digital-services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services/business-setup-assistance", priority: 0.6, changeFrequency: "monthly" },
  { path: "/services/consultation", priority: 0.6, changeFrequency: "monthly" },
  { path: "/locations", priority: 0.6, changeFrequency: "monthly" },
  { path: "/ai-assistant", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
