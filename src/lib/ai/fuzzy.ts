// Lightweight typo tolerance for the local intent engine. Real customers
// make spelling mistakes ("compnay", "doucments", "mendatory") — the rest
// of the intent-detection logic matches on exact keywords, so this module
// corrects a message toward its nearest known business term *before* those
// regexes run, rather than trying to make every regex fuzzy-aware.

const DICTIONARY = [
  "company", "companies", "document", "documents", "documentation", "information",
  "formation", "register", "registered", "registering", "registration",
  "mandatory", "required", "requirement", "requirements", "business", "personal",
  "account", "accounts", "bank", "banking", "need", "needed", "provide", "provides",
  "forming", "formed", "first", "either", "also", "inside", "outside",
];

// Damerau-Levenshtein: counts an adjacent letter swap ("alos" -> "also") as
// a single edit, matching how people actually mistype words, rather than
// the two edits plain Levenshtein would charge for a transposition.
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

function closestDictionaryWord(word: string): string | null {
  if (word.length < 4) return null; // too short to fuzzy-match safely
  let best: string | null = null;
  let bestDist = Infinity;
  const maxDist = word.length >= 7 ? 2 : 1;

  for (const candidate of DICTIONARY) {
    if (Math.abs(candidate.length - word.length) > maxDist) continue;
    if (candidate === word) return word; // already correct
    const dist = levenshtein(word, candidate);
    if (dist <= maxDist && dist < bestDist) {
      best = candidate;
      bestDist = dist;
    }
  }
  return best;
}

/** Corrects near-miss spellings of common business terms toward their canonical form. */
export function normalizeTypos(text: string): string {
  return text
    .split(/(\s+)/)
    .map((token) => {
      const word = token.trim().toLowerCase().replace(/[^a-z]/g, "");
      if (!word) return token;
      const match = closestDictionaryWord(word);
      if (match && match !== word) {
        // Preserve surrounding punctuation/whitespace, swap only the letters.
        return token.toLowerCase().replace(word, match);
      }
      return token;
    })
    .join("");
}
