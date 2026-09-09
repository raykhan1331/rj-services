import { DEDUCTION } from "../score";
import type { SeoIssue, SeoIssueType, TechnicalScoreFactor, TechnicalSeoScore } from "../types";

// STEP 5 Task 3 — a dedicated, transparent 0-100 "Technical SEO score"
// over the ten factors Task 3 names, computed from the SAME SeoIssue[]
// the crawler/checks already produced (pageChecks.ts, technicalChecks.ts)
// — this is a different LENS on existing detections, not a second
// detection pass. Reuses score.ts's exact per-severity DEDUCTION table so
// this score and the six-category overall score never disagree about how
// much one critical/warning/opportunity issue is "worth".

const FACTORS: { factor: string; types: SeoIssueType[]; explain: string }[] = [
  { factor: "crawlability", types: ["fetch-failed", "http-error"], explain: "pages failing to load or returning an HTTP error" },
  { factor: "indexability", types: ["noindex-meta", "robots-disallow-all"], explain: "pages or the whole site blocked from indexing" },
  { factor: "sitemap health", types: ["sitemap-unreachable", "sitemap-empty", "sitemap-origin-mismatch"], explain: "sitemap.xml reachability and accuracy" },
  { factor: "robots health", types: ["robots-unreachable", "robots-missing-sitemap-ref", "robots-sitemap-origin-mismatch", "robots-invalid-sitemap-url"], explain: "robots.txt reachability and configuration" },
  { factor: "canonical health", types: ["missing-canonical", "canonical-origin-mismatch", "canonical-target-invalid", "canonical-points-elsewhere"], explain: "canonical tag presence and correctness" },
  { factor: "metadata completeness", types: ["missing-title", "title-length", "missing-meta-description", "meta-description-length", "missing-og-metadata", "duplicate-title", "duplicate-meta-description"], explain: "title/description/Open Graph metadata coverage and quality" },
  { factor: "heading structure", types: ["missing-h1", "multiple-h1", "no-subheadings", "heading-hierarchy-skip"], explain: "H1/H2/H3 heading hierarchy correctness" },
  { factor: "link health", types: ["low-internal-links", "orphan-page", "broken-internal-link", "insecure-external-link", "redirect-broken", "redirect-target-mismatch"], explain: "internal linking, broken links, and redirect health" },
  { factor: "image accessibility", types: ["missing-alt-text"], explain: "images missing descriptive alt text" },
  { factor: "structured-data availability", types: ["no-structured-data"], explain: "JSON-LD structured data coverage" },
];

const WEIGHT_PER_FACTOR = 10; // 10 factors × 10 = 100

export function computeTechnicalSeoScore(allIssues: SeoIssue[]): TechnicalSeoScore {
  const factors: TechnicalScoreFactor[] = FACTORS.map(({ factor, types, explain }) => {
    const matching = allIssues.filter((i) => types.includes(i.type));
    const deduction = matching.reduce((sum, i) => sum + DEDUCTION[i.severity], 0) / 10; // scale the 100-point deduction table down to this factor's 10-point scale
    const contribution = Math.max(0, Math.round(WEIGHT_PER_FACTOR - deduction));
    const critical = matching.filter((m) => m.severity === "critical").length;
    const warning = matching.filter((m) => m.severity === "warning").length;
    const opportunity = matching.filter((m) => m.severity === "opportunity").length;
    const explanation =
      matching.length === 0
        ? `No issues detected for ${explain}.`
        : `${matching.length} issue(s) detected for ${explain} (${critical} critical, ${warning} warning, ${opportunity} opportunity).`;
    return { factor, weight: WEIGHT_PER_FACTOR, contribution, explanation };
  });

  const score = factors.reduce((sum, f) => sum + f.contribution, 0);
  return { score: Math.max(0, Math.min(100, score)), factors };
}
