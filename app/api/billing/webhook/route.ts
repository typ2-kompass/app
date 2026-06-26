// Stripe webhook receiver — TYP-49 / TYP-35 subtask 4.
//
// Responsibilities:
//   1. Verify the Stripe-Signature header against STRIPE_WEBHOOK_SECRET.
//   2. Deduplicate via webhook_events (INSERT OR IGNORE on stripeEventId).
//      A duplicate event returns 200 OK without re-running side effects.
//   3. Dispatch by event.type:
//        - checkout.session.completed → create order, generate N activation
//          codes (Crockford K-XXXX-XXXX-XXXX), send buyer (B2C) or
//          Verwalter (B2B) email, fire Plausible `checkout_completed`.
//        - charge.refunded → mark order refunded; revoke unused codes
//          immediately; mark redeemed codes with revokedAt = now + 7d grace.
//        - payment_intent.payment_failed → telemetry only.
//   4. Always 2xx on accepted events so Stripe does not retry; only
//      sub-handler crashes bubble up as 500 (Stripe will retry then).
//
// DoD: verified end-to-end with `stripe listen --forward-to`. A duplicate
// event ID is a no-op and does not generate duplicate codes.

import type { D1Database } from "@cloudflare/workers-types";
import { getAppEnv } from "@/lib/env";
import { renderActivationEmail } from "@/lib/billing/mail";
import { generateActivationCode } from "@/lib/billing/code";
import { verifyStripeSignature } from "@/lib/billing/stripe-signature";
import { trackServerEvent } from "@/lib/analytics/server-track";

export const runtime = "edge";

const GRACE_PERIOD_DAYS = 7;
const MAX_QUANTITY = 500; // sanity cap; B2B SKUs shouldn't exceed this.

// Narrow shapes — we deliberately avoid the full Stripe types so this stays
// dependency-free on the edge. We read only the fields we care about.
type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

type CheckoutSession = {
  id: string;
  amount_total: number | null;
  currency: string | null;
  payment_intent?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string | null> | null;
};

type Charge = {
  id: string;
  payment_intent: string | null;
  amount_refunded?: number;
  refunded?: boolean;
};

type PaymentIntent = {
  id: string;
  last_payment_error?: { code?: string; type?: string } | null;
};

export async function POST(request: Request): Promise<Response> {
  const env = await getAppEnv();
  if (!env.DB) {
    return jsonResponse({ error: "runtime" }, 503);
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret) {
    return jsonResponse({ error: "webhook_secret_missing" }, 500);
  }

  const rawBody = await request.text();
  const verification = await verifyStripeSignature({
    rawBody,
    header: request.headers.get("stripe-signature"),
    secret,
  });
  if (!verification.ok) {
    return jsonResponse({ error: "invalid_signature", reason: verification.reason }, 400);
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  if (!event?.id || !event?.type) {
    return jsonResponse({ error: "invalid_event" }, 400);
  }

  // --- Idempotency ----------------------------------------------------------
  // Insert *before* running the handler. If two webhooks for the same event
  // arrive concurrently, only one INSERT wins; the loser sees 0 changes and
  // exits without re-running side effects. The duplicate still returns 200
  // OK so Stripe stops retrying.
  const inserted = await env.DB.prepare(
    `INSERT OR IGNORE INTO webhook_events (stripeEventId, type, processedAt)
       VALUES (?, ?, ?)`,
  )
    .bind(event.id, event.type, new Date().toISOString())
    .run();

  // D1 returns meta.changes (or .meta?.changes depending on runtime).
  const changes =
    (inserted as { meta?: { changes?: number } }).meta?.changes ?? 0;
  if (changes === 0) {
    return jsonResponse({ ok: true, dedup: true }, 200);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted({
          env,
          session: event.data.object as CheckoutSession,
          baseUrl: new URL(request.url).origin,
          headers: request.headers,
        });
        break;
      case "charge.refunded":
        await handleChargeRefunded({
          env,
          charge: event.data.object as Charge,
        });
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed({
          intent: event.data.object as PaymentIntent,
          url: request.url,
          headers: request.headers,
        });
        break;
      default:
        // Unhandled type — we already recorded the event, just ack.
        break;
    }
  } catch (err) {
    // Roll back the dedup row so Stripe's retry can replay this event. If we
    // kept the row, the next attempt would be a silent no-op and we'd lose
    // the side effect entirely.
    try {
      await env.DB.prepare(`DELETE FROM webhook_events WHERE stripeEventId = ?`)
        .bind(event.id)
        .run();
    } catch {
      // best-effort cleanup; primary error already takes precedence
    }
    const message = err instanceof Error ? err.message : "handler_failed";
    return jsonResponse({ error: "handler_failed", detail: message }, 500);
  }

  return jsonResponse({ ok: true }, 200);
}

