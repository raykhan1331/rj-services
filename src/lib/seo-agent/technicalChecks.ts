import { REDIRECTED_ROUTES, SEO_CONFIG } from "./config";
import { fetchText } from "./fetchPage";
import type { SeoIssue } from "./types";

const REDIRECT_FETCH_TIMEOUT_MS = 10_000;

function normalizePath(p: string): string {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p || "/";
}

/** Fetches with redirect following disabled so the raw 3xx status and
 * Location header are inspectable — fetchText (used everywhere else)
 * follows redirects, which is what audits normally want but is exactly
 * the wrong tool for verifying a redirect itself still works. */
async function fetchRedirectResponse(url: string): Promise<{ status: number | null; location: string | null; error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REDIRECT_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "manual", headers: { "User-Agent": "RJServicesSeoAgent/1.0" } });
    return { status: res.status, location: res.headers.get("location"), error: null };
  } catch (err) {
    return { status: null, location: null, error: err instanceof Error ? err.message : "Unknown fetch error" };
  } finally {
    clearTimeout(timer);
  }
}

/** STEP 5 Task 1 — verifies the site's own small, fixed set of configured
 * redirects (REDIRECTED_ROUTES in config.ts) still actually redirect, and
 * to the expected target. Bounded to exactly those routes (currently 4) —
 * never follows or discovers new redirects, and never crawls anything
 * external, per Task 11's request-budget rule. */
export async function checkRedirects(baseUrl: string = SEO_CONFIG.siteUrl): Promise<{ path: string; expectedTarget: string; issues: SeoIssue[] }[]> {
  return Promise.all(
    REDIRECTED_ROUTES.map(async (route) => {
      const issues: SeoIssue[] = [];
      const expectedTarget = route.redirectsTo ?? "";
      const url = `${baseUrl}${route.path}`;
      const { status, location, error } = await fetchRedirectResponse(url);

      if (error || status === null) {
        issues.push({ type: "redirect-broken", severity: "critical", category: "technical", page: route.path, message: `Configured redirect ${route.path} → ${expectedTarget} is not reachable.`, evidence: error ?? "no response" });
      } else if (status < 300 || status >= 400) {
        issues.push({ type: "redirect-broken", severity: "critical", category: "technical", page: route.path, message: `Configured redirect ${route.path} returned HTTP ${status} instead of redirecting to ${expectedTarget}.`, evidence: `status ${status}` });
      } else if (!location) {
        issues.push({ type: "redirect-broken", severity: "critical", category: "technical", page: route.path, message: `Configured redirect ${route.path} returned a ${status} response with no Location header.` });
      } else {
        let locationPath: string;
        try {
          locationPath = normalizePath(new URL(location, url).pathname);
        } catch {
          locationPath = location;
        }
        if (locationPath !== normalizePath(expectedTarget)) {
          issues.push({
            type: "redirect-target-mismatch",
            severity: "warning",
            category: "technical",
            page: route.path,
            message: `Configured redirect ${route.path} points to ${locationPath}, not the expected ${expectedTarget}.`,
            evidence: `Location: ${location}`,
          });
        }
      }

      return { path: route.path, expectedTarget, issues };
    })
  );
}

export async function checkSitemap(baseUrl: string = SEO_CONFIG.siteUrl): Promise<{ reachable: boolean; url: string; entryCount: number; issues: SeoIssue[] }> {
  const url = `${baseUrl}/sitemap.xml`;
  const issues: SeoIssue[] = [];
  const { status, text, error } = await fetchText(url);

  if (error || !text || (status && status >= 400)) {
    issues.push({ type: "sitemap-unreachable", severity: "critical", category: "technical", message: "sitemap.xml is not reachable.", evidence: error ?? `status ${status}` });
    return { reachable: false, url, entryCount: 0, issues };
  }

  const locs = Array.from(text.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  if (locs.length === 0) {
    issues.push({ type: "sitemap-empty", severity: "critical", category: "technical", message: "sitemap.xml contains no URL entries." });
  }

  // Compare against the origin actually being audited, not just the
  // configured default — this is what catches NEXT_PUBLIC_SITE_URL being
  // unset in production: the sitemap is fetched FROM the live domain but
  // its entries still resolve to a local/dev address.
  const auditedOrigin = new URL(baseUrl).origin;
  const wrongOrigin = locs.filter((loc) => {
    try {
      return new URL(loc).origin !== auditedOrigin;
    } catch {
      return true;
    }
  });
  if (wrongOrigin.length > 0) {
    issues.push({
      type: "sitemap-origin-mismatch",
      severity: "critical",
      category: "technical",
      message: `sitemap.xml (served from ${auditedOrigin}) lists ${wrongOrigin.length} of ${locs.length} URL(s) on a different origin. This usually means NEXT_PUBLIC_SITE_URL is not set in this deployment's environment, so the sitemap still points at a local/dev address search engines can't reach.`,
      evidence: wrongOrigin.slice(0, 3).join(", "),
    });
  }

  return { reachable: true, url, entryCount: locs.length, issues };
}

export async function checkRobots(baseUrl: string = SEO_CONFIG.siteUrl): Promise<{ reachable: boolean; url: string; issues: SeoIssue[] }> {
  const url = `${baseUrl}/robots.txt`;
  const issues: SeoIssue[] = [];
  const { status, text, error } = await fetchText(url);

  if (error || !text || (status && status >= 400)) {
    issues.push({ type: "robots-unreachable", severity: "critical", category: "technical", message: "robots.txt is not reachable.", evidence: error ?? `status ${status}` });
    return { reachable: false, url, issues };
  }

  const sitemapLine = text.split("\n").find((l) => /^sitemap:/i.test(l.trim()));
  if (!sitemapLine) {
    issues.push({ type: "robots-missing-sitemap-ref", severity: "warning", category: "technical", message: "robots.txt does not reference a sitemap." });
  } else {
    const referencedUrl = sitemapLine.split(":").slice(1).join(":").trim();
    const auditedOrigin = new URL(baseUrl).origin;
    try {
      if (new URL(referencedUrl).origin !== auditedOrigin) {
        issues.push({
          type: "robots-sitemap-origin-mismatch",
          severity: "critical",
          category: "technical",
          message: `robots.txt (served from ${auditedOrigin}) points to a sitemap on a different origin — same root cause as the sitemap.xml origin mismatch.`,
          evidence: referencedUrl,
        });
      }
    } catch {
      issues.push({ type: "robots-invalid-sitemap-url", severity: "warning", category: "technical", message: "robots.txt sitemap directive is not a valid absolute URL.", evidence: referencedUrl });
    }
  }

  if (/disallow:\s*\/$/im.test(text)) {
    issues.push({ type: "robots-disallow-all", severity: "critical", category: "indexability", message: "robots.txt disallows crawling the entire site." });
  }

  return { reachable: true, url, issues };
}
