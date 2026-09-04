// Central media asset configuration — single source of truth for every
// real photo used across the site. Each entry points at an actual file
// under public/media/. Do not hard-code image paths anywhere else;
// import from here so every usage stays in sync.
//
// Source: licensed photography from Unsplash (free for commercial and
// non-commercial use under the Unsplash License, no permission required:
// https://unsplash.com/license). No stock screenshots, no fabricated
// bank branding, no copyrighted logos.

export interface MediaAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const MEDIA = {
  homepageHero: {
    src: "/media/business/entrepreneur-laptop.webp",
    alt: "Entrepreneur working on a laptop",
    width: 1600,
    height: 1067,
  },
  banking: {
    src: "/media/banking/uk-business-banking.webp",
    alt: "UK business banking district street scene",
    width: 1600,
    height: 1067,
  },
  companyFormation: {
    src: "/media/company-formation/company-registration.webp",
    alt: "Modern office workspace for UK company formation",
    width: 1600,
    height: 1068,
  },
  kyc: {
    src: "/media/kyc/identity-verification.webp",
    alt: "Passport and identity documents for KYC verification",
    width: 1600,
    height: 1067,
  },
  ecommerce: {
    src: "/media/ecommerce/online-store.webp",
    alt: "Handing over a packaged online store order",
    width: 1600,
    height: 2000,
  },
  marketing: {
    src: "/media/marketing/digital-marketing.webp",
    alt: "Laptop displaying digital marketing analytics dashboard",
    width: 1600,
    height: 2400,
  },
  consultation: {
    src: "/media/business/business-consultation.webp",
    alt: "Business consultation meeting with laptop and notes",
    width: 1600,
    height: 1067,
  },
  virtualAddresses: {
    src: "/media/business/virtual-address-office.webp",
    alt: "Premium modern office building lobby and corridor",
    width: 1600,
    height: 1200,
  },
  ebay: {
    src: "/media/ecommerce/ebay-marketplace.webp",
    alt: "Warehouse aisle stocked with packaged marketplace inventory",
    width: 1600,
    height: 2133,
  },
  shopify: {
    src: "/media/ecommerce/shopify-storefront.webp",
    alt: "Laptop displaying an online storefront product marketplace",
    width: 1600,
    height: 1067,
  },
  googleAdsense: {
    src: "/media/marketing/google-adsense.webp",
    alt: "Close-up of advertising performance metrics on a screen",
    width: 1600,
    height: 1152,
  },
} as const satisfies Record<string, MediaAsset>;

export type MediaKey = keyof typeof MEDIA;

// Short (4s, muted, no-audio) hover-preview clips for the homepage service
// cards. Each is loaded on demand — see BusinessImageCard's preload="none" —
// so they are never fetched until a card is actually hovered/tapped.
export const SERVICE_VIDEOS: Partial<Record<MediaKey, string>> = {
  banking: "/media/video/services/banking-preview.mp4",
  companyFormation: "/media/video/services/company-formation-preview.mp4",
  virtualAddresses: "/media/video/services/virtual-address-preview.mp4",
  kyc: "/media/video/services/kyc-preview.mp4",
  ebay: "/media/video/services/ebay-preview.mp4",
  shopify: "/media/video/services/shopify-preview.mp4",
  googleAdsense: "/media/video/services/adsense-preview.mp4",
  marketing: "/media/video/services/digital-marketing-preview.mp4",
};
