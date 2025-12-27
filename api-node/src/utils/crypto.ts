// ===========================================
// Node.js API - Crypto Utilities
// ===========================================

import crypto from "crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  return crypto.scryptSync(env.ENCRYPTION_KEY, "salt", 32);
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted data
  return iv.toString("hex") + authTag.toString("hex") + encrypted;
}

export function decrypt(encryptedData: string): string {
  const key = getKey();

  // Extract iv, authTag, and encrypted text
  const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), "hex");
  const authTag = Buffer.from(
    encryptedData.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2),
    "hex"
  );
  const encrypted = encryptedData.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function hashSHA256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}
