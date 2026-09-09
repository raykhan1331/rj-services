import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { getTokenEncryptionSecret } from "./config";

// STEP 3 Task 7 — OAuth tokens are encrypted at rest with AES-256-GCM
// before ever touching disk, using Node's built-in crypto module (no new
// dependency). GSC_TOKEN_ENCRYPTION_SECRET is hashed into a proper 32-byte
// key so the env var itself can be any length/format the user picks.

function getKey(): Buffer {
  const secret = getTokenEncryptionSecret();
  if (!secret) {
    throw new Error("GSC_TOKEN_ENCRYPTION_SECRET is not set — cannot encrypt/decrypt Search Console tokens.");
  }
  return createHash("sha256").update(secret).digest();
}

/** Returns "iv:authTag:ciphertext", all hex-encoded, as a single string
 * safe to store in JSON. */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV, standard for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptSecret(stored: string): string {
  const key = getKey();
  const [ivHex, authTagHex, dataHex] = stored.split(":");
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error("Stored value is not in the expected iv:authTag:ciphertext format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}
