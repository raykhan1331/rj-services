export type IssueSeverity = "critical" | "warning" | "opportunity";

// Stable identity for every issue a check can raise. Used to (a) classify
// each issue against the SAFE / REQUIRES_APPROVAL / NEVER_AUTOMATE policy
// in automationPolicy.ts, and (b) track an issue as the same issue across
// audit runs so its lifecycle (open → resolved) can be recorded, instead
// of matching on the human-readable message text which can vary.
export type SeoIssueType =
  | "fetch-failed"
  | "http-error"
  | "noindex-meta"
  | "missing-canonical"
  | "canonical-origin-mismatch"
  | "missing-title"
  | "title-length"
  | "missing-meta-description"
  | "meta-description-length"
  | "missing-h1"
  | "multiple-h1"
  | "no-subheadings"
  | "thin-content"
  | "missing-alt-text"
  | "low-internal-links"
  | "no-structured-data"
  | "duplicate-title"
  | "duplicate-meta-description"
  | "orphan-page"
  | "sitemap-unreachable"
  | "sitemap-empty"
  | "sitemap-origin-mismatch"
  | "robots-unreachable"
  | "robots-missing-sitemap-ref"
  | "robots-sitemap-origin-mismatch"
  | "robots-invalid-sitemap-url"
  | "robots-disallow-all"
  // STEP 3 — Search Console-derived issue types (Task 4).
  | "gsc-high-impressions-low-ctr"
  | "gsc-poor-position"
  | "gsc-declining-clicks"
  | "gsc-declining-impressions"
  | "gsc-high-performer-link-opportunity"
  // STEP 4 — Keyword & Search-Intent Intelligence issue types (Task 4/5/6/7).
  // Distinct from the STEP 3 gsc-* types above: those work off query-only
  // or page-only aggregates; these work off the combined query+page
  // breakdown (Task 1), so they carry a specific ranking URL per query.
  | "keyword-ranking-improvement" // position 4-20, relevant query
  | "keyword-page-optimization" // high impressions, position 11-20
  | "keyword-successful-topic" // high clicks + strong position — a positive signal, not a problem
  | "keyword-cannibalization" // multiple pages ranking for closely-related queries
  | "keyword-relevance-investigate" // relevant query, weak/no clicks despite being findable
  | "keyword-service-match" // query matches an existing service — page optimization opportunity
  | "keyword-location-opportunity" // query matches a target location + service combination
  // STEP 5 — Technical SEO Monitoring Engine issue types (Task 1/2).
  // Everything below reuses already-parsed page data (ParsedPage) or the
  // site's own static route config — none of these require an extra
  // network request beyond the existing crawl, except redirect-broken /
  // redirect-target-mismatch, which check the site's own small, fixed set
  // of configured redirects (REDIRECTED_ROUTES in config.ts).
  | "broken-internal-link" // a page links to a path that isn't a real known route
  | "insecure-external-link" // an external link uses http:// instead of https://
  | "missing-og-metadata" // missing og:title/og:description/og:url
  | "heading-hierarchy-skip" // H3s present with no H2 before them
  | "canonical-target-invalid" // canonical points to a same-origin path that isn't a real known route
  | "canonical-points-elsewhere" // canonical points to a different, real page (not a documented redirect)
  | "redirect-broken" // a configured redirect route no longer actually redirects
  | "redirect-target-mismatch" // a configured redirect's Location header doesn't match its configured target
  // STEP 5 Task 5 — Search Console cross-check signals. These require
  // BOTH the latest cached technical audit AND the latest cached Search
  // Console data (both already fetched by earlier steps — no new
  // network call is made to produce these).
  | "noindex-visible-page" // a page with real GSC visibility (impressions/clicks) is now noindex
  | "canonical-issue-visible-page" // a page with real GSC visibility has a canonical problem
  | "technical-issue-page-declining" // a page has both a new technical issue and a GSC clicks/impressions decline (correlation, not proven causation)
  | "page-missing-from-search-console" // a page with prior GSC visibility has none in the current period
  // STEP 6 — On-Page SEO Optimization Engine issue types (Task 2/3/4/5/6/7).
  // Unlike most earlier issue types (which only FLAG a problem), each of
  // these also carries a concrete `recommendedValue` — the actual
  // suggested replacement text/anchor — built deterministically from real,
  // already-known data (the page's own H1, its matched real service from
  // config.ts, real Step 4 keyword-intelligence evidence, or an image's
  // own filename) — never invented content. `evidenceBasis` on the issue
  // records whether real Search Console/keyword data backed the
  // recommendation, or it's on-page/crawl evidence only (Task 1).
  | "title-recommendation"
  | "meta-description-recommendation"
  | "heading-recommendation"
  | "content-intent-recommendation" // Step 4 keyword-intelligence opportunity translated onto a specific crawled page
  | "internal-link-recommendation"
  | "alt-text-recommendation"
  // STEP 7 — Internal Linking & Content Opportunity Engine issue types
  // (Task 3/5/6). "internal-link-opportunity" is deliberately distinct
  // from STEP 6's "internal-link-recommendation" — STEP 6's version only
  // considers topical overlap; this one additionally weighs real GSC
  // performance and keyword-intelligence evidence (Task 4) and is skipped
  // wherever it would duplicate a STEP 6 recommendation for the same
  // source→target pair, so nothing is double-reported.
  | "internal-link-opportunity"
  | "weak-anchor-text"
  | "content-existing-page-improvement"
  | "content-supporting-content-opportunity"
  | "content-new-page-opportunity";

