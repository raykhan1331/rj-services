import type { CrawledPage } from "../crawler";
import type { LinkGraphSummary, SeoIssue } from "../types";

// STEP 7 Task 5 — analyzes REAL anchor text captured by STEP 7's
// htmlParser.ts extension (no invented text). Limited to two structural,
// high-confidence checks: an exact-match blocklist for generic anchors,
// and genuinely empty anchor text. An earlier version also flagged
// "anchor shares zero wording with the destination's title/H1", but live
// testing found it firing on false positives like "View all FAQs" -> a
// page titled "FAQ" (exact-token matching has no plural/stemming
// awareness, so "FAQs" != "FAQ"). Removed rather than patched — the exact
// class of over-confident heuristic mistake already found and fixed once
// this session in headingRecommendation.ts; better to under-detect than
// recommend against a link that's actually fine.

const GENERIC_ANCHORS = new Set(["click here", "here", "read more", "learn more", "more", "this page", "link", "more info", "click", "go", "see more", "details"]);
const MIN_REPEATED_TARGETS = 3; // same anchor text pointing at 3+ distinct pages = likely templated/unnatural reuse

function normalizePath(p: string): string {
  const stripped = p.split("?")[0].split("#")[0];
  return stripped.length > 1 && stripped.endsWith("/") ? stripped.slice(0, -1) : stripped || "/";
}

export function analyzeAnchorTextQuality(graph: LinkGraphSummary, crawled: CrawledPage[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const pageByPath = new Map(crawled.map((c) => [normalizePath(c.route.path), c]));

  // Flatten edges into individual (source, target, anchorText) triples —
  // an edge can carry multiple distinct anchor texts.
  const links = graph.edges.flatMap((e) => e.anchorTexts.map((anchorText) => ({ source: e.source, target: e.target, anchorText })));

  for (const { source, target, anchorText } of links) {
    const trimmed = anchorText.trim();
    const targetPage = pageByPath.get(target);
    const targetLabel = targetPage?.parsed.h1s[0] ?? targetPage?.parsed.title?.split(" | ")[0]?.trim() ?? target.replace(/[-/]/g, " ").trim();

    if (!trimmed) {
      issues.push({
        type: "weak-anchor-text",
        source: "audit",
        severity: "opportunity",
        category: "internal-linking",
        page: source,
        linkTarget: target,
        message: `A link from ${source} to ${target} has no visible anchor text (may be an icon-only link — decorative links can appropriately have none; verify this one is intentional).`,
        evidence: "(empty anchor text)",
        recommendedValue: targetLabel,
        evidenceBasis: "on-page-only",
      });
      continue;
    }

    if (GENERIC_ANCHORS.has(trimmed.toLowerCase())) {
      issues.push({
        type: "weak-anchor-text",
        source: "audit",
        severity: "opportunity",
        category: "internal-linking",
        page: source,
        linkTarget: target,
        message: `A link from ${source} to ${target} uses generic anchor text ("${trimmed}") that doesn't describe the destination.`,
        evidence: trimmed,
        recommendedValue: targetLabel,
        evidenceBasis: "on-page-only",
      });
    }
  }

  // Repeated unnatural anchors: the same anchor text used across many
  // distinct targets — one consolidated issue per offending anchor text,
  // not one per occurrence.
  const targetsByAnchor = new Map<string, Set<string>>();
  const firstSourceByAnchor = new Map<string, string>();
  for (const { source, target, anchorText } of links) {
    const key = anchorText.trim().toLowerCase();
    if (!key || GENERIC_ANCHORS.has(key)) continue; // already covered above
    const set = targetsByAnchor.get(key) ?? new Set<string>();
    set.add(target);
    targetsByAnchor.set(key, set);
    if (!firstSourceByAnchor.has(key)) firstSourceByAnchor.set(key, source);
  }
  for (const [anchor, targets] of targetsByAnchor) {
    if (targets.size < MIN_REPEATED_TARGETS) continue;
    issues.push({
      type: "weak-anchor-text",
      source: "audit",
      severity: "opportunity",
      category: "internal-linking",
      page: firstSourceByAnchor.get(anchor),
      message: `The exact anchor text "${anchor}" is reused across ${targets.size} different destination pages — natural, page-specific anchor text usually helps both users and search engines more than one repeated phrase.`,
      evidence: Array.from(targets).slice(0, 6).join(", "),
      evidenceBasis: "on-page-only",
    });
  }

  return issues;
}
