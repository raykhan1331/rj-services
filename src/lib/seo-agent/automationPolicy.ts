import type { AutomationTier, RiskLevel, SeoIssue, SeoIssueType } from "./types";

// STEP 2 Task 6 — the three-tier classification the user specified,
// applied to every issue type our deterministic checks can raise. The
// three top-level buckets below are documentation of the POLICY itself;
// ISSUE_CATALOG is what actually drives classification per issue type.
//
// Nothing in this codebase ever executes a "requires-approval" or
// "never-automate" action automatically — see SAFE_AUTOMATION_RULES in
// config.ts and the action queue (actionQueue.ts), which only ever
// produces status "pending" items for a human to decide on.
export const AUTOMATION_POLICY = {
  safe: [
    "Missing alt text",
    "Missing meta description",
    "Basic metadata improvements (titles, descriptions within existing length rules)",
    "Internal-link suggestions",
    "Schema/structured-data suggestions",
  ],
  requiresApproval: [
    "Changing URLs",
    "Redirects",
    "Deleting content",
    "Creating new pages",
    "Major content rewriting",
    "Changing important existing headings (H1/H2 structure)",
    "Changing canonical URLs",
  ],
  neverAutomate: [
    "Paid backlinks",
    "Spam links",
    "Fake reviews",
    "Keyword stuffing",
    "Cloaking",
    "Hidden text",
    "Mass low-quality AI-generated pages",
    "Deceptive SEO techniques",
  ],
} as const;

interface IssueCatalogEntry {
  tier: AutomationTier;
  riskLevel: RiskLevel;
  recommendedSolution: string;
  expectedBenefit: string;
}

