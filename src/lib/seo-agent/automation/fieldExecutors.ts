import { promises as fs } from "fs";
import path from "path";
import { LIVE_ROUTES, SEO_CONFIG } from "../config";
import { isProtectedPath } from "../protectedPaths";

// STEP 9 Task 5/6 — the ONLY module in the entire SEO Agent that writes
// to a real website source file. Scoped deliberately narrow: title and
// meta description ONLY, and ONLY for pages whose route has its own
// `export const metadata` block in its own page.tsx (verified against
// LIVE_ROUTES, the same real-route registry every other step already
// uses — never operates on a path that isn't a known real page). The
// homepage ("/") is excluded: its title/description come from the ROOT
// layout.tsx's shared default, and editing that would affect the whole
// site's fallback metadata, not one page — outside this step's
// "single approved change to one page" scope.
//
// H1/heading, internal-link, alt-text, and anchor-text recommendations
// are NOT auto-executable here even though earlier steps detect/
// recommend them: this codebase's actual page structure makes them
// unsafe to locate-and-replace generically (headings are frequently
// passed as PROPS to shared components — e.g. <SectionHeading title="..."/>
// — rather than literal <h1> text; alt text is frequently a reference
// into a shared src/lib/media.ts config object, not an inline string).
// Guessing at either risks silently editing the wrong thing or
// corrupting a source file — automation/execution.ts honestly fails
// those with "automated execution not supported for this field type"
// rather than attempting a fragile match.

export type ExecutableField = "title" | "meta-description";

/** Vercel's deployed serverless functions have a READ-ONLY filesystem
 * (except /tmp) — a source-file write that works in local dev will fail
 * there with EROFS. Checked explicitly so that failure is a clear,
 * honest message instead of a confusing raw filesystem error; `VERCEL`
 * is a standard env var Vercel sets on every deployment. */
export function isWritableEnvironment(): boolean {
  return process.env.VERCEL !== "1";
}

function normalizePath(p: string): string {
  const stripped = p.split("?")[0].split("#")[0];
  return stripped.length > 1 && stripped.endsWith("/") ? stripped.slice(0, -1) : stripped || "/";
}

/** Maps a real, already-known route to its page.tsx file — never
 * constructs a path from unvalidated input. Returns null for the
 * homepage (no per-page metadata block to safely target) and for
 * anything not in LIVE_ROUTES. */
export function pagePathToSourceFile(pagePath: string): string | null {
  const normalized = normalizePath(pagePath);
  if (normalized === "/") return null;
  const route = LIVE_ROUTES.find((r) => normalizePath(r.path) === normalized);
  if (!route) return null;
  const relative = path.join("src", "app", ...normalized.split("/").filter(Boolean), "page.tsx");
  // turbopackIgnore: this dynamic path is never used to require/import a
  // module (only fs.readFile/writeFile via the runtime `fs` import
  // above) — Turbopack's bundler can't tell that from static analysis
  // alone and would otherwise trace/ship the whole project's source into
  // the deployed function. isWritableEnvironment() already refuses to
  // touch the filesystem at all on Vercel, where this path is never
  // actually read or written.
  const absolute = path.join(/* turbopackIgnore: true */ process.cwd(), relative);
  // Defense in depth: confirm the resolved path is still inside src/app
  // and isn't a protected path, even though page content files aren't in
  // PROTECTED_PATH_PATTERNS today — never trust a single check alone.
  if (!absolute.startsWith(path.join(process.cwd(), "src", "app"))) return null;
  if (isProtectedPath(relative)) return null;
  return absolute;
}

/** Undoes Next.js's KNOWN title template (layout.tsx: `"%s | ${SITE_NAME}"`)
 * — not a guess, a deterministic reversal of a transformation whose exact
 * shape is read from the same config every other step already uses. */