/** Which subsystem raised an issue. Lets store.ts reconcile (open ↔
 * resolved) each source's issues independently — a Search Console run
 * must never mark a website-audit issue resolved just because it wasn't
 * in the GSC result set, and vice versa. */
export type SeoIssueSource = "audit" | "search-console" | "keyword-intelligence";

// STEP 4 Task 3 — deterministic search-intent classification. "unknown"
// is a first-class, honest outcome (Task 3: "do not pretend uncertain
// classifications are accurate") — never omitted or guessed past.
export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational" | "local" | "unknown";

export interface SeoIssue {
  type: SeoIssueType;
  severity: IssueSeverity;
  category: "technical" | "on-page" | "content" | "internal-linking" | "structured-data" | "indexability" | "search-performance";
  page?: string;
  message: string;
  /** What was actually detected — keeps the report evidence-based, not vague. */
  evidence?: string;
  /** Defaults to "audit" wherever omitted — only Search Console-derived
   * issues (Step 3) need to set this explicitly. */
  source?: SeoIssueSource;
  /** The search query this issue concerns, for Search Console-derived
   * issues (Task 5's "query where applicable"). */
  query?: string;
  /** Human-readable current metric value, e.g. "1,240 impressions, 0.8% CTR". */
  currentMetric?: string;
  /** STEP 4 — set only on keyword-intelligence issues. */
  searchIntent?: SearchIntent;
  opportunityScore?: OpportunityScore;
  /** STEP 6 — the concrete suggested replacement value (title, meta
   * description, H1, alt text, or anchor text) for on-page recommendation
   * types. Always deterministically derived from real data — see the
   * SeoIssueType union's STEP 6 comment. */
  recommendedValue?: string;
  /** STEP 6 Task 6 — for "internal-link-recommendation" only: the target
   * page the suggested link (from `page`) should point to. */
  linkTarget?: string;
  /** STEP 6 Task 1 — whether this on-page recommendation was informed by
   * real Search Console/keyword-intelligence data ("gsc") or is based on
   * on-page/crawl evidence only ("on-page-only") — never left ambiguous. */
  evidenceBasis?: "gsc" | "on-page-only";
  /** STEP 7 Task 7 — set only on "content-*-opportunity" issues; the
   * classification the recommendation falls under. */
  contentGapType?: ContentGapType;
}

/** STEP 7 Task 7 — the four content-opportunity classifications, in
 * order of how much new work each implies. "new-page-opportunity" is
 * deliberately the rarest/most conservative — see contentOpportunity.ts. */
export type ContentGapType = "existing-page-improvement" | "supporting-content" | "new-page-opportunity" | "no-action";

/** STEP 4 Task 8 — every factor that fed the 0-100 score, so the score is
 * never a black box. `weight` + `contribution` are both included: weight
 * is this factor's max possible points, contribution is what it actually
 * scored — so `score = sum(contribution)` is checkable by re-adding them. */
export interface OpportunityScoreFactor {
  factor: string;
  weight: number;
  contribution: number;
  explanation: string;
}

export interface OpportunityScore {
  score: number; // 0-100
  factors: OpportunityScoreFactor[];
}

