import { SEO_CONFIG } from "../config";
import type { KeywordIntelligenceSummary, ParsedPage, SeoIssue } from "../types";

// STEP 6 Task 2/3 — title and meta description recommendations. Every
// recommended value is assembled ONLY from real, already-known facts:
// the page's own EXISTING title/description/H1/content snippet, its
// matched real service (SEO_CONFIG.primaryServices — sourced from
// src/lib/nav.ts, never invented), the site's real name, its real target
// countries, and (when available) a real Step 4 keyword-intelligence
// query for that exact page. Nothing here calls an AI model or invents a
// claim.
//
// Deliberately triggers ONLY on the objectively-detectable existing
// issues (missing / wrong length / duplicate — all already reliably
// flagged by pageChecks.ts) rather than a word-overlap "does this title
// match the topic" heuristic: this site's real titles/H1s are often
// deliberately written in natural, benefit-driven language ("Talk to Us
// Before You Decide") rather than literal keyword labels, and a simple
// token-overlap check can't tell that apart from a genuine mismatch —
// recommending a bland keyword-only replacement for good natural copy
// would be a real quality regression (Task 16: never optimize at the
// expense of users). Where a real existing value already exists, these
// functions EXTEND or TRIM it rather than replacing it wholesale, so
// genuine existing content/keyword equity isn't discarded.

export interface OnPageContext {
  path: string;
  parsed: ParsedPage;
  existingIssueTypes: Set<string>;
}

export function matchedService(path: string): { label: string; href: string } | null {
  return SEO_CONFIG.primaryServices.find((s) => s.href === path) ?? null;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  // Prefer dropping a trailing " | <site name>" suffix wholesale rather
  // than cutting mid-word through it — a truncated site-name suffix
  // ("...| RJ…") reads as broken, not just shortened.
  const suffixMatch = text.match(/ \| .+$/);
  if (suffixMatch && text.length - suffixMatch[0].length <= max) {
    return text.slice(0, text.length - suffixMatch[0].length).trimEnd();
  }
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const boundary = lastSpace > max * 0.6 ? lastSpace : cut.length; // only break on a word boundary if it isn't too far back
  return text.slice(0, boundary).trimEnd() + "…";
}

function findQueryForPage(path: string, keywordSummary: KeywordIntelligenceSummary) {
  return keywordSummary.topQueries.find((q) => q.page === path) ?? keywordSummary.highestImpressionQueries.find((q) => q.page === path) ?? null;
}

export function recommendTitle(ctx: OnPageContext, keywordSummary: KeywordIntelligenceSummary): SeoIssue | null {
  const rules = SEO_CONFIG.rules.title;
  const hasMissing = ctx.existingIssueTypes.has("missing-title");
  const hasLength = ctx.existingIssueTypes.has("title-length");
  const hasDuplicate = ctx.existingIssueTypes.has("duplicate-title");
  if (!hasMissing && !hasLength && !hasDuplicate) return null;

  const h1 = ctx.parsed.h1s[0] ?? null;
  const service = matchedService(ctx.path);
  const current = ctx.parsed.title;
  const fallbackSubject = service?.label ?? h1 ?? SEO_CONFIG.siteName;

  let recommended: string;
  if (hasMissing || !current) {
    recommended = truncate(`${fallbackSubject} | ${SEO_CONFIG.siteName}`, rules.idealMax);
  } else if (current.length > rules.idealMax) {
    recommended = truncate(current, rules.idealMax); // shorten the REAL existing title, don't replace it
  } else if (current.length < rules.idealMin) {
    recommended = truncate(`${current} — ${SEO_CONFIG.targetCountries.join(" & ")}`, rules.idealMax);
  } else if (hasDuplicate) {
    // Differentiate from the other page(s) sharing this title using the
    // real matched service/H1, only if not already present.
    recommended = current.toLowerCase().includes(fallbackSubject.toLowerCase()) ? current : truncate(`${current} — ${fallbackSubject}`, rules.idealMax);
  } else {
    recommended = current;
  }

  const query = findQueryForPage(ctx.path, keywordSummary);
  const usedGsc = Boolean(query) && keywordSummary.queriesAnalyzed > 0;
  if (query && !recommended.toLowerCase().includes(query.query.toLowerCase()) && recommended.length + query.query.length + 3 <= rules.idealMax) {
    recommended = `${recommended} — ${query.query}`;
  }

  if (current === recommended) return null; // already effectively fine — nothing to recommend

  const reasons: string[] = [];
  if (hasMissing) reasons.push("page has no <title>");
  if (hasLength) reasons.push("current title length is outside the recommended range");
  if (hasDuplicate) reasons.push("current title is duplicated across multiple pages");

  return {
    type: "title-recommendation",
    source: "audit",
    severity: hasMissing ? "critical" : "warning",
    category: "on-page",
    page: ctx.path,
    message: `Recommended title update for ${ctx.path}: ${reasons.join("; ")}.`,
    evidence: current ?? "(no title)",
    recommendedValue: recommended,
    evidenceBasis: usedGsc ? "gsc" : "on-page-only",
  };
}

