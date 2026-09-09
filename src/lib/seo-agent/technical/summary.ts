import type { SeoAuditReport, ScanHistoryEntry, TechnicalChangeSummary, TechnicalSeoSummary } from "../types";

// STEP 5 Task 8/9 — builds the persisted TechnicalSeoSummary from a fresh
// SeoAuditReport (score.ts/technicalScore.ts's output) plus this run's
// change-detection result and the trailing scan-history window. Pure
// aggregation over data the audit already produced — no new detection.

const SCAN_HISTORY_WINDOW = 10;

const CANONICAL_ISSUE_TYPES = new Set(["missing-canonical", "canonical-origin-mismatch", "canonical-target-invalid", "canonical-points-elsewhere"]);
const CRAWLABILITY_ISSUE_TYPES = new Set(["fetch-failed", "http-error"]);
const INDEXABILITY_ISSUE_TYPES = new Set(["noindex-meta", "robots-disallow-all"]);

export function buildTechnicalSeoSummary(report: SeoAuditReport, changes: TechnicalChangeSummary, recentReports: SeoAuditReport[]): TechnicalSeoSummary {
  const allIssues = [...report.criticalIssues, ...report.warnings, ...report.opportunities];

  const pagesWithParsed = report.pages.filter((p) => p.parsed && !p.parsed.fetchError);
  const pagesWithFullMetadata = pagesWithParsed.filter((p) => p.parsed!.title && p.parsed!.metaDescription && p.parsed!.canonical);
  const pagesWithSchema = pagesWithParsed.filter((p) => p.parsed!.jsonLdTypes.length > 0);

  const scanHistory: ScanHistoryEntry[] = recentReports.slice(-SCAN_HISTORY_WINDOW).map((r) => ({
    generatedAt: r.generatedAt,
    pagesScanned: r.pagesAudited,
    issuesDetected: r.criticalIssues.length + r.warnings.length + r.opportunities.length,
    criticalCount: r.criticalIssues.length,
    warningCount: r.warnings.length,
    opportunityCount: r.opportunities.length,
    technicalScore: r.technicalScore?.score ?? 0,
    overallScore: r.score.overall,
  }));

  return {
    lastScanAt: report.generatedAt,
    pagesScanned: report.pagesAudited,
    technicalScore: report.technicalScore,
    crawlabilityOk: !allIssues.some((i) => CRAWLABILITY_ISSUE_TYPES.has(i.type)),
    indexabilityOk: !allIssues.some((i) => INDEXABILITY_ISSUE_TYPES.has(i.type)),
    sitemapOk: report.sitemap.reachable && report.sitemap.issues.length === 0,
    robotsOk: report.robots.reachable && report.robots.issues.length === 0,
    canonicalHealthy: !allIssues.some((i) => CANONICAL_ISSUE_TYPES.has(i.type)),
    brokenLinksCount: allIssues.filter((i) => i.type === "broken-internal-link").length,
    metadataCoveragePct: pagesWithParsed.length > 0 ? Math.round((pagesWithFullMetadata.length / pagesWithParsed.length) * 100) : null,
    schemaCoveragePct: pagesWithParsed.length > 0 ? Math.round((pagesWithSchema.length / pagesWithParsed.length) * 100) : null,
    critical: report.criticalIssues.length,
    warnings: report.warnings.length,
    opportunities: report.opportunities.length,
    changes,
    scanHistory,
  };
}