/** What the lightweight HTML parser pulls out of one fetched page. */
export interface ParsedPage {
  url: string;
  httpStatus: number | null;
  fetchError: string | null;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogUrl: string | null;
  h1s: string[];
  h2s: string[];
  h3s: string[];
  images: { src: string; alt: string | null }[];
  internalLinks: string[];
  /** STEP 7 Task 1/5 — one entry per real internal <a> tag actually found
   * on the page, pairing its target with its real visible anchor text
   * (stripped of inner markup). `internalLinks` above stays a deduplicated
   * set of unique targets for existing STEP 1-6 consumers; this is the
   * richer, non-deduplicated detail the link graph and anchor-text-quality
   * checks need. */
  internalLinkDetails: { href: string; anchorText: string }[];
  externalLinks: string[];
  jsonLdTypes: string[];
  wordCount: number;
  /** STEP 6 — the first ~40 words of the page's real visible body text
   * (already being stripped/tokenized to compute wordCount above — this
   * just keeps a short prefix of it). Used ONLY to ground on-page
   * recommendations (e.g. a meta description suggestion) in real content
   * that was actually on the page, never to invent claims. */
  contentSnippet: string;
}

export interface PageAuditResult {
  path: string;
  parsed: ParsedPage | null;
  issues: SeoIssue[];
}

export interface CategoryScore {
  score: number; // 0-100
  maxScore: 100;
  issues: SeoIssue[];
}

export interface SeoScoreBreakdown {
  overall: number; // 0-100, weighted average of categories below
  technical: CategoryScore;
  onPage: CategoryScore;
  content: CategoryScore;
  internalLinking: CategoryScore;
  structuredData: CategoryScore;
  indexability: CategoryScore;
}

export interface SeoAuditReport {
  generatedAt: string;
  siteUrl: string;
  pagesAudited: number;
  sitemap: { reachable: boolean; url: string; entryCount: number; issues: SeoIssue[] };
  robots: { reachable: boolean; url: string; issues: SeoIssue[] };
  redirects: { path: string; expectedTarget: string; issues: SeoIssue[] }[];
  pages: PageAuditResult[];
  score: SeoScoreBreakdown;
  /** STEP 5 Task 3 — a separate, transparent 0-100 "Technical SEO score"
   * over a curated set of technical health factors. Distinct from
   * `score.technical` (one of six equally-weighted CATEGORY scores in the
   * overall breakdown above) — this one is the dedicated technical-health
   * lens Task 3 asks for, computed from the SAME issues, not a second
   * detection pass. */
  technicalScore: TechnicalSeoScore;
  /** STEP 6 Task 8 — a third transparent 0-100 lens, this one over
   * on-page quality (titles, meta descriptions, headings, content/intent
   * alignment, internal linking, alt text, schema) — again computed from
   * the SAME issues, not a second detection pass. */
  onPageScore: OnPageSeoScore;
  criticalIssues: SeoIssue[];
  warnings: SeoIssue[];
  opportunities: SeoIssue[];
  pagesNeedingAttention: { path: string; issueCount: number }[];
}

// ---------------------------------------------------------------------
// STEP 5 — Technical SEO Monitoring Engine types.
// ---------------------------------------------------------------------

/** Task 3 — one factor contributing to the Technical SEO score. Same
 * transparent shape as STEP 4's OpportunityScoreFactor (weight + actual
 * contribution + a human-readable explanation), reused here as a pattern
 * rather than importing that keyword-specific type directly. */
export interface TechnicalScoreFactor {
  factor: string;
  weight: number;
  contribution: number;
  explanation: string;
}

export interface TechnicalSeoScore {
  score: number; // 0-100
  factors: TechnicalScoreFactor[];
}

/** Task 4 — how one persisting issue (same id across two runs) changed
 * between them. `magnitude` is only populated when a numeric signal could
 * be extracted from the issue's evidence/currentMetric text (e.g. "3 of 5
 * images missing alt") — when it can't be, the issue is honestly reported
 * as "unchanged" rather than guessing a direction. */
export type IssueChangeStatus = "new" | "resolved" | "worsening" | "improving" | "unchanged";

export interface IssueChangeEntry {
  id: string;
  type: SeoIssueType;
  page: string | null;
  severity: IssueSeverity;
  status: IssueChangeStatus;
  message: string;
  previousMagnitude: number | null;
  currentMagnitude: number | null;
}

export interface TechnicalChangeSummary {
  comparedAgainst: string | null; // generatedAt of the previous run compared against, or null if this is the first run
  newIssues: IssueChangeEntry[];
  resolvedIssues: IssueChangeEntry[];
  worseningIssues: IssueChangeEntry[];
  improvingIssues: IssueChangeEntry[];
  unchangedCount: number;
  scoreTrend: "improving" | "worsening" | "stable" | "unknown";
  previousTechnicalScore: number | null;
  currentTechnicalScore: number;
}

