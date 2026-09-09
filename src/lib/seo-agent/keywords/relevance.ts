// STEP 4 — a small, honest keyword-overlap relevance signal reused by
// query→page mapping (Task 2), opportunity scoring (Task 8), and
// service/location matching (Tasks 6/7). Deliberately simple: it counts
// how many of the query's meaningful words appear in the target text,
// nothing more — this is presented everywhere as "keyword overlap", not
// a claim of true semantic/topical relevance.

const STOPWORDS = new Set([
  "a", "an", "the", "for", "and", "or", "of", "to", "in", "on", "at", "is", "are",
  "how", "what", "why", "do", "does", "i", "my", "your", "with", "near", "me",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Fraction (0-1) of `query`'s meaningful tokens that appear anywhere in
 * `text`. 0 tokens in the query (e.g. after stopword removal) returns 0
 * rather than dividing by zero. */
export function keywordOverlap(query: string, text: string): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;
  const textTokens = new Set(tokenize(text));
  const matched = queryTokens.filter((t) => textTokens.has(t)).length;
  return matched / queryTokens.length;
}

/** Combines a page's title/H1/URL path into one relevance target — the
 * fields most indicative of what a page is actually about. */
export function pageRelevanceText(page: { title?: string | null; h1s?: string[]; path?: string }): string {
  return [page.title ?? "", ...(page.h1s ?? []), (page.path ?? "").replace(/[-/]/g, " ")].join(" ");
}