// ─── checkout.session.completed ─────────────────────────────────────────────

async function handleCheckoutCompleted(params: {
  env: { DB: D1Database; RESEND_API_KEY: string; EMAIL_FROM: string };
  session: CheckoutSession;
  baseUrl: string;
  headers: Headers;
}): Promise<void> {
  const { env, session, baseUrl, headers } = params;

  const buyerEmail = (
    session.customer_details?.email ??
    session.customer_email ??
    ""
  )
    .trim()
    .toLowerCase();
  if (!buyerEmail) throw new Error("missing_buyer_email");

  const metadata = session.metadata ?? {};
  const productSku = (metadata.productSku ?? "").trim();
  if (!productSku) throw new Error("missing_product_sku");

  const quantity = parseQuantity(metadata.quantity);
  if (!quantity || quantity > MAX_QUANTITY) {
    throw new Error(`invalid_quantity:${metadata.quantity ?? ""}`);
  }

  const isB2B = resolveIsB2B({ productSku, quantity, metadata });
  const amountTotal = Number.isFinite(session.amount_total)
    ? Number(session.amount_total)
    : 0;
  const currency = (session.currency ?? "eur").toLowerCase();
  const nowIso = new Date().toISOString();

  // --- Insert order (idempotent on stripeSessionId) ------------------------
  // If a previous run of the same Stripe event reached this point but failed
  // before sending mails, the dedup row was rolled back and Stripe retried;
  // the order row may already exist. Use INSERT OR IGNORE and then re-load.
  const orderId = crypto.randomUUID();
  const orderToken = crypto.randomUUID().replace(/-/g, "");
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  await env.DB.prepare(
    `INSERT OR IGNORE INTO orders (
       id, stripeSessionId, stripePaymentIntentId, buyerEmail, productSku,
       quantity, amountTotalCents, currency, status, createdAt, orderToken
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)`,
  )
    .bind(
      orderId,
      session.id,
      paymentIntentId,
      buyerEmail,
      productSku,
      quantity,
      amountTotal,
      currency,
      nowIso,
      orderToken,
    )
    .run();

  type OrderRow = { id: string; orderToken: string | null };
  const orderRow = await env.DB.prepare(
    `SELECT id, orderToken FROM orders WHERE stripeSessionId = ?`,
  )
    .bind(session.id)
    .first<OrderRow>();
  if (!orderRow) throw new Error("order_lookup_failed");

  // Check if codes already exist for this order (retry safety).
  type CountRow = { c: number };
  const existing = await env.DB.prepare(
    `SELECT COUNT(*) AS c FROM activation_codes WHERE orderId = ?`,
  )
    .bind(orderRow.id)
    .first<CountRow>();
  const haveCodes = existing?.c ?? 0;

  let codes: string[];
  if (haveCodes >= quantity) {
    // Already generated on a previous attempt — re-load and re-send mails.
    type CodeRow = { code: string };
    const rows = await env.DB.prepare(
      `SELECT code FROM activation_codes WHERE orderId = ? ORDER BY code ASC`,
    )
      .bind(orderRow.id)
      .all<CodeRow>();
    codes = (rows.results ?? []).map((r) => r.code);
  } else {
    codes = await generateUniqueCodes({ db: env.DB, count: quantity });
    // Insert as a single batched statement set — D1 commits atomically.
    const statements = codes.map((code) =>
      env.DB.prepare(
        `INSERT OR IGNORE INTO activation_codes
           (code, orderId, recipientEmail, status)
         VALUES (?, ?, ?, 'pending')`,
      ).bind(code, orderRow.id, isB2B ? null : buyerEmail),
    );
    await env.DB.batch(statements);
  }

  // --- Send activation mail(s) ---------------------------------------------
  const origin = baseUrl.replace(/\/$/, "");
  const mailProps = {
    sku: productSku,
    quantity: String(quantity),
    is_b2b: isB2B,
  };
  if (isB2B) {
    const adminUrl = `${origin}/seats/${orderRow.orderToken ?? orderToken}`;
    const { subject, html, text } = renderActivationEmail({
      kind: "b2b_admin",
      codes,
      adminUrl,
    });
    await sendMail({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      to: buyerEmail,
      subject,
      html,
      text,
    });
    await trackServerEvent({
      name: "activation_email_sent",
      url: `${origin}/api/billing/webhook`,
      headers,
      props: { ...mailProps, kind: "b2b_admin" },
    });
    // For B2B we mark codes as 'pending' (still need to be assigned by the
    // Verwalter) — do NOT mark as 'sent' yet.
  } else {
    const code = codes[0];
    const activationUrl = `${origin}/aktivieren/${encodeURIComponent(code)}`;
    const { subject, html, text } = renderActivationEmail({
      kind: "b2c",
      code,
      activationUrl,
    });
    await sendMail({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      to: buyerEmail,
      subject,
      html,
      text,
    });
    await env.DB.prepare(
      `UPDATE activation_codes
          SET status = 'sent', sentAt = ?
        WHERE code = ? AND status = 'pending'`,
    )
      .bind(nowIso, code)
      .run();
    await trackServerEvent({
      name: "activation_email_sent",
      url: `${origin}/api/billing/webhook`,
      headers,
      props: { ...mailProps, kind: "b2c" },
    });
  }

  // --- Plausible server event ----------------------------------------------
  await trackServerEvent({
    name: "checkout_completed",
    url: `${origin}/api/billing/webhook`,
    headers,
    props: {
      sku: productSku,
      quantity: String(quantity),
      is_b2b: isB2B,
    },
  });
}

