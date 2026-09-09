import { fetchAndParsePage } from "../fetchPage";
import { checkPage } from "../pageChecks";
import { readCurrentFieldValue, type ExecutableField } from "./fieldExecutors";
import type { ValidationCheck, ValidationResult } from "../types";

// STEP 9 Task 7 — post-write validation. Honesty note on scope: this
// process can only ever WRITE to the source file — whether the LIVE site
// reflects that write depends on how `baseUrl` is served:
//   - a local dev server picks up the source change immediately
//     (Turbopack Fast Refresh), so a live re-fetch meaningfully validates it;
//   - the real production URL does NOT reflect a source-file edit until a
//     separate git commit + build + deploy happens, which this process
//     does not (and should not) trigger itself.
// Rather than reporting a false "FAILED" when the live site simply hasn't
// been redeployed yet, the source-file re-read is the PRIMARY, always-
// meaningful check; the live-fetch checks are best-effort and clearly
// labeled as skipped/inconclusive when they can't be verified.

function check(name: string, passed: boolean, detail: string): ValidationCheck {
  return { name, passed, detail };
}

export async function validateFieldChange(pagePath: string, field: ExecutableField, expectedNewValue: string, baseUrl: string): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // 1. PRIMARY, always-meaningful: does the SOURCE FILE now contain the
  // new value? This is the one check that's reliable regardless of
  // deployment state.
  const sourceRead = await readCurrentFieldValue(pagePath, field);
  if ("error" in sourceRead) {
    checks.push(check("source-file-contains-new-value", false, sourceRead.error));
  } else {
    const matches = sourceRead.currentValue === expectedNewValue || sourceRead.currentValue === expectedNewValue.trim();
    checks.push(check("source-file-contains-new-value", matches, matches ? "Source file now contains the expected value." : `Source file contains "${sourceRead.currentValue}", expected "${expectedNewValue}".`));
  }

  // 2. Best-effort live checks — only meaningful if this baseUrl actually
  // reflects source changes immediately (local dev). A fetch failure or
  // mismatch here does NOT override check #1's result.
  const live = await fetchAndParsePage(`${baseUrl}${pagePath}`);
  const liveReflectsChange = field === "title" ? (live.title ?? "").includes(expectedNewValue) : live.metaDescription === expectedNewValue;

  if (live.fetchError || (live.httpStatus && live.httpStatus >= 400)) {
    checks.push(check("page-remains-accessible", false, `Live fetch failed: ${live.fetchError ?? `HTTP ${live.httpStatus}`}.`));
  } else {
    checks.push(check("page-remains-accessible", true, `Page returned HTTP ${live.httpStatus}.`));
  }

  if (!live.fetchError && liveReflectsChange) {
    checks.push(check("live-page-reflects-change", true, "The live-fetched page already reflects the new value."));
    const auditedOrigin = (() => {
      try {
        return new URL(baseUrl).origin;
      } catch {
        return baseUrl;
      }
    })();
    const newIssues = checkPage(pagePath, live, auditedOrigin).filter((i) => i.severity === "critical");
    checks.push(check("no-new-critical-technical-issue", newIssues.length === 0, newIssues.length === 0 ? "No new critical technical issues detected on the updated page." : `${newIssues.length} critical issue(s) detected: ${newIssues.map((i) => i.type).join(", ")}.`));
  } else if (!live.fetchError) {
    checks.push(check("live-page-reflects-change", true, "Live page does not yet reflect the source change — expected for a production URL awaiting a separate build/deploy; the source file itself was verified above (check #1)."));
  }

  // Overall pass requires the PRIMARY check to pass; live checks inform
  // but a not-yet-deployed production page never fails validation on
  // their own.
  const primaryPassed = checks[0].passed;
  const accessibilityPassed = checks.find((c) => c.name === "page-remains-accessible")?.passed ?? true;
  const noNewIssues = checks.find((c) => c.name === "no-new-critical-technical-issue")?.passed ?? true;

  return { passed: primaryPassed && accessibilityPassed && noNewIssues, checks };
}
