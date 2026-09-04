// Central place for monitoring configuration. Change this — or set the
// OFFICIAL_SOURCE_SYNC_INTERVAL env var — to adjust check frequency without
// touching sync logic, API routes, or anywhere else in the application.
//
// Accepts a preset ("hourly" | "daily" | "weekly") or a raw number of
// seconds. Defaults to daily, matching the "check at least daily" target.
//
// This value is read by whatever triggers a sync (e.g. an external cron
// job or platform scheduler calling POST /api/knowledge/sync) — the app
// itself does not run a long-lived background timer, since a serverless
// Next.js deployment has no persistent process to host one.

export type SyncIntervalPreset = "hourly" | "daily" | "weekly";

const PRESET_SECONDS: Record<SyncIntervalPreset, number> = {
  hourly: 60 * 60,
  daily: 60 * 60 * 24,
  weekly: 60 * 60 * 24 * 7,
};

function resolveInterval(): number {
  const raw = process.env.OFFICIAL_SOURCE_SYNC_INTERVAL?.trim().toLowerCase();
  if (!raw) return PRESET_SECONDS.daily;
  if (raw in PRESET_SECONDS) return PRESET_SECONDS[raw as SyncIntervalPreset];
  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber) && asNumber > 0) return asNumber;
  return PRESET_SECONDS.daily;
}

export const OFFICIAL_SOURCE_SYNC_INTERVAL_SECONDS = resolveInterval();
