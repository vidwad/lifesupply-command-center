/**
 * Vault verification (Phase 11C — row 11C-07, docs/06 §8).
 * Proves AES-256-GCM round-trip, key-mismatch failure, ciphertext-tamper
 * failure, not-configured behavior, and the packed-format contract.
 */
import { randomBytes } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  decryptSecret,
  encryptSecret,
  lastFour,
  SecretVaultDecryptError,
  SecretVaultNotConfiguredError,
  vaultEnabled,
} from "./secrets";

const KEY_A = randomBytes(32).toString("base64");
const KEY_B = randomBytes(32).toString("base64");

let savedKey: string | undefined;

beforeEach(() => {
  savedKey = process.env.MASTER_ENCRYPTION_KEY;
  process.env.MASTER_ENCRYPTION_KEY = KEY_A;
});

afterEach(() => {
  if (savedKey === undefined) delete process.env.MASTER_ENCRYPTION_KEY;
  else process.env.MASTER_ENCRYPTION_KEY = savedKey;
});

describe("vault round-trip", () => {
  it("encrypts and decrypts back to the plaintext", () => {
    const secret = "sk-test-not-a-real-credential-12345";
    const packed = encryptSecret(secret);
    expect(packed).not.toContain(secret);
    expect(decryptSecret(packed)).toBe(secret);
  });

  it("produces a unique IV per encryption (same plaintext, different ciphertext)", () => {
    const a = encryptSecret("same-value");
    const b = encryptSecret("same-value");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe("same-value");
    expect(decryptSecret(b)).toBe("same-value");
  });

  it("uses the packed iv.tag.ciphertext format", () => {
    const packed = encryptSecret("x");
    expect(packed.split(".")).toHaveLength(3);
  });
});

describe("vault failure modes", () => {
  it("fails with SecretVaultDecryptError under a different master key", () => {
    const packed = encryptSecret("rotate-me");
    process.env.MASTER_ENCRYPTION_KEY = KEY_B;
    expect(() => decryptSecret(packed)).toThrow(SecretVaultDecryptError);
  });

  it("fails when the ciphertext is tampered with (GCM auth tag)", () => {
    const packed = encryptSecret("integrity-protected");
    const [iv, tag, ct] = packed.split(".");
    const bytes = Buffer.from(ct!, "base64");
    bytes[0] = bytes[0]! ^ 0xff;
    const tampered = [iv, tag, bytes.toString("base64")].join(".");
    expect(() => decryptSecret(tampered)).toThrow(SecretVaultDecryptError);
  });

  it("rejects malformed packed values", () => {
    expect(() => decryptSecret("not-a-packed-value")).toThrow(SecretVaultDecryptError);
  });

  it("throws SecretVaultNotConfiguredError when the key is absent", () => {
    delete process.env.MASTER_ENCRYPTION_KEY;
    expect(vaultEnabled()).toBe(false);
    expect(() => encryptSecret("x")).toThrow(SecretVaultNotConfiguredError);
  });

  it("treats a wrong-length key as not configured rather than crashing", () => {
    process.env.MASTER_ENCRYPTION_KEY = Buffer.from("too-short").toString("base64");
    expect(vaultEnabled()).toBe(false);
  });
});

describe("lastFour", () => {
  it("never reveals more than the last four characters", () => {
    expect(lastFour("abcdefgh")).toBe("efgh");
    expect(lastFour("ab").length).toBeLessThanOrEqual(4);
  });
});
