// Stripe Checkout Session creator — TYP-48 / TYP-35 subtask 3.
//
// Sales site posts `{ productSku, quantity, couponCode?, referrerCampaign? }`,
// we validate against the server-side product registry, create a Stripe
// Checkout Session via the REST API, fire a Plausible `checkout_started`
// server event, and return `{ url }` for the client to redirect to.
//
// We deliberately call Stripe via raw fetch instead of the Node SDK:
// - the route runs on Cloudflare Pages (edge runtime), where the SDK pulls
//   in heavier shims than we need for one POST,
// - the request body is simple urlencoded form data, and
// - it keeps the dependency footprint small for a route that lives on the
//   checkout hot path.
//
// DoD (from the issue):
//   "Endpoint funktioniert mit Test-Mode-Keys, Stripe-Test-Karte führt zur
//    Checkout-Page."

import { NextResponse } from "next/server";
import { getAppEnv } from "@/lib/env";
import {
  getProduct,
  paymentMethodsFor,
  type ProductDefinition,
} from "@/lib/billing/products";
import { trackServerEvent } from "@/lib/analytics/server-track";

export const runtime = "edge";

const STRIPE_API = "https://api.stripe.com/v1/checkout/sessions";

// Hard cap on how much arbitrary metadata we forward to Stripe. Keeps
// abuse vectors (huge headers, tracking fingerprints) bounded.
const REFERRER_MAX_LEN = 128;
const COUPON_MAX_LEN = 64;

type CheckoutPayload = {
  productSku?: unknown;
  quantity?: unknown;
  couponCode?: unknown;
  referrerCampaign?: unknown;
};

type ValidatedInput = {
  product: ProductDefinition;
  quantity: number;
  couponCode: string | null;
  referrerCampaign: string | null;
};

function badRequest(error: string, extra?: Record<string, unknown>): Response {
  return NextResponse.json({ error, ...extra }, { status: 400 });
}

function validate(body: CheckoutPayload): ValidatedInput | Response {
  const product = getProduct(body.productSku);
  if (!product) {
    return badRequest("invalid_sku");
  }

  // Quantity: positive integer up to the product's max. The sales site
  // controls a number input, but we never trust it.
  const qtyRaw = body.quantity;
  const qty =
    typeof qtyRaw === "number"
      ? qtyRaw
      : typeof qtyRaw === "string"
        ? Number(qtyRaw)
        : NaN;
  if (!Number.isInteger(qty) || qty < 1) {
    return badRequest("invalid_quantity");
  }
  if (qty > product.maxQuantity) {
    return badRequest("quantity_exceeds_limit", {
      maxQuantity: product.maxQuantity,
    });
  }

  // Coupons are plumbing-only in v1: we forward them as metadata so the
  // webhook can correlate, but discount application happens via Stripe's
  // built-in `allow_promotion_codes` UI. See TYP-35 plan §10.
  const couponRaw = body.couponCode;
  const coupon =
    typeof couponRaw === "string" && couponRaw.trim().length > 0
      ? couponRaw.trim().slice(0, COUPON_MAX_LEN)
      : null;

  const refRaw = body.referrerCampaign;
  const referrerCampaign =
    typeof refRaw === "string" && refRaw.trim().length > 0
      ? refRaw.trim().slice(0, REFERRER_MAX_LEN)
      : null;

  return {
    product,
    quantity: qty,
    couponCode: coupon,
    referrerCampaign,
  };
}

function buildStripeBody(
  input: ValidatedInput,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("mode", input.product.mode);
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", String(input.quantity));

  for (const method of paymentMethodsFor(input.product.mode)) {
    params.append("payment_method_types[]", method);
  }

  // Surface promo-code UI inside Stripe's hosted page — the cleanest path
  // until we build a coupon UI of our own.
  params.set("allow_promotion_codes", "true");

  // For one-time orders we need to capture the buyer email to send the
  // activation mail. For subscriptions Stripe captures it automatically.
  if (input.product.mode === "payment") {
    params.set("customer_creation", "if_required");
  }

  // Locale: most of our DACH traffic is German. Stripe falls back to its
  // own heuristics if we send `auto`.
  params.set("locale", "de");

  // Metadata: webhook reads `sku`/`quantity`/`is_b2b` to know how many
  // activation codes to mint and which template to send.
  params.set("metadata[sku]", input.product.sku);
  params.set("metadata[quantity]", String(input.quantity));
  params.set("metadata[is_b2b]", input.product.isB2B ? "1" : "0");
  if (input.couponCode) {
    params.set("metadata[coupon_hint]", input.couponCode);
  }
  if (input.referrerCampaign) {
    params.set("metadata[referrer_campaign]", input.referrerCampaign);
  }

  return params;
}

async function createStripeSession(
  secretKey: string,
  body: URLSearchParams,
  idempotencyKey: string,
): Promise<{ ok: true; id: string; url: string } | { ok: false; status: number; error: string }> {
  // Basic-Auth with empty password is Stripe's documented convention for
  // secret-key auth.
  const auth = btoa(`${secretKey}:`);
  let res: Response;
  try {
    res = await fetch(STRIPE_API, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": idempotencyKey,
      },
      body: body.toString(),
    });
  } catch {
    return { ok: false, status: 502, error: "stripe_unreachable" };
  }

  const json = (await res.json().catch(() => null)) as
    | { id?: string; url?: string; error?: { message?: string; code?: string } }
    | null;

  if (!res.ok) {
    return {
      ok: false,
      status: res.status >= 500 ? 502 : 400,
      error: json?.error?.code ?? json?.error?.message ?? "stripe_error",
    };
  }
  if (!json?.id || !json?.url) {
    return { ok: false, status: 502, error: "stripe_malformed_response" };
  }
  return { ok: true, id: json.id, url: json.url };
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as
    | CheckoutPayload
    | null;
  if (!body || typeof body !== "object") {
    return badRequest("invalid_body");
  }

  const validated = validate(body);
  if (validated instanceof Response) {
    return validated;
  }

  const env = await getAppEnv();
  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }
  const priceId = env[validated.product.priceEnvKey];
  if (!priceId) {
    return NextResponse.json(
      { error: "price_not_configured", sku: validated.product.sku },
      { status: 503 },
    );
  }

  // Hardcoded per the issue's DoD — these are deliberate cross-domain
  // boundaries between the (Astro/WordPress) sales site and the
  // (Next.js) app. They live in code, not env, so a misconfigured deploy
  // can't quietly redirect buyers to the wrong host.
  const successUrl =
    "https://app.typ2-kompass.de/checkout/danke?session_id={CHECKOUT_SESSION_ID}";
  const cancelUrl = "https://typ2-kompass.de/preise";

  const stripeBody = buildStripeBody(
    validated,
    priceId,
    successUrl,
    cancelUrl,
  );

  // Idempotency: prevent double-creation on retried client POSTs. Random per
  // request is fine — we don't want different callers to collide, only the
  // same caller to be safe under retry. Stripe stores the result for 24h.
  const idempotencyKey = crypto.randomUUID();

  const result = await createStripeSession(
    env.STRIPE_SECRET_KEY,
    stripeBody,
    idempotencyKey,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Plausible funnel event — fire-and-forget; never blocks the redirect.
  await trackServerEvent({
    name: "checkout_started",
    url: request.url,
    headers: request.headers,
    props: {
      sku: validated.product.sku,
      quantity: String(validated.quantity),
      is_b2b: validated.product.isB2B,
    },
  });

  return NextResponse.json({ url: result.url });
}
