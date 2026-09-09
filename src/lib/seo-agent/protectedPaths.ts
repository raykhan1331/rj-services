// STEP 2 Task 4 — protection system. Nothing in this codebase currently
// modifies files automatically (the SEO Agent only reads/reports through
// Step 2), but this guard exists now so that any future automation
// (Step 3+) has a hard, checkable boundary before it can be trusted to
// touch a file at all.
//
// Patterns are matched against a path relative to the project root (e.g.
// "src/lib/ai/responder.ts"), using simple glob-style `*`/`**` wildcards.
// Note: this project has no authentication or payment functionality
// today — those categories are listed anyway so the guard is already
// correct if/when either is ever added.

export const PROTECTED_PATH_PATTERNS: string[] = [
  // AI Assistant / chatbot — must never be touched by the SEO Agent.
  "src/lib/ai/**",
  "src/components/chat/**",
  "src/app/api/assistant/**",
  "src/app/ai-assistant/**",

  // Lead capture / customer data.
  "src/lib/leads/**",
  "src/app/api/leads/**",
  "src/components/services/ContactForm.tsx",
  "src/components/services/EnquiryForm.tsx",
  "data/**",

  // WhatsApp sub-agent / notifications.
  "src/lib/whatsapp/**",
  "src/app/api/whatsapp/**",

  // Official-source knowledge sync pipeline (feeds the AI assistant).
  "src/lib/knowledge/**",
  "src/app/api/knowledge/**",

  // Credentials, environment variables, and deployment/config files.
  ".env*",
  ".vercel/**",
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",

  // Authentication and payment functionality — none exists in this
  // project today; listed so the guard stays correct if either is added.
  "src/lib/auth/**",
  "src/lib/payments/**",
  "src/app/api/auth/**",
  "src/app/api/payments/**",
  "src/app/api/webhooks/**",
];

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // escape regex specials except * ?
    .replace(/\*\*/g, "§DOUBLESTAR§")
    .replace(/\*/g, "[^/]*")
    .replace(/§DOUBLESTAR§/g, ".*");
  return new RegExp(`^${escaped}$`);
}

const PROTECTED_REGEXPS = PROTECTED_PATH_PATTERNS.map((p) => ({ pattern: p, regex: globToRegExp(p) }));

/** Normalizes a path (backslashes, leading "./") and checks it against
 * every protected pattern. Returns the matching pattern for a clear audit
 * trail, or null if the path is not protected. */
export function isProtectedPath(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
  for (const { pattern, regex } of PROTECTED_REGEXPS) {
    if (regex.test(normalized)) return pattern;
  }
  return null;
}

/** Throws if `filePath` is protected. Any future code-modifying
 * automation must call this before writing to a file. */
export function assertNotProtected(filePath: string): void {
  const matched = isProtectedPath(filePath);
  if (matched) {
    throw new Error(`SEO Agent refused to modify protected path "${filePath}" (matched pattern "${matched}").`);
  }
}
