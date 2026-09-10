import {
  GOOGLE_OAUTH_AUTH_ENDPOINT,
  GOOGLE_OAUTH_TOKEN_ENDPOINT,
  GSC_OAUTH_SCOPE,
  getGoogleClientId,
  getGoogleClientSecret,
  getOAuthRedirectUri,
  isGoogleOAuthConfigured,
} from "./config";
import { generateOAuthState } from "./oauthState";
import { GscError } from "./errors";

// STEP 3 Tasks 1/2 — the OAuth 2.0 authorization-code flow itself.
// Requests ONLY the read-only Search Console scope (see
// GSC_OAUTH_SCOPE in config.ts) — never a broader Google scope.

export interface TokenResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
  scope: string;
}

/** Builds the URL to send the site owner to for Google's consent screen.
 * Throws GscError("not-configured") if the required credentials aren't
 * set — callers must handle that rather than silently redirecting
 * somewhere broken. */
export async function buildAuthUrl(): Promise<string> {
  if (!isGoogleOAuthConfigured()) {
    throw new GscError("not-configured", "Google OAuth is not configured (missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GSC_TOKEN_ENCRYPTION_SECRET).");
  }
  const state = await generateOAuthState();
  const params = new URLSearchParams({
    client_id: getGoogleClientId()!,
    redirect_uri: getOAuthRedirectUri(),
    response_type: "code",
    scope: GSC_OAUTH_SCOPE,
    access_type: "offline", // required to receive a refresh token
    prompt: "consent", // ensures a refresh token is issued even on reconnect
    include_granted_scopes: "true",
    state,
  });
  return `${GOOGLE_OAUTH_AUTH_ENDPOINT}?${params.toString()}`;
}

/** Exchanges an authorization code for tokens. Never logs the code,
 * client secret, or resulting tokens. */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    throw new GscError("not-configured", "Google OAuth is not configured.");
  }

  const res = await fetch(GOOGLE_OAUTH_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getOAuthRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    // Diagnostic only — Google's token endpoint reports WHY a code was
    // rejected (e.g. "invalid_grant", "redirect_uri_mismatch") via a flat
    // { error, error_description } JSON body. Never logged before, so
    // every prior failure here was a black box. Log ONLY these two
    // fields — never the authorization code, client secret, or any
    // token — since neither field can itself contain a credential (they
    // describe the failure, they don't echo request/response secrets).
    try {
      const errorBody = await res.json();
      console.error("[gsc-oauth] token exchange rejected", {
        httpStatus: res.status,
        error: errorBody?.error,
        error_description: errorBody?.error_description,
      });
    } catch {
      console.error("[gsc-oauth] token exchange rejected", { httpStatus: res.status, error: "(non-JSON response body)" });
    }
    if (res.status === 400 || res.status === 401) {
      throw new GscError("invalid-callback", "Google rejected the authorization code (it may have expired or already been used).");
    }
    throw new GscError("temporary-api-error", "Google's token endpoint is temporarily unavailable.");
  }

  const body = await res.json();
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? null,
    expiresAt: new Date(Date.now() + body.expires_in * 1000).toISOString(),
    scope: body.scope ?? GSC_OAUTH_SCOPE,
  };
}

/** Exchanges a refresh token for a new access token. Google does not
 * reissue a refresh token here — the original one keeps working until
 * revoked. */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: string }> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    throw new GscError("not-configured", "Google OAuth is not configured.");
  }

  const res = await fetch(GOOGLE_OAUTH_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    // A refresh token that's been revoked (or expired from long disuse)
    // means the whole connection needs to be re-established by the user.
    throw new GscError("token-expired", "The stored Search Console authorization could not be refreshed.");
  }

  const body = await res.json();
  return {
    accessToken: body.access_token,
    expiresAt: new Date(Date.now() + body.expires_in * 1000).toISOString(),
  };
}