/** Task 9 — one lightweight scan-history entry (a thin projection of a
 * full SeoAuditReport, already persisted in full by history.ts — this is
 * just the small set of fields Task 9 asks a dashboard/comparison view to
 * read without shipping every run's full page-by-page report). */
export interface ScanHistoryEntry {
  generatedAt: string;
  pagesScanned: number;
  issuesDetected: number;
  criticalCount: number;
  warningCount: number;
  opportunityCount: number;
  technicalScore: number;
  overallScore: number;
}

/** Task 8/9 — the persisted "latest technical scan" snapshot the
 * dashboard reads (same pattern as gsc/performanceStore.ts and
 * keywords/store.ts: a small persisted summary, refreshed by whichever
 * endpoint actually triggers a scan, read here with no live work). */
export interface TechnicalSeoSummary {
  lastScanAt: string | null;
  pagesScanned: number;
  technicalScore: TechnicalSeoScore | null;
  crawlabilityOk: boolean;
  indexabilityOk: boolean;
  sitemapOk: boolean;
  robotsOk: boolean;
  canonicalHealthy: boolean;
  brokenLinksCount: number;
  metadataCoveragePct: number | null; // 0-100, % of pages with a title + meta description + canonical, all present
  schemaCoveragePct: number | null; // 0-100, % of pages with at least one JSON-LD type
  critical: number;
  warnings: number;
  opportunities: number;
  changes: TechnicalChangeSummary | null;
  scanHistory: ScanHistoryEntry[];
}

// ---------------------------------------------------------------------
// STEP 6 — On-Page SEO Optimization Engine types.
// ---------------------------------------------------------------------

/** Task 8 — same transparent shape as TechnicalScoreFactor, kept as its
 * own named type (matching this codebase's established pattern of one
 * scoped type per step, even when structurally identical to another). */
export interface OnPageScoreFactor {
  factor: string;
  weight: number;
  contribution: number;
  explanation: string;
}

export interface OnPageSeoScore {
  score: number; // 0-100
  factors: OnPageScoreFactor[];
}

/** Task 13 — one lightweight on-page scan-history entry. Derived from the
 * SAME TechnicalChangeSummary STEP 5 already computes each run (STEP 6's
 * recommendations flow into the same "audit"-sourced allIssues array), so
 * no separate diffing pass is needed — this just filters that summary
 * down to on-page-relevant issue types. */
export interface OnPageHistoryEntry {
  generatedAt: string;
  pagesAnalyzed: number;
  onPageScore: number;
  recommendationsCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  newCount: number;
  resolvedCount: number;
  improvedPagesCount: number;
  worsenedPagesCount: number;
}

/** Task 12/13 — the persisted "latest on-page scan" snapshot the
 * dashboard reads, same pattern as technical/store.ts. */
export interface OnPageSeoSummary {
  lastScanAt: string | null;
  pagesAnalyzed: number;
  onPageScore: OnPageSeoScore | null;
  pagesNeedingOptimization: number;
  titleIssues: number;
  metaDescriptionIssues: number;
  headingIssues: number;
  contentIntentIssues: number;
  internalLinkOpportunities: number;
  altTextIssues: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  pendingApprovals: number;
  completedActions: number;
  history: OnPageHistoryEntry[];
}

// ---------------------------------------------------------------------
// STEP 7 — Internal Linking & Content Opportunity Engine types.
// ---------------------------------------------------------------------

/** Task 2 — a graded read on how well-connected a page is, replacing a
 * binary orphan/not-orphan flag with three tiers so a genuinely unlinked
 * page reads differently from one that just has thin (but real)
 * connections. */
export type OrphanClassification = "potential-orphan" | "weakly-connected" | "normally-connected";

/** Task 1 — one node in the internal-link graph: a real crawled page plus
 * its computed connectivity. */
export interface LinkGraphNode {
  path: string;
  kind: string;
  isPriority: boolean; // service/hub route kind — see config.ts's SeoRoute
  inboundCount: number;
  outboundCount: number;
  classification: OrphanClassification;
}

/** Task 1 — one real edge in the graph: a page that links to another,
 * with every distinct real anchor text used for that link (a page can
 * link to the same target more than once with different anchor text). */
export interface LinkGraphEdge {
  source: string;
  target: string;
  anchorTexts: string[];
}

export interface LinkGraphSummary {
  nodes: LinkGraphNode[];
  edges: LinkGraphEdge[];
  totalInternalLinks: number;
  potentialOrphanCount: number;
  weaklyConnectedCount: number;
  pagesWithFewIncoming: string[]; // priority pages below the inbound-link threshold
  pagesWithFewOutgoing: string[];
}

