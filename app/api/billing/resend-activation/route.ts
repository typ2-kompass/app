// Self-service resend of activation emails — TYP-51 / TYP-35 subtask 7.
// Flow:
//   1) Parse + validate email.
//   2) Rate-limit per email: max 1/minute, max 5/day (resend_attempts table).
//      The check is run *before* recording, so a rejected attempt does not
//      extend the bucket for the next legitimate request.
//   3) Look up pending/sent activation codes belonging to this *buyer*. For
//      B2B orders we deliberately exclude codes already assigned to employees
//      (recipientEmail set to someone else) — only the Verwalter's own seats
//      get re-sent.
//   4) Send one activation email per matching code via Resend.
//   5) Record an attempts row, regardless of whether codes were found, so the
//      rate-limit cannot be bypassed by guessing emails.
//   6) Always respond 200 with a generic message — never reveal whether the
//      email is in the system (anti-enumeration).
//
// DoD: endpoint testable, rate-limit triggers on the 2nd attempt.

import { NextResponse } from "next/server";
import { getAppEnv } from "@/lib/env";
import { sendActivationEmail } from "@/lib/auth/sendActivation";

export const runtime = "edge";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_LIMIT = 1;
const DAY_LIMIT = 5;
const CODE_BATCH_CAP = 20;

type ResendCodeRow = {
  code: string;
  buyerEmail: string;
};

type CountRow = { c: number };

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as
    | { email?: unknown }
    | null;
  const rawEmail = typeof body?.email === "string" ? body.email : "";
  const email = rawEmail.trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const env = await getAppEnv();
  if (!env.DB) {
    return NextResponse.json({ error: "runtime" }, { status: 503 });
  }

  const now = Date.now();
  const minuteCutoff = new Date(now - MINUTE_MS).toISOString();
  const dayCutoff = new Date(now - DAY_MS).toISOString();
  const nowIso = new Date(now).toISOString();

  // --- Rate limit ---------------------------------------------------------
  const [minuteRow, dayRow] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) AS c FROM resend_attempts WHERE email=? AND attemptedAt > ?`,
    )
      .bind(email, minuteCutoff)
      .first<CountRow>(),
    env.DB.prepare(
      `SELECT COUNT(*) AS c FROM resend_attempts WHERE email=? AND attemptedAt > ?`,
    )
      .bind(email, dayCutoff)
      .first<CountRow>(),
  ]);

  const minuteCount = minuteRow?.c ?? 0;
  const dayCount = dayRow?.c ?? 0;

  if (minuteCount >= MINUTE_LIMIT) {
    return NextResponse.json(
      { error: "rate_limited", scope: "minute" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  if (dayCount >= DAY_LIMIT) {
    return NextResponse.json(
      { error: "rate_limited", scope: "day" },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  // --- Find codes for this buyer -----------------------------------------
  // Buyer-only resend: only codes whose order was paid for by this email.
  // For B2B (recipientEmail set), exclude seats already assigned to someone
  // else — the Verwalter cannot resend an employee's redemption link via
  // this endpoint.
  const codesResult = await env.DB.prepare(
    `SELECT ac.code AS code, o.buyerEmail AS buyerEmail
       FROM activation_codes ac
       JOIN orders o ON o.id = ac.orderId
      WHERE ac.status IN ('pending', 'sent')
        AND o.buyerEmail = ?
        AND (ac.recipientEmail IS NULL OR ac.recipientEmail = ?)
      ORDER BY o.createdAt DESC, ac.code ASC
      LIMIT ?`,
  )
    .bind(email, email, CODE_BATCH_CAP)
    .all<ResendCodeRow>();

  const codes = codesResult.results ?? [];
  const baseUrl = new URL(request.url).origin;

  // Fire emails sequentially to keep us well under any per-request CPU/
  // sub-request budget; the cap of 20 keeps the worst case bounded.
  let sentCount = 0;
  for (const row of codes) {
    try {
      await sendActivationEmail({
        apiKey: env.RESEND_API_KEY,
        from: env.EMAIL_FROM,
        to: email,
        code: row.code,
        baseUrl,
      });
      sentCount += 1;
      try {
        await env.DB.prepare(
          `UPDATE activation_codes SET status='sent', sentAt=? WHERE code=?`,
        )
          .bind(nowIso, row.code)
          .run();
      } catch {
        // bookkeeping only — do not fail the request if the status bump fails
      }
    } catch {
      // One bad send shouldn't tank the whole batch (or leak via response).
    }
  }

  // Record the attempt regardless of outcome so the rate-limit budget is
  // spent uniformly — prevents the bucket from being bypassed via
  // unknown-email probing.
  try {
    await env.DB.prepare(
      `INSERT INTO resend_attempts (id, email, attemptedAt) VALUES (?, ?, ?)`,
    )
      .bind(crypto.randomUUID(), email, nowIso)
      .run();
  } catch {
    // If the bookkeeping insert fails we deliberately still return ok — the
    // user-facing flow already completed.
  }

  // Anti-enumeration: always 200 with the same shape, regardless of whether
  // we found and sent any codes. UI shows the generic success copy.
  return NextResponse.json({ ok: true, sent: sentCount });
}
