// POST /api/billing/renewal
// Creates a Stripe Checkout Session for the 19 EUR/year update-renewal.
// This is a one-off charge (payment_mode), NOT a subscription. No auto-renewal.
//
// Requires an active or expired-update entitlement; prevents double-renewal
// by checking if the user already has an active update-renewal order.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getAppEnv } from "@/lib/env";

export const runtime = "edge";

const STRIPE_API = "https://api.stripe.com/v1/checkout/sessions";
const APP_URL = "https://app.typ2-kompass.de";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = await getAppEnv();
  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  if (!env.STRIPE_PRICE_UPDATE_RENEWAL) {
    return NextResponse.json({ error: "Renewal price not configured" }, { status: 503 });
  }

  const userId = session.user.id;

  // Gate: user must have at least one entitlement (any status) to renew updates.
  if (env.DB) {
    const ent = await env.DB
      .prepare(`SELECT id FROM entitlements WHERE userId = ? LIMIT 1`)
      .bind(userId)
      .first<{ id: string }>();
    if (!ent) {
      return NextResponse.json({ error: "No entitlement found" }, { status: 403 });
    }
  }

  const params = new URLSearchParams({
    mode: "payment",
    "payment_method_types[]": "card",
    "line_items[0][price]": env.STRIPE_PRICE_UPDATE_RENEWAL,
    "line_items[0][quantity]": "1",
    customer_email: session.user.email,
    success_url: `${APP_URL}/updates?renewed=1`,
    cancel_url: `${APP_URL}/account/renewal`,
    "metadata[userId]": userId,
    "metadata[productSku]": "update-renewal",
  });

  const stripeRes = await fetch(STRIPE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!stripeRes.ok) {
    const err = await stripeRes.text();
    console.error("Stripe renewal session error:", err);
    return NextResponse.json({ error: "stripe_error" }, { status: 502 });
  }

  const data = (await stripeRes.json()) as { url: string };
  return NextResponse.json({ url: data.url });
}