/** Task 13 — one lightweight history entry, same reuse-not-rebuild
 * pattern as STEP 5/6: derived from STEP 5's already-computed
 * TechnicalChangeSummary (STEP 7's issues flow into the same "audit"-
 * sourced allIssues array), filtered to STEP 7's own issue types. */
export interface LinkingHistoryEntry {
  generatedAt: string;
  internalLinkCount: number;
  potentialOrphanCount: number;
  linkingOpportunities: number;
  contentOpportunities: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  newCount: number;
  resolvedCount: number;
}

/** Task 12 — the persisted "latest linking/content-opportunity scan"
 * snapshot the dashboard reads, same pattern as technical/store.ts and
 * onpage/store.ts. */
export interface LinkingSeoSummary {
  lastScanAt: string | null;
  totalInternalLinks: number;
  potentialOrphanPages: number;
  weaklyConnectedPages: number;
  pagesWithFewIncoming: string[];
  pagesWithFewOutgoing: string[];
  highValueLinkingOpportunities: number;
  weakAnchorTextIssues: number;
  contentOpportunities: number;
  existingPageImprovements: number;
  supportingContentOpportunities: number;
  newPageOpportunities: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  pendingApprovals: number;
  completedActions: number;
  history: LinkingHistoryEntry[];
}

// ---------------------------------------------------------------------
// STEP 9 — Safe SEO Automation & Change Management types.
// ---------------------------------------------------------------------

export interface ValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

/** Task 7 — the full set of post-write checks run after an approved
 * change is applied; `passed` is the overall verdict (see
 * automation/validation.ts for exactly which checks gate it). */
export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
}

export type RollbackStatus = "not-applicable" | "rollback-available" | "rolled-back" | "rollback-not-available" | "rollback-failed";

/** Task 11 — one change-history entry. An execution attempt creates one;
 * a later rollback both creates its OWN entry and updates the original
 * entry's `rollbackStatus` (see automation/rollback.ts) so Task 11's
 * "rollback status" is visible on the record it actually describes. */
export interface ChangeHistoryEntry {
  id: string;
  actionId: string;
  page: string | null;
  changeType: SeoIssueType;
  riskLevel: RiskLevel;
  previousValue: string | null;
  newValue: string | null;
  approvalStatus: ActionStatus;
  executionStatus: "not-executed" | "executing" | "completed" | "failed";
  timestamp: string;
  validation: ValidationResult | null;
  rollbackStatus: RollbackStatus;
  errorMessage: string | null;
}

/** Task 12 — the dashboard's Change Management section. */
export interface ChangeManagementSummary {
  pendingApprovals: number;
  approvedActions: number;
  executingActions: number;
  completedActions: number;
  failedActions: number;
  rollbackAvailable: number;
  rejectedActions: number;
  highRiskActions: number;
  recentChanges: ChangeHistoryEntry[];
}

/** Shape a future dashboard UI/API will read. */
export interface SeoDashboardData {
  latest: SeoAuditReport | null;
  history: { generatedAt: string; overallScore: number }[];
  recentlyFixed: SeoIssue[];
  /** STEP 2 additions — a flat summary so a dashboard doesn't need to
   * re-derive counts from the full report. */
  summary: {
    overallScore: number | null;
    criticalCount: number;
    warningCount: number;
    opportunityCount: number;
    pagesScanned: number;
    pendingActions: number;
    lastScanAt: string | null;
  };
  /** STEP 3 Task 6 — populated once Search Console is connected; null
   * fields throughout when it isn't, never fabricated data. */
  searchConsole: GscDashboardData;
  /** STEP 4 Task 10 — same rule: empty/zero throughout until a keyword
   * analysis has actually run (which itself requires Search Console to
   * be connected first). */
  keywordIntelligence: KeywordIntelligenceSummary;
  /** STEP 5 Task 8 — technical SEO monitoring summary. Populated from the
   * latest audit run; honest zero/null defaults until a scan has run. */
  technicalSeo: TechnicalSeoSummary;
  /** STEP 6 Task 12 — on-page SEO optimization summary, same honest
   * zero/null-until-scanned rule. */
  onPageSeo: OnPageSeoSummary;
  /** STEP 7 Task 12 — internal linking & content opportunity summary,
   * same honest zero/null-until-scanned rule. */
  internalLinking: LinkingSeoSummary;
  /** STEP 9 Task 12 — change-management summary (approval/execution
   * lifecycle counts + recent change history). */
  changeManagement: ChangeManagementSummary;
  /** STEP 10 Task 16 — autonomous monitoring/reporting summary (health
   * score, trends, alerts, latest run, report history). */
  monitoring: MonitoringSummary;
}

