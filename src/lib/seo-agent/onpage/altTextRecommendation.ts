import { matchedService } from "./metadataRecommendation";
import type { CrawledPage } from "../crawler";
import type { SeoIssue } from "../types";

// STEP 6 Task 7 — alt-text recommendations derived ONLY from an image's
// own filename (cleaned into readable words) plus the page's real matched
// service for context — never a guess at visual content that can't be
// reliably determined from data this system actually has. Capped per page
// so this stays a recommendation generator, not a mass rewrite.

const MAX_RECOMMENDATIONS_PER_PAGE = 5;
const GENERIC_ALT_VALUES = new Set(["image", "photo", "picture", "img", "banner", "icon", "graphic"]);

function filenameToWords(src: string): string {
  const clean = src.split("?")[0].split("/").pop() ?? src;
  const withoutExt = clean.replace(/\.[a-z0-9]+$/i, "");
  const words = withoutExt.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  // A filename that's just digits/hashes (e.g. a CDN asset id) carries no
  // reliable meaning — honestly skip rather than recommend nonsense.
  return /[a-zA-Z]{2,}/.test(words) ? words : "";
}

export function recommendAltText(crawled: CrawledPage[]): SeoIssue[] {
  const issues: SeoIssue[] = [];

  for (const { route, parsed } of crawled) {
    const service = matchedService(route.path);
    const problems = parsed.images.filter((img) => {
      const alt = (img.alt ?? "").trim().toLowerCase();
      return !alt || GENERIC_ALT_VALUES.has(alt);
    });

    for (const img of problems.slice(0, MAX_RECOMMENDATIONS_PER_PAGE)) {
      const words = filenameToWords(img.src);
      if (!words) continue; // nothing reliably derivable — skip rather than invent a description
      const recommended = service ? `${words} — ${service.label}` : words;

      issues.push({
        type: "alt-text-recommendation",
        source: "audit",
        severity: "warning",
        category: "content",
        page: route.path,
        message: `Recommended alt text for an image on ${route.path}, derived from its filename — please verify it accurately describes the image before applying (decorative images may appropriately keep empty alt text instead).`,
        evidence: img.src,
        recommendedValue: recommended,
        evidenceBasis: "on-page-only",
      });
    }
  }

  return issues;
}
