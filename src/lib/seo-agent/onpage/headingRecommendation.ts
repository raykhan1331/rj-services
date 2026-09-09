import { SEO_CONFIG } from "../config";
import { matchedService, type OnPageContext } from "./metadataRecommendation";
import type { SeoIssue } from "../types";

// STEP 6 Task 4 — H1 recommendations, deliberately limited to the two
// objectively-detectable, reliable problems: a missing H1, or multiple
// H1s. An earlier version of this module also flagged "H1 doesn't share
// wording with the matched service label" — dropped after live testing
// showed it firing on this site's normal, deliberately natural-language
// H1s ("Talk to Us Before You Decide", "Grow Your Online Presence") and
// recommending they be replaced with bland, literal service labels
// ("Consultation", "Digital Services"). A token-overlap heuristic can't
// tell "topically fine but naturally worded" apart from "genuinely off
// topic," and recommending the wrong fix there would be a real quality
// regression (Task 16: never optimize at the expense of users). Heading
// HIERARCHY problems (missing H2s, H3-before-H2 skips) are already fully
// covered by STEP 1/5's no-subheadings and heading-hierarchy-skip checks
// — not duplicated here.

export function recommendHeading(ctx: OnPageContext): SeoIssue | null {
  const hasMissingH1 = ctx.existingIssueTypes.has("missing-h1");
  const hasMultipleH1 = ctx.existingIssueTypes.has("multiple-h1");
  if (!hasMissingH1 && !hasMultipleH1) return null;

  const service = matchedService(ctx.path);
  // Prefer the page's own real title (stripped of the " | site name"
  // suffix) as the fallback source of real wording — a much safer bet
  // than the bare service label or site name, which risks being a worse
  // heading than genuinely-present title copy.
  const titleWithoutSuffix = ctx.parsed.title?.split(" | ")[0]?.trim();
  const recommended = service?.label ?? titleWithoutSuffix ?? SEO_CONFIG.siteName;

  const h1 = ctx.parsed.h1s[0] ?? null;
  if (h1 === recommended) return null;

  const reason = hasMissingH1 ? "page has no H1 heading" : "page has multiple H1 headings, which dilutes topical clarity";

  return {
    type: "heading-recommendation",
    source: "audit",
    severity: hasMissingH1 ? "critical" : "warning",
    category: "on-page",
    page: ctx.path,
    message: `Recommended H1 update for ${ctx.path}: ${reason}.`,
    evidence: h1 ?? "(no H1)",
    recommendedValue: recommended,
    evidenceBasis: "on-page-only",
  };
}