// ---------------------------------------------------------------------
// STEP 10 — Autonomous SEO Monitoring, Reporting & Continuous
// Improvement types. Deliberately does NOT duplicate the detailed
// per-subsystem data already in SeoDashboardData (technicalSeo, onPageSeo,
// internalLinking, keywordIntelligence, searchConsole, changeManagement —
// Task 9's "Technical SEO / Keywords / Pages / Content / Internal Linking
// / Changes" report sections ARE those existing fields); this only adds
// the NEW layer Step 10 introduces on top: a unified health score, trend
// comparisons, alerts, monitoring-run tracking, and lightweight report
// history.
// ---------------------------------------------------------------------

export interface SeoHealthScoreFactor {
  factor: string;
  weight: number;
  contribution: number;
  explanation: string;
}

/** Task 4 — a transparent 0-100 score combining EXISTING sub-scores
 * (technical, on-page, keyword-opportunity evidence, internal-linking
 * health, content opportunities, indexability) — not a new detection
 * pass. `unavailableComponents` names any factor that couldn't be scored
 * (e.g. "search visibility" when GSC isn't connected) so the score is
 * never presented as more complete than the underlying data actually is. */
export interface SeoHealthScore {
  score: number;
  factors: SeoHealthScoreFactor[];
  unavailableComponents: string[];
}

export type TrendDirection = "improving" | "declining" | "stable" | "unknown";

/** Task 6 — one trend line. `percentChange` is null whenever the
 * baseline is zero/unavailable (Task 6: "avoid misleading percentages
 * when the baseline is zero or unavailable") rather than showing a
 * nonsensical infinite/huge percentage. */
export interface TrendMetric {
  metric: string;
  current: number | null;
  previous: number | null;
  difference: number | null;
  percentChange: number | null;
  direction: TrendDirection;
}

/** Task 7 — one important page's monitored status this run. */
export interface ImportantPageStatus {
  page: string;
  importanceEvidence: string;
  newIssues: string[];
  openIssueCount: number;
}

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "open" | "acknowledged" | "resolved";

/** Task 8 — every field the task requires. */
export interface SeoAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  page: string | null;
  evidence: string;
  detectedAt: string;
  relatedActionId: string | null;
  recommendedNextStep: string;
  status: AlertStatus;
}

export type MonitoringRunStatus = "queued" | "running" | "completed" | "partial" | "failed";

/** Task 14 — one monitoring run's own lifecycle record, separate from
 * the SeoAuditReport it may trigger (a monitoring run can wrap MULTIPLE
 * existing subsystem runs — audit, GSC, keyword analysis — each of which
 * already has its own history; this tracks the wrapping run itself). */
export interface MonitoringRun {
  id: string;
  startedAt: string;
  endedAt: string | null;
  status: MonitoringRunStatus;
  modulesExecuted: string[];
  modulesFailed: { module: string; error: string }[];
  pagesProcessed: number;
  issuesDetected: number;
  recommendationsCreated: number;
  dataAvailability: { gscConnected: boolean; keywordIntelligenceAvailable: boolean };
  previousRunId: string | null;
}

/** Task 10 — one lightweight, comparable report snapshot. Deliberately
 * slim (Task 10: "lightweight report history") — the FULL report detail
 * lives in the dashboard's existing per-subsystem fields at the time it
 * was generated; this is just enough to compare "this report vs a past
 * one" without re-fetching everything. */
export interface SeoReportHistoryEntry {
  id: string;
  generatedAt: string;
  monitoringRunId: string;
  overallScore: number | null;
  healthScore: number;
  technicalScore: number | null;
  onPageScore: number | null;
  criticalCount: number;
  warningCount: number;
  opportunityCount: number;
  pendingApprovals: number;
  completedChanges: number;
  failedChanges: number;
  majorImprovements: string[];
  majorDeclines: string[];
}

/** Task 16 — the dashboard's final monitoring/reporting section. */
export interface MonitoringSummary {
  healthScore: SeoHealthScore | null;
  trends: TrendMetric[];
  importantPages: ImportantPageStatus[];
  alerts: SeoAlert[];
  latestRun: MonitoringRun | null;
  nextScheduledRun: string | null;
  reportHistory: SeoReportHistoryEntry[];
}

