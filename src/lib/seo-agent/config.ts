import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { servicesNav, mainNav } from "@/lib/nav";

// Central configuration for the SEO Agent. Every route/service listed here
// is taken from the site's actual nav/route registries (src/lib/nav.ts,
// next.config.ts redirects) — nothing here is invented. Update this file
// when real routes change; the audit and scoring modules read from it
// rather than hard-coding paths of their own.

export interface SeoRoute {
  path: string;
  /** What this route is for, so audit reports read clearly without guessing from the URL. */
  kind: "home" | "service" | "hub" | "location" | "contact" | "faq" | "ai-assistant" | "redirect";
  /** For redirects: the effective canonical destination this path resolves to. */
  redirectsTo?: string;
}

// Routes that currently render a real page (crawlable, should appear in
// the sitemap and be auditable for on-page/content quality).
export const LIVE_ROUTES: SeoRoute[] = [
  { path: "/", kind: "home" },
  { path: "/services", kind: "hub" },
  { path: "/services/banking", kind: "service" },
  { path: "/services/uk-company-formation", kind: "service" },
  { path: "/services/virtual-addresses", kind: "service" },
  { path: "/services/kyc-assistance", kind: "service" },
  { path: "/services/uk-business-setup", kind: "service" },
  { path: "/services/tide-business-loan", kind: "service" },
  { path: "/services/ecommerce", kind: "service" },
  { path: "/services/digital-services", kind: "service" },
  { path: "/services/business-setup-assistance", kind: "service" },
  { path: "/services/consultation", kind: "service" },
  { path: "/locations", kind: "location" },
  { path: "/ai-assistant", kind: "ai-assistant" },
  { path: "/contact", kind: "contact" },
  { path: "/faq", kind: "faq" },
];

// Routes that exist as files but permanently 308/301-redirect elsewhere
// (see next.config.ts). They must never be treated as missing/broken —
// the audit should recognise them as intentional redirects, not errors.
export const REDIRECTED_ROUTES: SeoRoute[] = [
  { path: "/services/ebay", kind: "redirect", redirectsTo: "/services/ecommerce" },
  { path: "/services/shopify", kind: "redirect", redirectsTo: "/services/ecommerce" },
  { path: "/services/google-adsense", kind: "redirect", redirectsTo: "/services/digital-services" },
  { path: "/services/digital-marketing", kind: "redirect", redirectsTo: "/services/digital-services" },
];

export const ALL_ROUTES: SeoRoute[] = [...LIVE_ROUTES, ...REDIRECTED_ROUTES];

// Routes that must NEVER be auto-deleted, auto-renamed, or have their URL
// changed by any future automation — every currently-live route, full stop.
// Redirect targets are protected implicitly since they're LIVE_ROUTES too.
export const PROTECTED_ROUTES: string[] = LIVE_ROUTES.map((r) => r.path);

export const SEO_CONFIG = {
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  targetCountries: ["United Kingdom", "Pakistan"] as const,
  primaryBusinessAreas: [
    "UK company formation",
    "UK & Pakistan business setup assistance",
    "UK personal & business banking assistance",
    "Virtual business addresses",
    "KYC / identity verification support",
    "E-commerce store setup (eBay, Shopify)",
    "Google AdSense readiness",
    "Digital marketing",
    "Business finance introductions",
  ],
  // Derived from the real services nav so this list can never drift from
  // what's actually on the site.
  primaryServices: servicesNav.map((s) => ({ label: s.label, href: s.href })),
  mainNavRoutes: mainNav.map((n) => n.href),
  routes: ALL_ROUTES,
  protectedRoutes: PROTECTED_ROUTES,

  // Rules the deterministic checks apply. Kept as data (not scattered
  // magic numbers) so scoring stays auditable and adjustable in one place.
  rules: {
    title: { minLength: 10, maxLength: 65, idealMin: 30, idealMax: 60 },
    metaDescription: { minLength: 50, maxLength: 165, idealMin: 70, idealMax: 160 },
    thinContentWordThreshold: 150,
    minInternalLinksPerPage: 2,
  },
} as const;

// Pages that must never be automatically deleted or have their content
// wiped, regardless of what a future automated "cleanup" pass suggests.
// Currently identical to protectedRoutes, kept as a separate export since
// its purpose (protection from deletion, not general "protection") is
// narrower and may diverge later.
export const NEVER_AUTO_DELETE: string[] = [...PROTECTED_ROUTES];

// Hard limits on what the SEO Agent is allowed to do without a human
// approving first. STEP 1 only reads/reports — nothing here is wired up
// to actually perform an action yet, but the rules are defined now so
// every future automation step must check against them.
export const SAFE_AUTOMATION_RULES = {
  neverWithoutApproval: [
    "Delete a page or route",
    "Delete or overwrite existing on-page content",
    "Change a URL/route path",
    "Create new pages in bulk",
    "Build, buy, or exchange backlinks",
    "Run automated Google search queries",
    "Keyword-stuff existing copy",
    "Copy or paraphrase competitor content",
    "Publish mass AI-generated content",
  ],
  requiresApproval: [
    "Any metadata change (title, description, canonical, OG tags)",
    "Any new structured data (JSON-LD) added to a page",
    "Any change to robots.txt or sitemap.xml behaviour",
    "Any new page creation, however small",
  ],
  alwaysAllowedAutonomously: [
    "Reading/crawling existing pages for audit purposes",
    "Computing SEO scores and reports",
    "Writing audit history/logs",
  ],
} as const;
