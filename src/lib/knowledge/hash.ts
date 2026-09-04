import { createHash } from "crypto";

export function hashContent(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
