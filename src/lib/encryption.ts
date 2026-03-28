import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer | null {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    console.warn(
      "[encryption] TOKEN_ENCRYPTION_KEY is not set — tokens will be stored in plaintext"
    );
    return null;
  }
  if (hex.length !== 64) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Got ${hex.length} chars.`
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format `iv:tag:ciphertext` (all base64-encoded).
 * If TOKEN_ENCRYPTION_KEY is not set, returns plaintext unchanged.
 */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a string produced by `encryptToken`.
 * Expects the format `iv:tag:ciphertext` (all base64-encoded).
 * If TOKEN_ENCRYPTION_KEY is not set, returns the input unchanged.
 */
export function decryptToken(encrypted: string): string {
  const key = getKey();
  if (!key) return encrypted;

  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    // Not an encrypted value (e.g. legacy plaintext token) — return as-is
    return encrypted;
  }

  const [ivB64, tagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