// ---------------------------------------------------------------------
// STEP 2 — persisted data model (Task 2). Reuses the existing file-based
// JSON store pattern from src/lib/leads/store.ts rather than adding a
// database dependency the project doesn't otherwise need.
// ---------------------------------------------------------------------

/** One crawled page's latest known state — persisted so "last scanned"
 * and page-level history are meaningful across runs, not just in-memory
 * for the duration of one audit. */
export interface PageRecord {
  url: string;
  path: string;
  kind: string;
  httpStatus: number | null;
  title: string | null;
  description: string | null;
  canonical: string | null;
  headings: { h1Count: number; h2Count: number; h3Count: number; h1s: string[]; h2s: string[]; h3s: string[] };
  content: { wordCount: number };
  images: { total: number; missingAlt: number };
  links: { internal: number; external: number };
  schema: { types: string[] };
  openGraph: { title: string | null; description: string | null; url: string | null };
  indexability: { indexable: boolean; robotsMeta: string | null };
  lastScannedAt: string;
}

export type IssueStatus = "open" | "resolved";

/** A persisted, stateful record of one issue — distinct from the
 * transient `SeoIssue` a single audit run produces. Tracks the issue's
 * lifecycle (open → resolved) across runs using `type` + `page` as its
 * stable identity. */
export interface SeoIssueRecord {
  id: string;
  type: SeoIssueType;
  source: SeoIssueSource;
  severity: IssueSeverity;
  category: SeoIssue["category"];
  page: string | null;
  query?: string;
  currentMetric?: string;
  searchIntent?: SearchIntent;
  opportunityScore?: OpportunityScore;
  /** STEP 6 — see SeoIssue's identical fields for what these mean. */
  recommendedValue?: string;
  linkTarget?: string;
  evidenceBasis?: "gsc" | "on-page-only";
  /** STEP 7 — see SeoIssue's identical field. */
  contentGapType?: ContentGapType;
  description: string;
  evidence?: string;
  recommendedSolution: string;
  status: IssueStatus;
  detectedAt: string;
  resolvedAt: string | null;
}

export type SeoChangeType = "metadata" | "content" | "heading" | "structured-data" | "internal-link" | "redirect" | "url" | "other";
export type SeoChangeApprovalStatus = "proposed" | "approved" | "automatic" | "rejected";

/** A log entry for a change made (or proposed) to the site. STEP 2 never
 * writes a real entry here — no change is applied yet — but the shape
 * exists now so Step 3+ automation has somewhere to record what it did
 * and why, satisfying the audit-trail requirement from day one. */
export interface SeoChangeRecord {
  id: string;
  url: string;
  changeType: SeoChangeType;
  previousValue: string | null;
  newValue: string | null;
  timestamp: string;
  reason: string;
  approvalStatus: SeoChangeApprovalStatus;
}

export type AutomationTier = "safe" | "requires-approval" | "never-automate";
export type RiskLevel = "low" | "medium" | "high";
// "review-required" (STEP 4 Task 9) is distinct from "pending": every
// keyword-intelligence action is created with this status, forced
// regardless of its automationTier — Task 9 is explicit that ALL such
// recommendations start out requiring review, with no exceptions for
// items that would otherwise classify as "safe". STEP 6 Task 10 added
// "failed"/"skipped" as recognized terminal states. STEP 9 Task 1 adds
// the remaining lifecycle states an APPROVED action moves through when
// actually executed: "executing" (in progress), "validating" (change
// applied, post-write checks running), "done" (= Task 1's COMPLETED —
// kept as "done" rather than renamed, to avoid touching every earlier
// step's code that already reads/writes that value), and
// "rollback-available" (completed AND a snapshot exists that CAN restore
// the previous value — see automation/rollback.ts).
export type ActionStatus = "pending" | "review-required" | "approved" | "rejected" | "done" | "failed" | "skipped" | "executing" | "validating" | "rollback-available";
export type ActionPriority = "high" | "medium" | "low";

/** One queued, not-yet-applied recommendation. Nothing in this codebase
 * transitions an action to "approved"/"done" automatically — that
 * requires a human decision. */
