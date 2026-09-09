import { SEO_CONFIG } from "../config";

// STEP 3 — every value here comes from an environment variable, never a
// hardcoded default containing a real credential. All of these are
// server-only: this file is never imported by a "use client" component,
// and none of these values are ever sent in an API response body.

export const GOOGLE_OAUTH_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_OAUTH_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GSC_API_BASE = "https://www.googleapis.com/webmasters/v3";

// Read-only Search Console access — the minimum scope that can retrieve
// performance data. Never request a broader scope (e.g. the read-write
// webmasters scope) since this agent only ever reads GSC data.
export const GSC_OAUTH_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export function getGoogleClientId(): string | null {
  return process.env.GOOGLE_CLIENT_ID || null;
}

export function getGoogleClientSecret(): string | null {
  return process.env.GOOGLE_CLIENT_SECRET || null;
}

export function getOAuthRedirectUri(): string {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI || `${SEO_CONFIG.siteUrl}/api/seo-agent/gsc/callback`;
}

export function getTokenEncryptionSecret(): string | null {
  return process.env.GSC_TOKEN_ENCRYPTION_SECRET || null;
}

/** The exact Search Console property identifier, e.g.
 * "https://rj-services.vercel.app/" (a URL-prefix property — the only
 * kind possible for a vercel.app subdomain, since domain properties
 * require owning the whole domain via DNS). Falls back to deriving one
 * from SEO_CONFIG.siteUrl, but the real verified value should be set
 * explicitly since Search Console is strict about exact string matches
 * (trailing slash included). */
export function getPropertyUrl(): string {
  return process.env.GSC_PROPERTY_URL || `${SEO_CONFIG.siteUrl}/`;
}

/** True only when every credential needed to even START the OAuth flow
 * is present. Does not mean a connection has been established yet —
 * see gsc/connection.ts for that. */
export function isGoogleOAuthConfigured(): boolean {
  return Boolean(getGoogleClientId() && getGoogleClientSecret() && getTokenEncryptionSecret());
}
