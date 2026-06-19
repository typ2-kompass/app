// Activation route — TYP-50 / TYP-35 subtask 6.
// Flow:
//   1) Atomic redeem on activation_codes (status pending|sent → redeemed).
//   2) Resolve user by recipientEmail (B2B seat) or buyerEmail (B2C), creating
//      a fresh users row on first activation.
//   3) Record a `kind=purchase` consent receipt (DSGVO audit trail — distinct
//      from the magic-link signup consent).
//   4) Insert entitlements row (idempotent on UNIQUE(userId, orderId)).
//   5) Create an Auth.js D1 session and set the session cookie so the user
//      lands on /account or /onboarding already logged in.
// On any failure path (already redeemed, missing order, runtime), redirect to
// /aktivieren/fehler which renders the German error page with magic-link
// fallback CTA.

import { NextResponse, type NextRequest } from "next/server";
import { D1Adapter } from "@auth/d1-adapter";
import { getAppEnv } from "@/lib/env";
import { trackServerEvent } from "@/lib/analytics/server-track";
import { CONSENT_VERSION } from "@/lib/auth/consent";

export const runtime = "edge";

const SESSION_MAX_AGE_DAYS = 30;

type RedeemDetail = {
  code: string;
  orderId: string;
  recipientEmail: string | null;
  buyerEmail: string;
  productSku: string;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await context.params;
  const env = await getAppEnv();
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // Best-effort funnel event: fired before the redeem so it survives both the
  // success and the "already redeemed" branches.
  await trackServerEvent({
    name: "activation_clicked",
    url: request.url,
    headers: request.headers,
  });

  if (!env.DB) {
    return NextResponse.redirect(
      new URL("/aktivieren/fehler?reason=runtime", baseUrl),
      303,
    );
  }

  const nowIso = new Date().toISOString();

  // Atomic redeem — only flips a row that's still pending|sent. D1 reports
  // affected rows via meta.changes; 0 means the code was already used / revoked
  // / invalid and we must show the failure page (second-click DoD).
  let changes = 0;
  try {
    const update = await env.DB.prepare(
      `UPDATE activation_codes SET status='redeemed', redeemedAt=? WHERE code=? AND status IN ('pending','sent')`,
    )
      .bind(nowIso, code)
      .run();
    changes = (update.meta as { changes?: number } | undefined)?.changes ?? 0;
  } catch {
    return NextResponse.redirect(
      new URL("/aktivieren/fehler?reason=runtime", baseUrl),
      303,
    );
  }

  if (changes === 0) {
    return NextResponse.redirect(
      new URL("/aktivieren/fehler?reason=ungueltig", baseUrl),
      303,
    );
  }

  const detail = await env.DB.prepare(
    `SELECT ac.code AS code, ac.orderId AS orderId, ac.recipientEmail AS recipientEmail,
            o.buyerEmail AS buyerEmail, o.productSku AS productSku
       FROM activation_codes ac
       JOIN orders o ON o.id = ac.orderId
      WHERE ac.code = ?`,
  )
    .bind(code)
    .first<RedeemDetail>();

  if (!detail) {
    // Update succeeded but the join is empty — means the order vanished or the
    // referential integrity is off. Treat as runtime error rather than guess.
    return NextResponse.redirect(
      new URL("/aktivieren/fehler?reason=runtime", baseUrl),
      303,
    );
  }

  const email = (detail.recipientEmail ?? detail.buyerEmail)
    .trim()
    .toLowerCase();

  const adapter = D1Adapter(env.DB);

  let user = await adapter.getUserByEmail!(email);
  let isNewUser = false;
  if (!user) {
    // Auth.js's AdapterUser type wants `id` but the D1 adapter generates it
    // internally — we cast through `unknown` so TS accepts the partial input.
    user = await adapter.createUser!({
      email,
      emailVerified: new Date(),
      // no-PII rule: leave name/image null; the signIn callback in lib/auth
      // strips them anyway.
      name: null,
      image: null,
    } as unknown as Parameters<NonNullable<typeof adapter.createUser>>[0]);
    isNewUser = true;
  }

  // GDPR receipt for the purchase consent — separate kind from the signup one,
  // so we have an audit trail of *why* the account was created/linked.
  try {
    await env.DB.prepare(
      `INSERT INTO consent (id, userId, kind, version, acceptedAt) VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(crypto.randomUUID(), user.id, "purchase", CONSENT_VERSION, nowIso)
      .run();
  } catch {
    // A failed consent insert must not break activation; backfillable.
  }

  // Link the redeemed code to the redeeming user (best-effort: status is
  // already set, this is just bookkeeping for B2B reporting).
  try {
    await env.DB.prepare(
      `UPDATE activation_codes SET redeemedByUserId=? WHERE code=?`,
    )
      .bind(user.id, code)
      .run();
  } catch {
    // non-blocking
  }

  // Entitlement — UNIQUE(userId, orderId) makes the insert idempotent if
  // someone manages to retrigger this path with the same data.
  try {
    await env.DB.prepare(
      `INSERT INTO entitlements (id, userId, orderId, productSku, activatedAt)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (userId, orderId) DO NOTHING`,
    )
      .bind(
        crypto.randomUUID(),
        user.id,
        detail.orderId,
        detail.productSku,
        nowIso,
      )
      .run();
  } catch {
    // non-blocking
  }

  const sessionToken = crypto.randomUUID();
  const expires = new Date(
    Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  );
  await adapter.createSession!({ sessionToken, userId: user.id, expires });

  // Auth.js v5 default cookie names. The `__Secure-` prefix is required for
  // browsers to accept Secure cookies on HTTPS; locally (http://) we drop it.
  const isSecure = url.protocol === "https:";
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  await trackServerEvent({
    name: "app_first_login",
    url: request.url,
    headers: request.headers,
  });

  const dest = isNewUser ? "/onboarding" : "/account";
  const res = NextResponse.redirect(new URL(dest, baseUrl), 303);
  res.cookies.set({
    name: cookieName,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    expires,
  });
  return res;
}