function stripTitleSuffix(title: string): string {
  const suffix = ` | ${SEO_CONFIG.siteName}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

function fieldKey(field: ExecutableField): "title" | "description" {
  return field === "title" ? "title" : "description";
}

function extractMetadataBlock(source: string): { block: string; start: number; end: number } | null {
  const match = source.match(/export const metadata:\s*Metadata\s*=\s*\{[\s\S]*?\n\};/);
  if (!match || match.index === undefined) return null;
  return { block: match[0], start: match.index, end: match.index + match[0].length };
}

function findFieldValue(block: string, key: "title" | "description"): { value: string; quote: string; quoteStart: number; quoteEnd: number } | null {
  const re = new RegExp(`${key}:\\s*(["'])([\\s\\S]*?)\\1`);
  const m = block.match(re);
  if (!m || m.index === undefined) return null;
  const quote = m[1];
  const valueStart = m.index + m[0].indexOf(quote) + 1;
  return { value: m[2], quote, quoteStart: valueStart, quoteEnd: valueStart + m[2].length };
}

export interface FieldReadResult {
  filePath: string;
  currentValue: string;
}

export async function readCurrentFieldValue(pagePath: string, field: ExecutableField): Promise<FieldReadResult | { error: string }> {
  const filePath = pagePathToSourceFile(pagePath);
  if (!filePath) return { error: `No safely-editable source file found for ${pagePath}.` };
  let source: string;
  try {
    // turbopackIgnore: read-only lookup used for validation/re-review
    // checks — see applyFieldChange's identical comment for why this
    // dynamic path is safe to exclude from build-time tracing.
    source = await fs.readFile(/* turbopackIgnore: true */ filePath, "utf-8");
  } catch {
    return { error: `Could not read source file for ${pagePath}.` };
  }
  const metadataBlock = extractMetadataBlock(source);
  if (!metadataBlock) return { error: `No metadata export found in the source file for ${pagePath}.` };
  const found = findFieldValue(metadataBlock.block, fieldKey(field));
  if (!found) return { error: `${field} field not found in ${pagePath}'s metadata.` };
  return { filePath, currentValue: found.value };
}

export interface FieldWriteResult {
  success: boolean;
  filePath?: string;
  previousValue?: string;
  error?: string;
  /** Task 5 — true specifically when the failure was "the live value no
   * longer matches what the recommendation was based on", which must
   * route to re-review rather than a generic FAILED status. */
  stale?: boolean;
}

/** Task 5's exact-match staleness check happens HERE: `expectedCurrent`
 * must match the value actually found in the file (after undoing the
 * title-template transformation, for the title field) EXACTLY — if it
 * doesn't, this returns failure with a clear reason instead of writing
 * anything. Only ever replaces the ONE regex-located field span inside
 * the metadata block, never a broader find/replace over the file. */
export async function applyFieldChange(pagePath: string, field: ExecutableField, expectedCurrent: string, newValue: string): Promise<FieldWriteResult> {
  if (!isWritableEnvironment()) {
    return { success: false, error: "Automated execution requires a writable filesystem (local dev / self-hosted). Vercel's deployed serverless functions are read-only at runtime — apply this change manually and redeploy, or run execution from a local environment against the repository." };
  }
  const filePath = pagePathToSourceFile(pagePath);
  if (!filePath) return { success: false, error: `No safely-editable source file for ${pagePath} (homepage or unrecognized route).` };

  let source: string;
  try {
    // turbopackIgnore: see pagePathToSourceFile's comment — this dynamic
    // path is bounded to real LIVE_ROUTES pages and only ever read/
    // written here (never require/import'd), and isWritableEnvironment()
    // above already refuses to reach this line at all on Vercel.
    source = await fs.readFile(/* turbopackIgnore: true */ filePath, "utf-8");
  } catch {
    return { success: false, error: `Could not read source file for ${pagePath}.` };
  }

  const metadataBlock = extractMetadataBlock(source);
  if (!metadataBlock) return { success: false, error: `No metadata export found in ${pagePath}'s source file.` };

  const key = fieldKey(field);
  const found = findFieldValue(metadataBlock.block, key);
  if (!found) return { success: false, error: `${field} field not found in ${pagePath}'s metadata block.` };

  const actualCurrent = found.value;
  const expectedNormalized = field === "title" ? stripTitleSuffix(expectedCurrent) : expectedCurrent;
  const newValueNormalized = field === "title" ? stripTitleSuffix(newValue) : newValue;

  if (actualCurrent !== expectedNormalized) {
    return {
      success: false,
      stale: true,
      error: `Current ${field} in the source file ("${actualCurrent}") does not match the value the recommendation was based on ("${expectedNormalized}") — the page may have changed since detection. Execution stopped; re-review required.`,
    };
  }

  if (actualCurrent === newValueNormalized) {
    return { success: false, error: `Current and recommended ${field} are already identical — nothing to change.` };
  }

  // Never attempt to escape a quote character into the new value — if it
  // contains the SAME quote character the source uses to delimit this
  // string, refuse rather than risk producing invalid TypeScript syntax.
  if (newValueNormalized.includes(found.quote)) {
    return { success: false, error: `Recommended ${field} contains a ${found.quote} character matching the source file's string delimiter — refusing to write it automatically to avoid corrupting the file. Apply this one manually.` };
  }

  const before = metadataBlock.block.slice(0, found.quoteStart);
  const after = metadataBlock.block.slice(found.quoteEnd);
  const newBlock = before + newValueNormalized + after;
  const newSource = source.slice(0, metadataBlock.start) + newBlock + source.slice(metadataBlock.end);

  try {
    // turbopackIgnore: same reasoning as the fs.readFile call above.
    await fs.writeFile(/* turbopackIgnore: true */ filePath, newSource, "utf-8");
  } catch (err) {
    return { success: false, error: `Failed to write source file: ${err instanceof Error ? err.message : "unknown error"}.` };
  }

  return { success: true, filePath, previousValue: actualCurrent };
}
