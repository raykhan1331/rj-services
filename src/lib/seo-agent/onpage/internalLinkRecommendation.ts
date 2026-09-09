import { keywordOverlap, pageRelevanceText } from "../keywords/relevance";
import type { CrawledPage } from "../crawler";
import type { SeoIssue } from "../types";

// STEP 6 Task 6 — internal-link recommendations, computed from the SAME
// in-memory crawl runAudit.ts already performed (CrawledPage[] still has
// each page's real internalLinks target list — the persisted PageRecord
// only keeps a count, which isn't enough to compute INBOUND links across
// pages, so this must run alongside the crawl, not from stored data).
//
// Bounded to at most one recommendation per under-linked important page,
// each requiring genuine topical overlap with a candidate source page —
// never proposes a link just to hit a quota, and never proposes hundreds.

const MIN_INBOUND_LINKS_FOR_IMPORTANT_PAGE = 2;
const MIN_RELEVANCE_TO_RECOMMEND = 0.15;

function normalizePath(p: string): string {
  const stripped = p.split("?")[0].split("#")[0];
  return stripped.length > 1 && stripped.endsWith("/") ? stripped.slice(0, -1) : stripped || "/";
}

export function recommendInternalLinks(crawled: CrawledPage[]): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Pages that failed to fetch have no real title/H1/links — including
  // them would degrade relevance scoring to a path-only comparison (every
  // /services/* page would spuriously "match" via the shared path
  // segment) and could recommend a fallback anchor built from a URL
  // rather than real content. Excluded from both candidates and targets.
  const fetchable = crawled.filter((c) => !c.parsed.fetchError);

  const inboundCount = new Map<string, number>();
  for (const { parsed } of fetchable) {
    for (const link of parsed.internalLinks) {
      const path = normalizePath(link);
      inboundCount.set(path, (inboundCount.get(path) ?? 0) + 1);
    }
  }

  const importantPages = fetchable.filter((c) => c.route.kind === "service" || c.route.kind === "hub");

  for (const target of importantPages) {
    const targetPath = normalizePath(target.route.path);
    const inbound = inboundCount.get(targetPath) ?? 0;
    if (inbound >= MIN_INBOUND_LINKS_FOR_IMPORTANT_PAGE) continue;

    const targetText = pageRelevanceText({ title: target.parsed.title, h1s: target.parsed.h1s, path: target.route.path });
    const candidates = crawled
      .filter((c) => normalizePath(c.route.path) !== targetPath)
      .filter((c) => !c.parsed.internalLinks.map(normalizePath).includes(targetPath))
      .map((c) => ({ page: c, score: keywordOverlap(pageRelevanceText({ title: c.parsed.title, h1s: c.parsed.h1s, path: c.route.path }), targetText) }))
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best || best.score < MIN_RELEVANCE_TO_RECOMMEND) continue; // no genuinely relevant candidate — don't force an unnatural link

    const anchorText = target.parsed.h1s[0] ?? target.route.path.replace(/[-/]/g, " ").trim();

    issues.push({
      type: "internal-link-recommendation",
      source: "audit",
      severity: inbound === 0 ? "warning" : "opportunity",
      category: "internal-linking",
      page: best.page.route.path,
      message: `Consider adding a natural internal link from ${best.page.route.path} to ${target.route.path} — ${target.route.path} currently has only ${inbound} inbound link(s) from other audited pages.`,
      evidence: `Topical overlap between the two pages: ${(best.score * 100).toFixed(0)}%.`,
      recommendedValue: anchorText,
      linkTarget: target.route.path,
      evidenceBasis: "on-page-only",
    });
  }

  return issues;
}
