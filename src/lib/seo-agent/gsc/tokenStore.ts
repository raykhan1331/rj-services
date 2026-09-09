import { promises as fs } from "fs";
import path from "path";
import { encryptSecret, decryptSecret } from "./crypto";

// STEP 3 Task 7 — token storage, isolated from the general seo-agent-data
// store (different file, and this module is the ONLY place that ever
// decrypts a token). No function here returns a raw access/refresh token
// to a caller outside gsc/client.ts and gsc/oauthClient.ts — API routes
// must go through getConnectionStatus() (gsc/connection.ts) instead,
// which never includes token values.

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

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(TOKEN_FILE);
  } catch {
    await fs.writeFile(TOKEN_FILE, JSON.stringify(null));
  }
}

async function readRaw(): Promise<StoredTokenRecord | null> {
  await ensureFile();
  const raw = await fs.readFile(TOKEN_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveTokens(input: {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scope: string;
  propertyUrl: string;
}): Promise<void> {
  await ensureFile();
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
  await fs.writeFile(TOKEN_FILE, JSON.stringify(record, null, 2));
}

/** Only used internally by gsc/client.ts to refresh an access token — an
 * updated access token (and possibly expiry) without disturbing
 * connectedAt/propertyUrl/refreshToken. */
export async function updateAccessToken(accessToken: string, expiresAt: string): Promise<void> {
  const existing = await readRaw();
  if (!existing) throw new Error("Cannot update access token — no Search Console connection is stored.");
  existing.accessTokenEnc = encryptSecret(accessToken);
  existing.expiresAt = expiresAt;
  await fs.writeFile(TOKEN_FILE, JSON.stringify(existing, null, 2));
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
  await ensureFile();
  await fs.writeFile(TOKEN_FILE, JSON.stringify(null));
}