// ─── charge.refunded ────────────────────────────────────────────────────────

async function handleChargeRefunded(params: {
  env: { DB: D1Database };
  charge: Charge;
}): Promise<void> {
  const { env, charge } = params;
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) {
    // Can't link this refund to an order — nothing we can act on. Telemetry
    // would help here, but silent ack is fine.
    return;
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const graceUntilIso = new Date(
    nowMs + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  type OrderRow = { id: string };
  const order = await env.DB.prepare(
    `SELECT id FROM orders WHERE stripePaymentIntentId = ?`,
  )
    .bind(paymentIntentId)
    .first<OrderRow>();
  if (!order) return;

  // Mark the order refunded. Idempotent: if already refunded, no-op.
  await env.DB.prepare(
    `UPDATE orders
        SET status = 'refunded', refundedAt = COALESCE(refundedAt, ?)
      WHERE id = ? AND status <> 'refunded'`,
  )
    .bind(nowIso, order.id)
    .run();

  // Unused codes (pending/sent) → revoke immediately.
  await env.DB.prepare(
    `UPDATE activation_codes
        SET status = 'revoked', revokedAt = ?
      WHERE orderId = ? AND status IN ('pending', 'sent') AND revokedAt IS NULL`,
  )
    .bind(nowIso, order.id)
    .run();

  // Redeemed codes → set revokedAt = now + 7d. We do NOT change status here;
  // the consuming code (auth/session) reads revokedAt to enforce the cutoff.
  await env.DB.prepare(
    `UPDATE activation_codes
        SET revokedAt = ?
      WHERE orderId = ? AND status = 'redeemed' AND revokedAt IS NULL`,
  )
    .bind(graceUntilIso, order.id)
    .run();

  // Entitlements for this order get the same grace cutoff. The app reads
  // entitlements.revokedAt to (a) render the grace-period banner and
  // (b) block module access once the cutoff passes.
  await env.DB.prepare(
    `UPDATE entitlements
        SET revokedAt = ?
      WHERE orderId = ? AND revokedAt IS NULL`,
  )
    .bind(graceUntilIso, order.id)
    .run();
}

// ─── payment_intent.payment_failed ──────────────────────────────────────────

async function handlePaymentFailed(params: {
  intent: PaymentIntent;
  url: string;
  headers: Headers;
}): Promise<void> {
  const { intent, url, headers } = params;
  const errorCode = intent.last_payment_error?.code ?? "unknown";
  const errorType = intent.last_payment_error?.type ?? "unknown";
  await trackServerEvent({
    name: "payment_failed",
    url: new URL(url).origin + "/api/billing/webhook",
    headers,
    props: {
      error_code: errorCode,
      error_type: errorType,
    },
  });
}

// ─── helpers ────────────────────────────────────────────────────────────────

function parseQuantity(raw: string | null | undefined): number | null {
  if (raw == null) return 1;
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function resolveIsB2B(params: {
  productSku: string;
  quantity: number;
  metadata: Record<string, string | null>;
}): boolean {
  const override = params.metadata.is_b2b;
  if (override === "true") return true;
  if (override === "false") return false;
  if (params.productSku.toLowerCase().includes("b2b")) return true;
  return params.quantity > 1;
}

async function generateUniqueCodes(params: {
  db: D1Database;
  count: number;
}): Promise<string[]> {
  const { db, count } = params;
  const out: string[] = [];
  const seen = new Set<string>();
  // Try a few rounds with collision check; with 60 bits of entropy the
  // probability of any collision in a single batch of ≤500 is astronomically
  // low, but we still defensively re-roll on the off chance.
  let attempts = 0;
  while (out.length < count) {
    attempts += 1;
    if (attempts > count * 5) {
      throw new Error("code_generation_exhausted");
    }
    const code = generateActivationCode();
    if (seen.has(code)) continue;
    type Row = { code: string };
    const existing = await db
      .prepare(`SELECT code FROM activation_codes WHERE code = ?`)
      .bind(code)
      .first<Row>();
    if (existing) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

async function sendMail(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`resend_failed:${res.status}:${body.slice(0, 200)}`);
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
