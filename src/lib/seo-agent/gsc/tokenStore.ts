import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { encryptSecret, decryptSecret } from "./crypto";

// STEP 3 Task 7 — token storage, isolated from the general seo-agent-data
// store (different key/file, and this module is the ONLY place that ever
// decrypts a token). No function here returns a raw access/refresh token
// to a caller outside gsc/client.ts and gsc/oauthClient.ts — API routes
// must go through getConnectionStatus() (gsc/connection.ts) instead,
// which never includes token values.
//
// Originally a JSON file under /data, but Vercel's serverless functions
// run on a read-only filesystem outside /tmp (and /data is gitignored —
// not even part of the deployed bundle), so every write there threw —
// surfacing as a 500 on every route that merely checked connection
// status, since the old code eagerly created/wrote a placeholder file
// even for a pure read. Fixed with Upstash Redis (the current, non-
// deprecated Vercel Marketplace storage integration — @vercel/kv itself
// is deprecated in favor of this) when it's configured; falls back to
// the original file-based store when it isn't (e.g. local dev without a
// Redis store connected), so nothing here requires new local setup.
// Reads never write as a side effect — a missing key/file cleanly means
// "not connected" rather than throwing.

const REDIS_KEY = "gsc:tokens";

function getRedis(): Redis | null {
  if (!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)) return null;
  return Redis.fromEnv();
}

const DATA_DIR = path.join(process.cwd(), "data");
const TOKEN_FILE = path.join(DATA_DIR, "gsc-tokens.json");

interface StoredTokenRecord {
  accessTokenEnc: string;
  refreshTokenEnc: string;
  expiresAt: string; // ISO timestamp
  scope: string;
  propertyUrl: string;
  connectedAt: string;
}

export interface DecryptedTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scope: string;
  propertyUrl: string;
  connectedAt: string;
}

/** Read-only — never creates/writes anything, so a missing store (no
 * connection yet) is just `null`, never a thrown error. */
async function readRaw(): Promise<StoredTokenRecord | null> {
  const redis = getRedis();
  if (redis) {
    const value = await redis.get<StoredTokenRecord>(REDIS_KEY);
    return value ?? null;
  }
  try {
    const raw = await fs.readFile(TOKEN_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeRaw(record: StoredTokenRecord | null): Promise<void> {
  const redis = getRedis();
  if (redis) {
    if (record === null) {
      await redis.del(REDIS_KEY);
    } else {
      await redis.set(REDIS_KEY, record);
    }
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TOKEN_FILE, JSON.stringify(record, null, 2));
}

export async function saveTokens(input: {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scope: string;
  propertyUrl: string;
}): Promise<void> {
  const existing = await readRaw();
  const record: StoredTokenRecord = {
    accessTokenEnc: encryptSecret(input.accessToken),
    // Google only issues a refresh token on the FIRST consent (with
    // access_type=offline + prompt=consent) — if a later token refresh
    // response omits one, keep the previously stored refresh token
    // rather than overwriting it with nothing.
    refreshTokenEnc: input.refreshToken ? encryptSecret(input.refreshToken) : existing?.refreshTokenEnc ?? "",
    expiresAt: input.expiresAt,
    scope: input.scope,
    propertyUrl: input.propertyUrl,
    connectedAt: existing?.connectedAt ?? new Date().toISOString(),
  };
  await writeRaw(record);
}

/** Only used internally by gsc/client.ts to refresh an access token — an
 * updated access token (and possibly expiry) without disturbing
 * connectedAt/propertyUrl/refreshToken. */
export async function updateAccessToken(accessToken: string, expiresAt: string): Promise<void> {
  const existing = await readRaw();
  if (!existing) throw new Error("Cannot update access token — no Search Console connection is stored.");
  existing.accessTokenEnc = encryptSecret(accessToken);
  existing.expiresAt = expiresAt;
  await writeRaw(existing);
}

export async function getDecryptedTokens(): Promise<DecryptedTokens | null> {
  const raw = await readRaw();
  if (!raw || !raw.accessTokenEnc || !raw.refreshTokenEnc) return null;
  return {
    accessToken: decryptSecret(raw.accessTokenEnc),
    refreshToken: decryptSecret(raw.refreshTokenEnc),
    expiresAt: raw.expiresAt,
    scope: raw.scope,
    propertyUrl: raw.propertyUrl,
    connectedAt: raw.connectedAt,
  };
}

/** Metadata only — never includes token values. Safe to expose via an
 * API response. */
export async function getConnectionMetadata(): Promise<{ propertyUrl: string; connectedAt: string; scope: string } | null> {
  const raw = await readRaw();
  if (!raw) return null;
  return { propertyUrl: raw.propertyUrl, connectedAt: raw.connectedAt, scope: raw.scope };
}

export async function clearTokens(): Promise<void> {
  await writeRaw(null);
}
