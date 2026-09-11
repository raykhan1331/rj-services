import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import type { GscOpportunityAnalysis } from "../types";

// STEP 12 — persists the latest GSC opportunity analysis so the
// dashboard/API can read it without recomputing on every request. Same
// pattern as performanceStore.ts/store.ts: Redis when configured
// (separate key — never overlaps with gsc:tokens, gsc:performance, or
// seo-agent:data), file fallback for local dev. Reads never write as a
// side effect.

const REDIS_KEY = "gsc:opportunities";

function getRedis(): Redis | null {
  if (!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)) return null;
  return Redis.fromEnv();
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "gsc-opportunities-latest.json");

export async function saveLatestOpportunityAnalysis(analysis: GscOpportunityAnalysis): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(REDIS_KEY, analysis);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(analysis, null, 2));
}

export async function getLatestOpportunityAnalysis(): Promise<GscOpportunityAnalysis | null> {
  const redis = getRedis();
  if (redis) {
    const value = await redis.get<GscOpportunityAnalysis>(REDIS_KEY);
    return value ?? null;
  }
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
