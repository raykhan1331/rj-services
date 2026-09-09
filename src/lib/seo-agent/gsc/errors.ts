// STEP 3 Task 8 — every failure mode the integration can hit, mapped to a
// stable code and a human-readable message that never includes a raw
// token, client secret, or full Google error payload (which can itself
// occasionally echo back request parameters). Callers (API routes) use
// `.code` to decide HTTP status and `.message` to show the user.

export type GscErrorCode =
  | "not-configured"
  | "not-connected"
  | "authorization-denied"
  | "invalid-callback"
  | "token-expired"
  | "invalid-credentials"
  | "property-not-found"
  | "insufficient-permission"
  | "rate-limited"
  | "temporary-api-error"
  | "no-data-yet"
  | "unknown-error";

export class GscError extends Error {
  readonly code: GscErrorCode;

  constructor(code: GscErrorCode, message: string) {
    super(message);
    this.name = "GscError";
    this.code = code;
  }
}

const HUMAN_MESSAGES: Record<GscErrorCode, string> = {
  "not-configured": "Google Search Console is not configured yet. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GSC_TOKEN_ENCRYPTION_SECRET first.",
  "not-connected": "Search Console is not connected yet. Visit /api/seo-agent/gsc/connect to authorize access.",
  "authorization-denied": "Google authorization was denied. Reconnect and approve the requested read-only Search Console access to continue.",
  "invalid-callback": "The authorization callback was invalid or expired. Please try connecting again.",
  "token-expired": "The stored Search Console authorization has expired and could not be refreshed. Please reconnect.",
  "invalid-credentials": "Google rejected the configured client credentials. Double-check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
  "property-not-found": "This Google account does not have access to the configured Search Console property. Verify the property in Search Console first.",
  "insufficient-permission": "This Google account does not have sufficient permission on the Search Console property.",
  "rate-limited": "Google Search Console API rate limit reached. Try again shortly.",
  "temporary-api-error": "Google Search Console API is temporarily unavailable. Try again shortly.",
  "no-data-yet": "Search Console has no performance data for this period yet.",
  "unknown-error": "An unexpected error occurred while talking to Google Search Console.",
};

export function humanMessage(code: GscErrorCode): string {
  return HUMAN_MESSAGES[code];
}

const HTTP_STATUS: Record<GscErrorCode, number> = {
  "not-configured": 501,
  "not-connected": 409,
  "authorization-denied": 403,
  "invalid-callback": 400,
  "token-expired": 401,
  "invalid-credentials": 401,
  "property-not-found": 404,
  "insufficient-permission": 403,
  "rate-limited": 429,
  "temporary-api-error": 503,
  "no-data-yet": 200,
  "unknown-error": 500,
};

export function statusForError(code: GscErrorCode): number {
  return HTTP_STATUS[code];
}

/** Maps a Google API error response to a GscError without ever including
 * the raw response body (which can contain request echoes) in the
 * resulting message. */
export function mapGoogleApiError(httpStatus: number, googleReason?: string): GscError {
  if (httpStatus === 401) return new GscError("invalid-credentials", humanMessage("invalid-credentials"));
  if (httpStatus === 403) {
    if (googleReason === "insufficientPermissions") return new GscError("insufficient-permission", humanMessage("insufficient-permission"));
    return new GscError("insufficient-permission", humanMessage("insufficient-permission"));
  }
  if (httpStatus === 404) return new GscError("property-not-found", humanMessage("property-not-found"));
  if (httpStatus === 429) return new GscError("rate-limited", humanMessage("rate-limited"));
  if (httpStatus >= 500) return new GscError("temporary-api-error", humanMessage("temporary-api-error"));
  return new GscError("unknown-error", humanMessage("unknown-error"));
}
