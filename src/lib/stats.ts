// Single source of truth for the homepage statistics band. These are all
// real, verifiable counts derived from the site's own content (not
// marketing claims) — e.g. the number of banking providers actually listed
// on the Banking page. Update this file to change what's displayed;
// nothing else needs to change.

export interface SiteStat {
  value: number;
  suffix?: string;
  label: string;
}

export const SITE_STATS: SiteStat[] = [
  { value: 7, suffix: "+", label: "Banking Providers Supported" },
  { value: 10, suffix: "", label: "Core Business Services" },
  { value: 2, suffix: "", label: "Countries Supported" },
  { value: 24, suffix: "/7", label: "AI Assistant Availability" },
];