// One entry per SeoIssueType (types.ts). Adding something that doesn't
// exist yet is "basic metadata improvements" / safe; rewriting or
// removing something that already exists, or anything touching
// URLs/canonicals/robots/sitemap infrastructure, defaults to
// requires-approval — the conservative reading of the policy above.
const ISSUE_CATALOG: Record<SeoIssueType, IssueCatalogEntry> = {
  "fetch-failed": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Investigate why the page failed to load (server error, network issue, or deployment problem) and fix the underlying cause.",
    expectedBenefit: "Restores a page search engines and users currently cannot reach at all.",
  },
  "http-error": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Investigate the failing route; fix the error, or add a permanent redirect if the page was intentionally removed.",
    expectedBenefit: "Prevents search engines from dropping this URL from the index and users from hitting a dead page.",
  },
  "noindex-meta": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Remove the noindex directive if this page should be indexed, or confirm it is intentional.",
    expectedBenefit: "Allows an important page to appear in search results.",
  },
  "missing-canonical": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Add a self-referencing canonical tag for this page.",
    expectedBenefit: "Removes ambiguity for search engines about which URL is authoritative.",
  },
  "canonical-origin-mismatch": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Set NEXT_PUBLIC_SITE_URL to the production domain in the deployment environment and redeploy.",
    expectedBenefit: "Fixes canonical tags site-wide so search engines index the real production URLs instead of a local/dev address.",
  },
  "missing-title": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Add a descriptive <title> for this page.",
    expectedBenefit: "Titles are the primary text shown in search results; a missing one hurts click-through and rankings.",
  },
  "title-length": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Adjust the title length to the recommended range so it doesn't get truncated or read as too thin.",
    expectedBenefit: "Improves how the page appears in search results.",
  },
  "missing-meta-description": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Add a meta description summarizing the page's content and value.",
    expectedBenefit: "Improves click-through rate from search results.",
  },
  "meta-description-length": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Adjust the meta description length to the recommended range.",
    expectedBenefit: "Avoids truncation in search results and improves click-through.",
  },
  "missing-h1": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Add a single, descriptive H1 heading that matches the page's main topic.",
    expectedBenefit: "H1 is a strong on-page relevance signal; pages without one are harder for search engines to understand.",
  },
  "multiple-h1": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Reduce to a single H1 and demote the others to H2/H3 as appropriate.",
    expectedBenefit: "Restores a clear heading hierarchy for both search engines and accessibility tools.",
  },
  "no-subheadings": {
    tier: "requires-approval",
    riskLevel: "low",
    recommendedSolution: "Break up the content with H2 subheadings around its main sections.",
    expectedBenefit: "Improves readability and gives search engines clearer topical structure to index.",
  },
  "thin-content": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Expand the page with genuinely useful, specific content about this topic — not filler.",
    expectedBenefit: "Thin pages tend to rank poorly; more substantive content gives search engines more to match against queries.",
  },
  "missing-alt-text": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Add descriptive alt text to the images listed in the evidence field.",
    expectedBenefit: "Improves accessibility and gives search engines context for image search / general relevance.",
  },
  "low-internal-links": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Add links to related service or content pages from this page's existing copy.",
    expectedBenefit: "Spreads link authority through the site and helps search engines discover related pages.",
  },
  "no-structured-data": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Add relevant JSON-LD structured data (e.g. Service, Organization, or BreadcrumbList schema).",
    expectedBenefit: "Can unlock rich results in search and gives search engines an unambiguous description of the page.",
  },
  "duplicate-title": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Write a unique, specific title for this page instead of reusing another page's title.",
    expectedBenefit: "Helps search engines and users tell the pages apart instead of treating them as near-duplicates.",
  },
  "duplicate-meta-description": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Write a unique meta description for this page.",
    expectedBenefit: "Improves click-through by describing this specific page rather than a generic duplicate.",
  },
  "orphan-page": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Add at least one internal link to this page from a relevant, already-indexed page.",
    expectedBenefit: "Orphan pages are harder for search engines to discover and rank; linking to it fixes that.",
  },
  "sitemap-unreachable": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Investigate why /sitemap.xml is failing to load and fix the underlying route/deployment issue.",
    expectedBenefit: "Restores the primary discovery mechanism search engines use to find every page on the site.",
  },
  "sitemap-empty": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Check the sitemap generation logic (src/app/sitemap.ts) for a bug producing zero entries.",
    expectedBenefit: "Restores sitemap-based discovery of every page on the site.",
  },
  "sitemap-origin-mismatch": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Set NEXT_PUBLIC_SITE_URL to the production domain in the deployment environment and redeploy.",
    expectedBenefit: "Search engines can actually reach the URLs listed in the sitemap instead of a local/dev address.",
  },
  "robots-unreachable": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Investigate why /robots.txt is failing to load and fix the underlying route/deployment issue.",
    expectedBenefit: "Restores crawler access rules and the sitemap pointer search engines rely on.",
  },
  "robots-missing-sitemap-ref": {
    tier: "requires-approval",
    riskLevel: "low",
    recommendedSolution: "Add a Sitemap: directive to robots.txt (src/app/robots.ts) pointing at the real sitemap URL.",
    expectedBenefit: "Gives search engines a direct pointer to the sitemap during their first crawl.",
  },
  "robots-sitemap-origin-mismatch": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Set NEXT_PUBLIC_SITE_URL to the production domain in the deployment environment and redeploy.",
    expectedBenefit: "Same root-cause fix as the sitemap.xml origin mismatch — resolves both together.",
  },
  "robots-invalid-sitemap-url": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Fix the Sitemap: directive in robots.txt so it is a valid absolute URL.",
    expectedBenefit: "Ensures search engines can actually follow the sitemap reference.",
  },
  "robots-disallow-all": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Remove the site-wide Disallow: / rule from robots.txt unless intentionally blocking all crawlers.",
    expectedBenefit: "Without this fix, no page on the site can be indexed at all — this is the highest-impact possible issue.",
  },

  // --- STEP 3 — Search Console-derived issue types (Task 4/6) ---
  "gsc-high-impressions-low-ctr": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Rewrite the page's title and/or meta description to be more compelling for this query — the page is being shown often but rarely clicked.",
    expectedBenefit: "Improving CTR on an already-visible page/query is one of the highest-leverage SEO wins available, since impressions are already there.",
  },
  "gsc-poor-position": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Strengthen the page's on-page content and internal linking for this query — it's earning impressions but ranking too low to be clicked much.",
    expectedBenefit: "Improving ranking position for a query that already generates impressions can meaningfully increase clicks.",
  },
  "gsc-declining-clicks": {
    tier: "requires-approval",
    riskLevel: "low",
    recommendedSolution: "Investigate this page/query's recent performance — check for content staleness, new competing pages, or a ranking drop.",
    expectedBenefit: "Catching a decline early prevents further loss of organic traffic.",
  },
  "gsc-declining-impressions": {
    tier: "requires-approval",
    riskLevel: "low",
    recommendedSolution: "Investigate why this page/query's visibility is dropping — check indexability, ranking, and whether the query's own search volume changed.",
    expectedBenefit: "Declining impressions often precede declining clicks — catching it early gives more time to respond.",
  },
  "gsc-high-performer-link-opportunity": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Add internal links from other relevant pages to this high-performing page (and from it to related pages) to spread its ranking strength.",
    expectedBenefit: "Concentrates more internal link authority around a page that's already proven it can rank and convert clicks.",
  },

  // --- STEP 4 — Keyword & Search-Intent Intelligence issue types
  // (Task 4/5/6/7). Every item generated from these types is ALSO forced
  // to action-queue status "review-required" regardless of tier (see
  // actionQueue.ts's generateKeywordActionQueue) — Task 9 is explicit
  // that keyword recommendations always start requiring human review,
  // with no "safe"-tier exception. The tier/riskLevel below still records
  // an honest classification for future reference. ---
  "keyword-ranking-improvement": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Strengthen this page's on-page content, headings, and internal links around this query — it's realistically within reach of a better position.",
    expectedBenefit: "Moving from page 1 (below top 3) or page 2 into a higher position typically increases clicks meaningfully for an already-relevant page.",
  },
  "keyword-page-optimization": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Review and strengthen this page's content depth, title, and headings for this query — it has real search demand but sits on page 2 of results.",
    expectedBenefit: "Page-2 rankings with real impressions are close to page-1 visibility, where click-through rates rise sharply.",
  },
  "keyword-successful-topic": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Add more internal links to and from this page, and consider expanding related content — this topic is already proven to convert impressions into clicks.",
    expectedBenefit: "Reinforces a topic that already works, and can help related/nearby queries benefit from the same page's authority.",
  },
  "keyword-cannibalization": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Review whether these pages should each target a distinct sub-intent, or whether one should become the single authoritative page (with the other adjusted or internally linked to it, never automatically deleted).",
    expectedBenefit: "Resolving cannibalization usually consolidates ranking strength onto one strong page instead of splitting it across several weaker ones.",
  },
  "keyword-relevance-investigate": {
    tier: "requires-approval",
    riskLevel: "low",
    recommendedSolution: "Check the actual search-results snippet (title/description as Google renders them) and confirm the page genuinely matches what searchers expect for this query.",
    expectedBenefit: "Identifies whether the issue is a metadata/snippet problem, a genuine intent mismatch, or a ranking/visibility issue.",
  },
  "keyword-service-match": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Review the matched service page's content and metadata against this query's actual performance — strengthen it if demand is high but ranking is weak, or leave as-is if it's already performing well.",
    expectedBenefit: "Aligns SEO effort with services that have proven, measurable search demand rather than guesswork.",
  },
  "keyword-location-opportunity": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Review whether the matched service page adequately addresses this UK/Pakistan-specific search — reinforcing existing copy is preferred over creating a new page.",
    expectedBenefit: "Captures genuine local search demand in the business's real target markets without resorting to thin or duplicate location pages.",
  },

  // --- STEP 5 — Technical SEO Monitoring Engine issue types (Task 1/7).
  // Every item generated from these types is ALSO forced to action-queue
  // status "review-required" (Task 6's explicit default), same override
  // pattern as STEP 4's keyword-intelligence items — see runAudit.ts and
  // gsc/runGscAnalysis.ts. ---
  "broken-internal-link": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Update the link's href to point at the correct real route (see evidence for the broken path(s)).",
    expectedBenefit: "Prevents visitors and search engine crawlers from hitting a dead link, which wastes crawl budget and hurts user experience.",
  },
  "insecure-external-link": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Update the link to use https:// if the target site supports it.",
    expectedBenefit: "Minor trust/best-practice improvement; avoids mixed-content warnings in some browser contexts.",
  },
  "missing-og-metadata": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Add the missing og:title/og:description/og:url tags (see evidence for which are missing).",
    expectedBenefit: "Improves how the page appears when shared on social platforms, which indirectly supports discovery and click-through.",
  },
  "heading-hierarchy-skip": {
    tier: "requires-approval",
    riskLevel: "low",
    recommendedSolution: "Add an H2 before the existing H3s, or promote the H3s to H2 as appropriate, to restore a proper heading hierarchy.",
    expectedBenefit: "Improves accessibility (screen readers rely on heading order) and gives search engines a clearer content structure.",
  },
  "canonical-target-invalid": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Fix the canonical tag to point at a real, existing URL on this site — investigate why it currently points to a non-existent path.",
    expectedBenefit: "Prevents search engines from being told the authoritative version of this page doesn't exist, which can suppress indexing entirely.",
  },
  "canonical-points-elsewhere": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Confirm whether canonicalizing to the other page is intentional; if not, change the canonical to reference this page itself.",
    expectedBenefit: "Resolves ambiguity about which page search engines should treat as authoritative, avoiding accidental de-indexing of this page.",
  },
  "redirect-broken": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Investigate why this configured redirect (next.config.ts) is no longer working and restore it.",
    expectedBenefit: "Prevents visitors and search engines following an old/known URL from hitting a dead page instead of the intended destination.",
  },
  "redirect-target-mismatch": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Update the redirect configuration (next.config.ts) so it points to the intended target.",
    expectedBenefit: "Ensures visitors and link equity land on the correct page rather than an unintended one.",
  },
  "noindex-visible-page": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Investigate why a page with real Search Console visibility now has a noindex directive — remove it if unintentional.",
    expectedBenefit: "Prevents losing an already-proven, search-visible page from the index entirely.",
  },
  "canonical-issue-visible-page": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Prioritize investigating this page's canonical issue — it already has real Search Console visibility, so the impact of leaving it unresolved is higher than for an unvisited page.",
    expectedBenefit: "Protects existing search visibility that a canonical problem could otherwise suppress.",
  },
  "technical-issue-page-declining": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Review this page's newly detected technical issue alongside its Search Console decline — investigate whether they're related before assuming causation.",
    expectedBenefit: "Surfaces a correlation worth investigating early, without asserting a cause that the available data doesn't actually prove.",
  },
  "page-missing-from-search-console": {
    tier: "requires-approval",
    riskLevel: "low",
    recommendedSolution: "Check this page's indexability (robots meta, canonical, sitemap presence) — a prior-visibility page with zero current impressions is worth a manual look.",
    expectedBenefit: "Catches a page that may have silently dropped out of the index before the loss compounds.",
  },

  // --- STEP 6 — On-Page SEO Optimization Engine issue types (Task 11).
  // Task 11 explicitly reclassifies "changing titles/meta descriptions/
  // H1-H2-H3/major content edits" as requires-approval — a narrower reading
  // than STEP 2's original general "basic metadata" guidance, followed here
  // for these specific STEP 6 issue types. "Internal-link suggestions" and
  // "missing alt-text detection" are explicitly listed as safe/low-risk in
  // Task 11, matching STEP 1/2's existing precedent for the equivalent
  // detection-only issue types (low-internal-links, missing-alt-text). ---
  "title-recommendation": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Review the recommended title (see recommendedValue) and apply it manually if it accurately represents the page.",
    expectedBenefit: "A clearer, correctly-sized, non-duplicate title improves how the page appears in search results and its topical match to real search queries.",
  },
  "meta-description-recommendation": {
    tier: "requires-approval",
    riskLevel: "low",
    recommendedSolution: "Review the recommended meta description (see recommendedValue, built only from this page's own real content) and apply it manually if accurate.",
    expectedBenefit: "A description that genuinely reflects the page's content and length improves click-through from search results.",
  },
  "heading-recommendation": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Review the recommended H1 (see recommendedValue) and apply it manually — never overwrite an existing H1 without confirming it still matches the page's actual content.",
    expectedBenefit: "A clear, topic-matching H1 is a strong on-page relevance signal for both users and search engines.",
  },
  "content-intent-recommendation": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Review the linked real Search Console evidence and consider the suggested content/structure improvement — a human should judge what content change (if any) genuinely helps users.",
    expectedBenefit: "Aligns page content with proven, real search demand rather than guesswork, without resorting to thin or unsupported additions.",
  },
  "internal-link-recommendation": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Consider adding the suggested natural internal link (see recommendedValue for the anchor text, linkTarget for the destination) from the source page's existing copy.",
    expectedBenefit: "Improves discoverability and link-authority flow to an under-linked important page, using a topically genuine connection.",
  },
  "alt-text-recommendation": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Review the recommended alt text (see recommendedValue, derived from the image's filename) and apply it if it accurately describes the image; use empty alt text instead if the image is purely decorative.",
    expectedBenefit: "Improves accessibility and gives search engines usable context for the image.",
  },

  // --- STEP 7 — Internal Linking & Content Opportunity Engine issue
  // types (Task 11). "Internal-link suggestions"/"Anchor-text
  // suggestions"/"reports" are explicitly safe/low-risk in Task 11 —
  // generating the RECOMMENDATION is always safe (nothing is ever applied
  // automatically); ACTING on a content-opportunity recommendation means
  // editing or creating content, which Task 11 explicitly puts behind
  // approval. ---
  "internal-link-opportunity": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Consider adding the suggested natural internal link (see recommendedValue for anchor text, linkTarget for the destination) from the source page's existing copy.",
    expectedBenefit: "Improves discoverability and link-authority flow to an under-linked page with real evidence of value.",
  },
  "weak-anchor-text": {
    tier: "safe",
    riskLevel: "low",
    recommendedSolution: "Consider replacing the anchor text with the suggested natural, descriptive alternative (see recommendedValue) — never an exact-match keyword stuffed anchor.",
    expectedBenefit: "Clearer anchor text helps users predict where a link goes and gives search engines better context for the destination page.",
  },
  "content-existing-page-improvement": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Strengthen the existing page's content, headings, or internal links to better satisfy the linked real evidence — never rewrite wholesale without review.",
    expectedBenefit: "Improves an already-relevant page's ability to satisfy real, evidenced search demand.",
  },
  "content-supporting-content-opportunity": {
    tier: "requires-approval",
    riskLevel: "medium",
    recommendedSolution: "Consider adding a supporting FAQ/resource section to the existing service page rather than creating a new page.",
    expectedBenefit: "Strengthens topical coverage for a service with real (if still-developing) search relevance, without page-count sprawl.",
  },
  "content-new-page-opportunity": {
    tier: "requires-approval",
    riskLevel: "high",
    recommendedSolution: "Evaluate carefully whether this represents a genuinely distinct user need before creating any new page — never create a page for a keyword alone.",
    expectedBenefit: "Could capture real, currently-unserved search demand, but only if the resulting page is genuinely useful, not thin or duplicative.",
  },
};

export function classifyIssue(issue: SeoIssue): IssueCatalogEntry {
  return ISSUE_CATALOG[issue.type];
}
