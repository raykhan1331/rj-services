import { ALL_ROUTES, LIVE_ROUTES, REDIRECTED_ROUTES, type SeoRoute } from "./config";

// STEP 2 Task 3 — a grouped view of the site's actual routes, built
// entirely from LIVE_ROUTES/REDIRECTED_ROUTES in config.ts (which were
// themselves taken from the real nav.ts/next.config.ts registries in
// STEP 1). Nothing here is invented — this is a reshaping of data that
// already exists, for a future dashboard/map view to render directly.

export interface SeoMap {
  home: SeoRoute[];
  servicePages: SeoRoute[];
  locationPages: SeoRoute[];
  faqPages: SeoRoute[];
  contactPages: SeoRoute[];
  informational: SeoRoute[];
  redirects: SeoRoute[];
  totalLiveRoutes: number;
  totalRoutes: number;
}

export function buildSeoMap(): SeoMap {
  return {
    home: LIVE_ROUTES.filter((r) => r.kind === "home"),
    servicePages: LIVE_ROUTES.filter((r) => r.kind === "service" || r.kind === "hub"),
    locationPages: LIVE_ROUTES.filter((r) => r.kind === "location"),
    faqPages: LIVE_ROUTES.filter((r) => r.kind === "faq"),
    contactPages: LIVE_ROUTES.filter((r) => r.kind === "contact"),
    informational: LIVE_ROUTES.filter((r) => r.kind === "ai-assistant"),
    redirects: REDIRECTED_ROUTES,
    totalLiveRoutes: LIVE_ROUTES.length,
    totalRoutes: ALL_ROUTES.length,
  };
}
