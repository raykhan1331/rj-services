import { promises as fs } from "fs";
import path from "path";
import type { Lead } from "./types";

/** A stored lead, plus when this session was first seen (kept internally so
 * "new leads today" can be told apart from "leads updated today" — the
 * public Lead type stays exactly as specified in Step 14). */
export type StoredLead = Lead & { firstSeenAt: string };

// File-based lead store — server-only, never imported by client code. This
// file lives under /data, which is git-ignored, since lead records contain
// personal information (name, contact details). Prepared as the pipeline a
// future WhatsApp follow-up agent will read from — this module never sends
// anything anywhere on its own.

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "leads.json");

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

async function readStoredLeads(): Promise<StoredLead[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

async function writeStoredLeads(leads: StoredLead[]) {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(leads, null, 2));
}

export async function readLeads(): Promise<Lead[]> {
  return readStoredLeads();
}

/** Same records, with firstSeenAt included — for reporting/summary use. */
export async function readLeadsWithMeta(): Promise<StoredLead[]> {
  return readStoredLeads();
}

export async function upsertLead(lead: Lead): Promise<Lead> {
  const leads = await readStoredLeads();
  const idx = leads.findIndex((l) => l.id === lead.id);
  if (idx >= 0) {
    leads[idx] = { ...lead, firstSeenAt: leads[idx].firstSeenAt };
  } else {
    leads.push({ ...lead, firstSeenAt: lead.timestamp });
  }
  await writeStoredLeads(leads);
  return lead;
}
