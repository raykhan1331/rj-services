import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import type { GscPeriodComparison } from "../types";

// Persists the most recent Search Console performance comparison so the
// main dashboard (Task 6) can display it without making a live Google
// API call on every dashboard view — the dashboard reads this, while
// /api/seo-agent/gsc/performance is what actually triggers a fresh fetch.
//
// Originally a JSON file under /data — same read-only-filesystem problem
// on Vercel as the old GSC token storage (fixed in tokenStore.ts). Same
// fix applied here: Redis when configured, file fallback for local dev.
// Separate key from gsc:tokens — this never stores or reads a token,
// only aggregate click/impression/CTR/position numbers.

const REDIS_KEY = "gsc:performance";

function getRedis(): Redis | null {
  if (!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)) return null;
  return Redis.fromEnv();
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "gsc-performance-latest.json");

export async function saveLatestPerformance(comparison: GscPeriodComparison): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(REDIS_KEY, comparison);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(comparison, null, 2));
}

export async function getLatestPerformance(): Promise<GscPeriodComparison | null> {
  const redis = getRedis();
  if (redis) {
    const value = await redis.get<GscPeriodComparison>(REDIS_KEY);
    return value ?? null;
  }
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
