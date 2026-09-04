// Heuristic requirement extraction: pull the sentence-like fragments that
// actually mention a document, identity, or eligibility requirement out of
// a page's plain text, so the knowledge record stores something usable
// instead of the whole raw page.

const REQUIREMENT_KEYWORDS = [
  "passport", "driving licence", "driver's licence", "photo id", "national id",
  "proof of address", "utility bill", "bank statement", "council tax",
  "certificate of incorporation", "companies house", "psc", "beneficial owner",
  "director", "shareholder", "selfie", "identity verification", "proof of identity",
  "registered address", "trading address", "tenancy agreement", "date of birth",
  "nationality", "eligib", "sic code",
];

export function extractRequirements(text: string): string[] {
  const chunks = text.split(/(?<=[.!?])\s+/);
  const seen = new Set<string>();
  const results: string[] = [];

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (trimmed.length < 15 || trimmed.length > 240) continue;
    const lower = trimmed.toLowerCase();
    if (REQUIREMENT_KEYWORDS.some((k) => lower.includes(k)) && !seen.has(lower)) {
      seen.add(lower);
      results.push(trimmed);
    }
    if (results.length >= 12) break;
  }

  return results;
}
