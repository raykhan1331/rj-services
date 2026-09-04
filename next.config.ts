import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  async redirects() {
    // These topics already have comprehensive, tested pages (Steps 8 & 9).
    // Redirecting the older single-topic stubs into them avoids duplicate/
    // thin content and consolidates SEO authority onto the stronger page.
    return [
      { source: "/services/ebay", destination: "/services/ecommerce", permanent: true },
      { source: "/services/shopify", destination: "/services/ecommerce", permanent: true },
      { source: "/services/google-adsense", destination: "/services/digital-services", permanent: true },
      { source: "/services/digital-marketing", destination: "/services/digital-services", permanent: true },
    ];
  },
};

export default nextConfig;
