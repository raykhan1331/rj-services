import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

// STEP 3 Task 7 — CSRF protection for the OAuth flow. A serverless
// deployment has no reliable shared in-memory state between the
// /connect and /callback requests (they can hit different function
// instances), so the pending state token is persisted the same way as
// everything else in this project — a small file under /data — with a
// short expiry and single-use deletion.

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "gsc-oauth-state.json");
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes — plenty for a consent screen, short enough to limit replay risk

interface StoredState {
  value: string;
  expiresAt: number;
}

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STATE_FILE);
  } catch {
    await fs.writeFile(STATE_FILE, JSON.stringify(null));
  }
}

export async function generateOAuthState(): Promise<string> {
  await ensureFile();
  const value = randomBytes(24).toString("hex");
  const stored: StoredState = { value, expiresAt: Date.now() + STATE_TTL_MS };
  await fs.writeFile(STATE_FILE, JSON.stringify(stored));
  return value;
}

/** Single-use: valid state is deleted immediately whether or not this
 * call matches it, so a state value can never be replayed. */
export async function consumeOAuthState(candidate: string | null): Promise<boolean> {
  await ensureFile();
  const raw = await fs.readFile(STATE_FILE, "utf-8");
  let stored: StoredState | null;
  try {
    stored = JSON.parse(raw);
  } catch {
    stored = null;
  }
  await fs.writeFile(STATE_FILE, JSON.stringify(null)); // always consume

  if (!stored || !candidate) return false;
  if (Date.now() > stored.expiresAt) return false;
  return stored.value === candidate;
}