export interface SeoActionQueueItem {
  id: string;
  source: SeoIssueSource;
  page: string | null;
  query?: string;
  currentMetric?: string;
  searchIntent?: SearchIntent;
  opportunityScore?: OpportunityScore;
  /** STEP 6 — see SeoIssue's identical fields for what these mean. */
  recommendedValue?: string;
  linkTarget?: string;
  evidenceBasis?: "gsc" | "on-page-only";
  /** STEP 7 — see SeoIssue's identical field. */
  contentGapType?: ContentGapType;
  /** STEP 9 Task 4/5 — the exact current value recorded at detection
   * time (mirrors SeoIssueRecord.evidence, which SeoActionQueueItem
   * didn't previously carry). Task 4's approval UI needs this as the
   * "current value" shown next to `recommendedValue`'s "proposed value";
   * Task 5's safe-execution staleness check needs it to verify the live
   * page still matches what the recommendation was based on before
   * writing anything. */
  evidence?: string;
  issueType: SeoIssueType;
  problem: string;
  recommendedAction: string;
  priority: ActionPriority;
  expectedBenefit: string;
  riskLevel: RiskLevel;
  automationTier: AutomationTier;
  requiresApproval: boolean;
  status: ActionStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// STEP 3 — Google Search Console integration types (Tasks 3, 6).
// ---------------------------------------------------------------------

export interface GscDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/** One row of Search Console's searchAnalytics.query response, generic
 * over which dimension(s) it was grouped by (query, page, country,
 * device, or searchAppearance — GSC returns the same four metrics for
 * every dimension breakdown). */
export interface GscRow {
  keys: string[]; // dimension values, in the order requested
  clicks: number;
  impressions: number;
  ctr: number; // 0-1
  position: number; // average position, 1-based
}

export interface GscPerformanceSummary {
  range: GscDateRange;
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number; // 0-1
  averagePosition: number;
  topQueries: GscRow[];
  topPages: GscRow[];
  byCountry: GscRow[];
  byDevice: GscRow[];
  bySearchAppearance: GscRow[];
}

export interface GscPeriodComparison {
  current: GscPerformanceSummary;
  previous: GscPerformanceSummary;
  change: {
    clicksPct: number | null;
    impressionsPct: number | null;
    ctrPct: number | null;
    positionPct: number | null; // negative = improved (lower position number)
  };
}

export type GscConnectionState = "not-configured" | "not-connected" | "connected" | "needs-reauth";

export interface GscConnectionStatus {
  state: GscConnectionState;
  propertyUrl: string | null;
  connectedAt: string | null;
  scope: string | null;
  lastError: string | null;
}

export interface GscDashboardData {
  connection: GscConnectionStatus;
  performance: GscPeriodComparison | null;
  opportunities: { critical: number; warning: number; opportunity: number };
}

// ---------------------------------------------------------------------
// STEP 4 — Keyword & Search-Intent Intelligence types.
// ---------------------------------------------------------------------

/** One row of Search Console's query+page+country+device breakdown
 * (Task 1) — a flatter, named view over GscRow for this specific
 * dimension combination, since keys[0..3] by position would be fragile
 * to read at every call site. */
export interface QueryPageRow {
  query: string;
  page: string; // full URL, as GSC returns it
  country: string;
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** Task 2 — one query's mapping onto the page(s) that rank for it. */
export interface QueryPageMapping {
  query: string;
  searchIntent: SearchIntent;
  primaryPage: string; // the page with the most clicks (falling back to most impressions) for this query
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  /** Every distinct page GSC recorded impressions for on this query —
   * length > 1 is what Task 2/5's cannibalization signal is built from. */
  competingPages: string[];
  /** 0-1 keyword-overlap between the query terms and the primary page's
   * title/H1/URL — a simple, honest, explainable relevance signal, not a
   * claim of true semantic relevance (Task 2's "page relevance"). */
  pageRelevance: number;
}

/** Lightweight row for dashboard lists (Task 10) — avoids repeating full
 * SeoIssue objects in every list the dashboard shows. */
export interface KeywordSummaryRow {
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  searchIntent: SearchIntent;
}

export interface KeywordOpportunitySummaryItem {
  query?: string;
  page: string | null;
  issueType: SeoIssueType;
  severity: IssueSeverity;
  message: string;
  opportunityScore: number | null;
}

export interface KeywordIntelligenceSummary {
  analyzedAt: string | null;
  queriesAnalyzed: number;
  pagesAnalyzed: number;
  topQueries: KeywordSummaryRow[]; // by clicks
  highestImpressionQueries: KeywordSummaryRow[]; // by impressions
  lowCtrOpportunities: KeywordOpportunitySummaryItem[];
  rankingOpportunities: KeywordOpportunitySummaryItem[];
  cannibalizationSignals: KeywordOpportunitySummaryItem[];
  serviceOpportunities: KeywordOpportunitySummaryItem[];
  locationOpportunities: KeywordOpportunitySummaryItem[];
  averageOpportunityScore: number | null;
  intentBreakdown: Record<SearchIntent, number>;
}
