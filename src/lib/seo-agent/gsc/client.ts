import { GSC_API_BASE } from "./config";
import { getDecryptedTokens, updateAccessToken } from "./tokenStore";
import { refreshAccessToken } from "./oauthClient";
import { GscError, mapGoogleApiError } from "./errors";
import type { GscDateRange, GscRow } from "../types";

const TOKEN_EXPIRY_SAFETY_MARGIN_MS = 60_000; // refresh a minute early rather than racing an exact expiry

/** Returns a definitely-valid access token, transparently refreshing it
 * first if it's expired or about to expire. Never returns/logs the token
 * — the caller uses it exactly once for the Authorization header. */
async function getValidAccessToken(): Promise<string> {
  const tokens = await getDecryptedTokens();
  if (!tokens) {
    throw new GscError("not-connected", "Search Console is not connected.");
  }

  const expiresAt = new Date(tokens.expiresAt).getTime();
  if (Date.now() < expiresAt - TOKEN_EXPIRY_SAFETY_MARGIN_MS) {
    return tokens.accessToken;
  }

  // Expired (or about to be) — refresh it.
  const refreshed = await refreshAccessToken(tokens.refreshToken); // throws GscError("token-expired") if the refresh token itself no longer works
  await updateAccessToken(refreshed.accessToken, refreshed.expiresAt);
  return refreshed.accessToken;
}

export interface SearchAnalyticsQuery {
  startDate: string;
  endDate: string;
  dimensions: ("query" | "page" | "country" | "device" | "searchAppearance")[];
  rowLimit?: number;
}

/** Calls Search Console's searchAnalytics.query endpoint for one
 * dimension breakdown. Returns an empty array (not an error) when Google
 * has no data for the range — that's a legitimate, expected response
 * (Task 8's "no Search Console data yet"), not a failure. */
export async function querySearchAnalytics(propertyUrl: string, query: SearchAnalyticsQuery): Promise<GscRow[]> {
  const accessToken = await getValidAccessToken();

  const res = await fetch(`${GSC_API_BASE}/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: query.startDate,
      endDate: query.endDate,
      ...(query.dimensions.length > 0 ? { dimensions: query.dimensions } : {}),
      rowLimit: query.rowLimit ?? 25,
    }),
  });

  if (!res.ok) {
    let reason: string | undefined;
    try {
      const body = await res.json();
      reason = body?.error?.errors?.[0]?.reason;
    } catch {
      // ignore — body wasn't JSON or was empty
    }
    throw mapGoogleApiError(res.status, reason);
  }

  const body = await res.json();
  const rows = (body.rows ?? []) as { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  return rows.map((r) => ({ keys: r.keys, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
}

/** Convenience: totals for a range with no dimension breakdown (a single
 * summary row). */
export async function queryTotals(propertyUrl: string, range: GscDateRange): Promise<{ clicks: number; impressions: number; ctr: number; position: number }> {
  const rows = await querySearchAnalytics(propertyUrl, { ...range, dimensions: [], rowLimit: 1 });
  const row = rows[0];
  return row ? { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position } : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
}
