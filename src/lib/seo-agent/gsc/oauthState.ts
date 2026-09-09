import { cookies } from "next/headers";
import { randomBytes } from "crypto";

// STEP 3 Task 7 — CSRF protection for the OAuth flow. Originally persisted
// to a file under /data, but Vercel's serverless functions run on a
// read-only filesystem outside /tmp (and /data is gitignored, so it isn't
// even part of the deployed bundle) — every write there throws in
// production. Fixed by storing the pending state in an HttpOnly cookie
// instead: it only ever needs to survive one browser round-trip between
// /connect and /callback (max 10 minutes), so the browser itself — not a
// server-side store — is the natural, already-reliable place to carry it,
// and it sidesteps the "which function instance handles the callback"
// problem a file/in-memory store would have in a serverless environment
// anyway. No new dependency, no new Vercel resource to provision.

const STATE_COOKIE = "gsc_oauth_state";
const STATE_TTL_SECONDS = 10 * 60; // 10 minutes — plenty for a consent screen, short enough to limit replay risk

export async function generateOAuthState(): Promise<string> {
  const value = randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(STATE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must survive the top-level GET redirect Google sends the browser back on
    path: "/",
    maxAge: STATE_TTL_SECONDS,
  });
  return value;
}

/** Single-use: the cookie is deleted immediately whether or not this call
 * matches it, so a state value can never be replayed. */
export async function consumeOAuthState(candidate: string | null): Promise<boolean> {
  const store = await cookies();
  const stored = store.get(STATE_COOKIE)?.value ?? null;
  store.delete(STATE_COOKIE); // always consume

  if (!stored || !candidate) return false;
  return stored === candidate;
}
