import { describe, it, expect } from "vitest";
import { verifyStripeSignature } from "./stripe-signature";

// Build a valid Stripe-Signature header for test fixtures.
async function makeHeader(
  secret: string,
  rawBody: string,
  t: number,
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${rawBody}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `t=${t},v1=${hex}`;
}

const SECRET = "whsec_test_secret";
const BODY = '{"id":"evt_001","type":"checkout.session.completed"}';
const NOW_MS = 1_700_000_000_000;
const T = Math.floor(NOW_MS / 1000);

describe("verifyStripeSignature", () => {
  it("accepts a valid signature", async () => {
    const header = await makeHeader(SECRET, BODY, T);
    const result = await verifyStripeSignature({
      rawBody: BODY,
      header,
      secret: SECRET,
      now: NOW_MS,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects an incorrect secret", async () => {
    const header = await makeHeader("wrong_secret", BODY, T);
    const result = await verifyStripeSignature({
      rawBody: BODY,
      header,
      secret: SECRET,
      now: NOW_MS,
    });
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toBe("signature_mismatch");
  });

  it("rejects a tampered body", async () => {
    const header = await makeHeader(SECRET, BODY, T);
    const result = await verifyStripeSignature({
      rawBody: BODY + " ",
      header,
      secret: SECRET,
      now: NOW_MS,
    });
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toBe("signature_mismatch");
  });

  it("rejects a stale timestamp (outside 5-minute window)", async () => {
    const oldT = T - 400; // 400 s in the past
    const header = await makeHeader(SECRET, BODY, oldT);
    const result = await verifyStripeSignature({
      rawBody: BODY,
      header,
      secret: SECRET,
      now: NOW_MS,
      toleranceSeconds: 300,
    });
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toBe(
      "timestamp_outside_tolerance",
    );
  });

  it("accepts a timestamp within the tolerance window", async () => {
    const recentT = T - 60; // 60 s ago — within 5 min
    const header = await makeHeader(SECRET, BODY, recentT);
    const result = await verifyStripeSignature({
      rawBody: BODY,
      header,
      secret: SECRET,
      now: NOW_MS,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a missing header", async () => {
    const result = await verifyStripeSignature({
      rawBody: BODY,
      header: null,
      secret: SECRET,
      now: NOW_MS,
    });
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toBe("missing_header");
  });

  it("rejects an empty secret", async () => {
    const header = await makeHeader(SECRET, BODY, T);
    const result = await verifyStripeSignature({
      rawBody: BODY,
      header,
      secret: "",
      now: NOW_MS,
    });
    expect(result.ok).toBe(false);
    expect((result as { reason: string }).reason).toBe("missing_secret");
  });

  it("handles multiple v1 entries — accepts if any matches", async () => {
    const header = await makeHeader(SECRET, BODY, T);
    // Prepend a bogus v1 value before the real one.
    const combined = `${header.replace(",v1=", ",v1=deadbeef1234,v1=")}`;
    const result = await verifyStripeSignature({
      rawBody: BODY,
      header: combined,
      secret: SECRET,
      now: NOW_MS,
    });
    expect(result.ok).toBe(true);
  });
});
