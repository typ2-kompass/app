// Verify the `Stripe-Signature` header on incoming webhooks using Web Crypto
// (works on the Cloudflare Pages edge runtime — Stripe's official SDK is
// dependency-heavy and we only need this one operation).
//
// Header format documented at https://stripe.com/docs/webhooks/signatures:
//   t=<unix_ts>,v1=<hex_hmac_sha256>,v1=<another>,v0=<legacy>...
// We only honour the v1 scheme. We compute HMAC-SHA256(secret, `${t}.${body}`)
// and constant-time compare against any v1 entry. We also reject signatures
// older than `toleranceSeconds` to limit replay risk.

const DEFAULT_TOLERANCE_SECONDS = 5 * 60;

export type SignatureVerification =
  | { ok: true }
  | { ok: false; reason: string };

export async function verifyStripeSignature(params: {
  rawBody: string;
  header: string | null;
  secret: string;
  now?: number; // ms since epoch; injectable for tests
  toleranceSeconds?: number;
}): Promise<SignatureVerification> {
  const {
    rawBody,
    header,
    secret,
    now = Date.now(),
    toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
  } = params;

  if (!secret) return { ok: false, reason: "missing_secret" };
  if (!header) return { ok: false, reason: "missing_header" };

  const parts = header.split(",").map((p) => p.trim());
  let timestamp: number | null = null;
  const v1: string[] = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === "t") {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed)) timestamp = parsed;
    } else if (key === "v1") {
      v1.push(value);
    }
  }

  if (timestamp === null) return { ok: false, reason: "missing_timestamp" };
  if (v1.length === 0) return { ok: false, reason: "missing_v1" };

  const ageSeconds = Math.abs(now / 1000 - timestamp);
  if (ageSeconds > toleranceSeconds) {
    return { ok: false, reason: "timestamp_outside_tolerance" };
  }

  const signed = `${timestamp}.${rawBody}`;
  const expected = await hmacSha256Hex(secret, signed);

  for (const candidate of v1) {
    if (constantTimeEqual(candidate, expected)) {
      return { ok: true };
    }
  }
  return { ok: false, reason: "signature_mismatch" };
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bufferToHex(sig);
}

function bufferToHex(buf: ArrayBuffer): string {
  const view = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < view.length; i += 1) {
    out += view[i].toString(16).padStart(2, "0");
  }
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