export function recommendMetaDescription(ctx: OnPageContext, keywordSummary: KeywordIntelligenceSummary): SeoIssue | null {
  const rules = SEO_CONFIG.rules.metaDescription;
  const hasMissing = ctx.existingIssueTypes.has("missing-meta-description");
  const hasLength = ctx.existingIssueTypes.has("meta-description-length");
  const hasDuplicate = ctx.existingIssueTypes.has("duplicate-meta-description");
  if (!hasMissing && !hasLength && !hasDuplicate) return null;

  const current = ctx.parsed.metaDescription;
  const service = matchedService(ctx.path);
  const subject = service?.label ?? ctx.parsed.h1s[0] ?? SEO_CONFIG.siteName;

  let recommended: string;
  if (hasMissing || !current) {
    if (!ctx.parsed.contentSnippet) return null; // nothing real to ground a fresh description in — honestly skip rather than invent
    const snippetSentence = ctx.parsed.contentSnippet.split(/(?<=[.!?])\s/)[0] ?? ctx.parsed.contentSnippet;
    recommended = truncate(`${subject} — ${snippetSentence}`, rules.idealMax);
  } else if (current.length > rules.idealMax) {
    recommended = truncate(current, rules.idealMax); // shorten the REAL existing description, don't replace it
  } else if (current.length < rules.idealMin) {
    recommended = truncate(`${current} Serving clients across ${SEO_CONFIG.targetCountries.join(" & ")}.`, rules.idealMax);
  } else if (hasDuplicate && ctx.parsed.contentSnippet) {
    // Identical text on two pages can't be fixed by extending it — needs
    // genuinely different real content, so this is the one case that
    // rebuilds from the page's own real content snippet.
    const snippetSentence = ctx.parsed.contentSnippet.split(/(?<=[.!?])\s/)[0] ?? ctx.parsed.contentSnippet;
    recommended = truncate(`${subject} — ${snippetSentence}`, rules.idealMax);
  } else {
    recommended = current;
  }

  if (current === recommended) return null;

  const query = findQueryForPage(ctx.path, keywordSummary);
  const usedGsc = Boolean(query) && keywordSummary.queriesAnalyzed > 0;

  const reasons: string[] = [];
  if (hasMissing) reasons.push("page has no meta description");
  if (hasLength) reasons.push("current meta description length is outside the recommended range");
  if (hasDuplicate) reasons.push("current meta description is duplicated across multiple pages");

  return {
    type: "meta-description-recommendation",
    source: "audit",
    severity: hasMissing ? "warning" : "opportunity",
    category: "on-page",
    page: ctx.path,
    message: `Recommended meta description update for ${ctx.path}: ${reasons.join("; ")}.`,
    evidence: current ?? "(no meta description)",
    recommendedValue: recommended,
    evidenceBasis: usedGsc ? "gsc" : "on-page-only",
  };
}
