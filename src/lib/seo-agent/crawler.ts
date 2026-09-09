import { LIVE_ROUTES, SEO_CONFIG, type SeoRoute } from "./config";
import { fetchAndParsePage } from "./fetchPage";
import type { PageRecord, ParsedPage } from "./types";

// STEP 2 Task 1 — the website crawler. Deliberately scoped to the site's
// OWN known routes (LIVE_ROUTES in config.ts), not a generic web crawler
// that follows arbitrary links — this never fetches an external site, and
// never discovers/visits a route that isn't already a real page in this
// project. That's what "do not crawl external websites unnecessarily" and
// "do not invent routes" mean in practice here.

export interface CrawledPage {
  route: SeoRoute;
  parsed: ParsedPage;
}

/** Fetches and parses every live route. This is the one place page HTML
 * is actually fetched — runAudit.ts and any future caller should go
 * through this rather than calling fetchAndParsePage directly, so there
 * is a single, auditable definition of "what the crawler visits". */
export async function crawlSite(baseUrl: string = SEO_CONFIG.siteUrl): Promise<CrawledPage[]> {
  return Promise.all(
    LIVE_ROUTES.map(async (route) => ({
      route,
      parsed: await fetchAndParsePage(`${baseUrl}${route.path}`),
    }))
  );
}

/** Converts one crawled page into the persisted PageRecord shape
 * (Task 2's Page data model). */
export function toPageRecord(crawled: CrawledPage): PageRecord {
  const { route, parsed } = crawled;
  const imagesWithoutAlt = parsed.images.filter((img) => !img.alt || img.alt.trim() === "");
  return {
    url: parsed.url,
    path: route.path,
    kind: route.kind,
    httpStatus: parsed.httpStatus,
    title: parsed.title,
    description: parsed.metaDescription,
    canonical: parsed.canonical,
    headings: {
      h1Count: parsed.h1s.length,
      h2Count: parsed.h2s.length,
      h3Count: parsed.h3s.length,
      h1s: parsed.h1s,
      h2s: parsed.h2s,
      h3s: parsed.h3s,
    },
    content: { wordCount: parsed.wordCount },
    images: { total: parsed.images.length, missingAlt: imagesWithoutAlt.length },
    links: { internal: parsed.internalLinks.length, external: parsed.externalLinks.length },
    schema: { types: parsed.jsonLdTypes },
    openGraph: { title: parsed.ogTitle, description: parsed.ogDescription, url: parsed.ogUrl },
    indexability: {
      indexable: !(parsed.robotsMeta && /noindex/i.test(parsed.robotsMeta)),
      robotsMeta: parsed.robotsMeta,
    },
    lastScannedAt: new Date().toISOString(),
  };
}
