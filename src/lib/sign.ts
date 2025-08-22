// src/lib/sign.ts
import crypto from "crypto";

/**
 * Resolve and validate the license-signing secret exactly once.
 * In production, we hard-fail if it's missing or too weak.
 * In development, we warn and fall back to a deterministic default to avoid footguns.
 */
const MIN_SECRET_BYTES = 16; // 128-bit minimum
function resolveSecret(): string {
  const raw = process.env.LICENSE_SIGNING_SECRET?.trim();

  if (raw && Buffer.byteLength(raw, "utf8") >= MIN_SECRET_BYTES) return raw;

  const msg = raw
    ? `LICENSE_SIGNING_SECRET is too short (min ${MIN_SECRET_BYTES} bytes).`
    : "LICENSE_SIGNING_SECRET is not set.";

  if (process.env.NODE_ENV === "production") {
    // Fail fast so you discover this during boot instead of issuing unverifiable licenses.
    throw new Error(`[sign] ${msg} Set a strong, random secret in your environment.`);
  }

  // Dev fallback: loud, deterministic, and UNMISTAKABLE in logs.
  const fallback = "dev-only-signing-secret-change-me";
  
  console.warn(`[sign] ${msg} Using a DEV fallback secret: "${fallback}". DO NOT use this in production.`);
  return fallback;
}

const SIGNING_SECRET = resolveSecret();

export function signPayload(obj: unknown) {
  const json = JSON.stringify(obj);
  const sig = crypto.createHmac("sha256", SIGNING_SECRET).update(json).digest("base64");
  return { json, sig };
}

export function verifySignature(json: string, sig: string): boolean {
  // Use constant‑time comparison
  const expected = crypto.createHmac("sha256", SIGNING_SECRET).update(json).digest("base64");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
