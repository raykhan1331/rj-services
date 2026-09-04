import { promises as fs } from "fs";
import path from "path";
import type { NotificationRecord } from "./types";

// Records every notification attempt the sub-agent makes (sent, failed, or
// not_configured) — server-only, git-ignored alongside the other local
// data. This is what makes the pipeline testable end-to-end before any
// real WhatsApp credentials exist: a "not_configured" record here proves
// the lead reached the sub-agent and the message was correctly prepared,
// even though nothing was actually sent.

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "whatsapp-notifications.json");

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

export async function readNotifications(): Promise<NotificationRecord[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

export async function appendNotification(record: NotificationRecord) {
  await ensureFile();
  const records = await readNotifications();
  records.push(record);
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2));
}
