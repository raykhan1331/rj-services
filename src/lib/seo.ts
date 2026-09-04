// Shared SEO config. SITE_URL has no real production domain yet — it
// defaults to localhost so metadata/sitemap/OG URLs are still valid during
// development, and resolves correctly once NEXT_PUBLIC_SITE_URL is set to
// the real domain after deployment. Never hardcode a guessed domain here.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";

export const SITE_NAME = "RJ Services";

export const DEFAULT_KEYWORDS = [
  "UK company formation",
  "UK business services",
  "UK virtual address",
  "business setup assistance",
  "e-commerce services",
  "UK bank account assistance",
  "Pakistan business services",
];
