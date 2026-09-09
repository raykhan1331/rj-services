import type { Metadata } from "next";
import SeoAgentDashboard from "@/components/seo-agent/SeoAgentDashboard";

// STEP 8 Task 10 — the SEO Agent's first visual dashboard page (Steps
// 1-7 were API-only admin tooling). Deliberately noindex/nofollow and
// not linked from any public nav — an internal tool, reachable only by
// direct URL, gated client-side by the same admin secret every other
// /api/seo-agent/* route already requires. Server component so this
// metadata override works; the actual interactive UI is the client
// component below.

export const metadata: Metadata = {
  title: "SEO Agent Dashboard",
  robots: { index: false, follow: false },
};

export default function SeoAgentPage() {
  return <SeoAgentDashboard />;
}
