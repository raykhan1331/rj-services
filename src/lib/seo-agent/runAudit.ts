import { SEO_CONFIG } from "./config";
import { crawlSite, toPageRecord } from "./crawler";
import { checkPage, checkCrossPage } from "./pageChecks";
import { checkRedirects, checkRobots, checkSitemap } from "./technicalChecks";
import { computeScore } from "./score";
import { appendAuditRun, readAuditHistory, readLatestAuditRun } from "./history";
import { upsertPages, reconcileIssues, reconcileActions, readActions } from "./store";
import { toIssueRecord, generateActionQueue } from "./actionQueue";
import { computeTechnicalSeoScore } from "./technical/technicalScore";
import { detectTechnicalChanges } from "./technical/changeDetection";
import { buildTechnicalSeoSummary } from "./technical/summary";
import { saveLatestTechnicalSummary } from "./technical/store";
import { getLatestKeywordSummary } from "./keywords/store";
import { runOnPageAnalysis } from "./onpage/runOnPageAnalysis";
import { computeOnPageSeoScore } from "./onpage/onPageScore";
import { buildOnPageSeoSummary, saveLatestOnPageSummary } from "./onpage/store";
import { runLinkingAnalysis } from "./linking/runLinkingAnalysis";
import { buildLinkingSeoSummary, saveLatestLinkingSummary } from "./linking/store";
import type { PageAuditResult, SeoAuditReport, SeoIssue } from "./types";

/** Runs the full deterministic audit against `baseUrl` (defaults to the
 * configured production site URL): crawls every live route (crawler.ts),
 * verifies the site's configured redirects (STEP 5 Task 1), runs
 * technical/on-page/content/cross-page checks plus STEP 6's on-page
 * recommendation engine (title/meta/heading/content-intent/internal-link/
 * alt-text), scores the result (the six-category score, STEP 5's
 * Technical SEO score, and STEP 6's On-Page SEO score), compares against
 * the previous run (STEP 5 Task 4), and persists pages, issue lifecycle,
 * the action queue, this run's history entry, and the technical/on-page
 * summaries the dashboard reads. Every check here is rule-based — no AI
 * call is made. */
export async function runAudit(baseUrl: string = SEO_CONFIG.siteUrl): Promise<SeoAuditReport> {
  // Read the previous run BEFORE this run is appended to history, and
  // before anything else — this is what change detection (Task 4) diffs
  // the new result against.
  const previousReport = await readLatestAuditRun();

  // STEP 6 — reused, not re-fetched: the latest persisted keyword-
  // intelligence summary (STEP 4), already cached, no new Search Console
  // call made here.
  const keywordSummary = await getLatestKeywordSummary();

  const [sitemap, robots, redirects, crawled] = await Promise.all([checkSitemap(baseUrl), checkRobots(baseUrl), checkRedirects(baseUrl), crawlSite(baseUrl)]);
  const auditedOrigin = new URL(baseUrl).origin;

  const pageResults: PageAuditResult[] = crawled.map(({ route, parsed }) => ({
    path: route.path,
    parsed,
    issues: checkPage(route.path, parsed, auditedOrigin),
  }));

  const crossPageIssues = checkCrossPage(
    pageResults.filter((r) => r.parsed).map((r) => ({ path: r.path, page: r.parsed! }))
  );

  // STEP 6 — runs against the SAME in-memory crawl (Task 15's reuse
  // rule), using this run's own technical/on-page issues to decide which
  // pages actually need a recommendation.
  const onPageIssues = runOnPageAnalysis(crawled, pageResults, crossPageIssues, keywordSummary);

  // STEP 7 — same in-memory crawl again, plus already-cached GSC
  // performance and keyword-intelligence data (no new Google API call).
  // Passed STEP 6's onPageIssues so its own link-opportunity detection can
  // skip any (source, target) pair STEP 6 already recommended.
  const { graph: linkGraph, issues: linkingIssues } = await runLinkingAnalysis(crawled, keywordSummary, onPageIssues);

  const allIssues: SeoIssue[] = [
    ...sitemap.issues,
    ...robots.issues,
    ...redirects.flatMap((r) => r.issues),
    ...pageResults.flatMap((r) => r.issues),
    ...crossPageIssues,
    ...onPageIssues,
    ...linkingIssues,
  ];

  const score = computeScore(allIssues);
  const technicalScore = computeTechnicalSeoScore(allIssues);
  const onPageScore = computeOnPageSeoScore(allIssues, keywordSummary);

  const pagesNeedingAttention = pageResults
    .map((r) => ({ path: r.path, issueCount: r.issues.length }))
    .filter((p) => p.issueCount > 0)
    .sort((a, b) => b.issueCount - a.issueCount);

  const report: SeoAuditReport = {
    generatedAt: new Date().toISOString(),
    siteUrl: baseUrl,
    pagesAudited: pageResults.length,
    sitemap,
    robots,
    redirects,
    pages: pageResults,
    score,
    technicalScore,
    onPageScore,
    criticalIssues: allIssues.filter((i) => i.severity === "critical"),
    warnings: allIssues.filter((i) => i.severity === "warning"),
    opportunities: allIssues.filter((i) => i.severity === "opportunity"),
    pagesNeedingAttention,
  };

  const changes = detectTechnicalChanges(allIssues, previousReport, technicalScore.score);

  // Persist everything Task 2/5 (STEP 2) and Task 4/8/9 (STEP 5) need:
  // the crawled pages themselves, the issue lifecycle (open/resolved
  // across runs), the action queue regenerated from this run's issues
  // (reconcile preserves any status a human already set on an existing
  // item — see store.ts), this run's history entry, and the technical/
  // on-page summaries the dashboard reads.
  //
  // These MUST run sequentially, not via Promise.all: each does its own
  // read-modify-write of the same underlying JSON file
  // (data/seo-agent-data.json), so running them concurrently is a race —
  // whichever write lands last silently clobbers the others' changes with
  // the stale data it read at the start.
  const now = report.generatedAt;
  await upsertPages(crawled.map(toPageRecord));
  await reconcileIssues(allIssues.map((issue) => toIssueRecord(issue, now)), "audit");
  // STEP 5 Task 6 / STEP 6 Task 10 — every audit-sourced action (technical
  // AND on-page) defaults to "review-required" (not the previously-default
  // "pending"), same no-exceptions override pattern STEP 4 established for
  // keyword-intelligence. reconcileActions still preserves whatever status
  // a human already set on an existing item, so this only changes the
  // starting status of genuinely NEW action-queue items — nothing is ever
  // silently applied to the live pages.
  await reconcileActions(generateActionQueue(allIssues, "review-required"), "audit");
  await appendAuditRun(report);

  const recentReports = await readAuditHistory();
  await saveLatestTechnicalSummary(buildTechnicalSeoSummary(report, changes, recentReports));

  const actions = await readActions();
  await saveLatestOnPageSummary(buildOnPageSeoSummary(report, changes, actions, recentReports));
  await saveLatestLinkingSummary(buildLinkingSeoSummary(linkGraph, report, changes, actions, recentReports));

  return report;
}
