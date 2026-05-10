import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Encrypted credential vault — see docs/06 §8.
 *
 * Format: AES-256-GCM, 12-byte random IV per record. Packed string is
 *   base64(iv) . base64(authTag) . base64(ciphertext)
 *
 * Master key supplied via MASTER_ENCRYPTION_KEY env var (32 bytes, base64).
 */

export class SecretVaultNotConfiguredError extends Error {
  constructor() {
    super(
      "Encrypted credential vault is not configured. Set MASTER_ENCRYPTION_KEY in your env to a 32-byte base64 value (`openssl rand -base64 32`).",
    );
    this.name = "SecretVaultNotConfiguredError";
  }
}

export class SecretVaultDecryptError extends Error {
  constructor(public readonly cause?: unknown) {
    super(
      "Failed to decrypt credential. The MASTER_ENCRYPTION_KEY may have changed or the ciphertext is corrupted.",
    );
    this.name = "SecretVaultDecryptError";
  }
}

function getMasterKey(): Buffer | null {
  const raw = process.env.MASTER_ENCRYPTION_KEY;
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(
      `MASTER_ENCRYPTION_KEY must decode to 32 bytes (got ${buf.length}). Generate with: openssl rand -base64 32`,
    );
  }
  return buf;
}

export function vaultEnabled(): boolean {
  try {
    return getMasterKey() !== null;
  } catch {
    return false;
  }
}

export function encryptSecret(plaintext: string): string {
  const key = getMasterKey();
  if (!key) throw new SecretVaultNotConfiguredError();

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(packed: string): string {
  const key = getMasterKey();
  if (!key) throw new SecretVaultNotConfiguredError();

  const parts = packed.split(".");
  if (parts.length !== 3) throw new SecretVaultDecryptError(new Error("Malformed ciphertext"));

  try {
    const [ivB64, tagB64, dataB64] = parts as [string, string, string];
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch (err) {
    throw new SecretVaultDecryptError(err);
  }
}

/** Last 4 chars of the plaintext, for display in the UI. */
export function lastFour(secret: string): string {
  if (secret.length <= 4) return secret;
  return secret.slice(-4);
}
