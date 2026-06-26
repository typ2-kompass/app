// Server-side product registry for Stripe Checkout — TYP-48 / TYP-35 subtask 3.
//
// Why a registry rather than free-form input: the sales site sends only a SKU
// string ("kompass_b2c_einmal_v1"), and we never trust client-supplied prices
// or quantities. The registry maps each SKU to:
//   - the env var that holds its Stripe Price ID (filled in by TYP-67),
//   - the Stripe Checkout `mode` it ships with,
//   - the max quantity allowed in a single Checkout Session.
//
// Per the issue and TYP-34 ("Einmalzahlung-zentriert") both v1 SKUs are
// one-time payments (`mode=payment`). If B2B ever moves to recurring, change
// the registry entry and the payment_method_types selection adapts.

import type { AppEnv } from "@/lib/env";

export type StripeCheckoutMode = "payment" | "subscription";

export type ProductDefinition = {
  sku: string;
  // Name of the env var on AppEnv that holds the Stripe Price ID for this SKU.
  // Indirection lets us keep real price IDs out of source while still failing
  // loudly at request time when they're missing.
  priceEnvKey: keyof Pick<AppEnv, "STRIPE_PRICE_B2C" | "STRIPE_PRICE_B2B_SEAT">;
  mode: StripeCheckoutMode;
  maxQuantity: number;
  isB2B: boolean;
};

export const PRODUCTS: Record<string, ProductDefinition> = {
  kompass_b2c_einmal_v1: {
    sku: "kompass_b2c_einmal_v1",
    priceEnvKey: "STRIPE_PRICE_B2C",
    mode: "payment",
    maxQuantity: 1,
    isB2B: false,
  },
  kompass_b2b_seat_v1: {
    sku: "kompass_b2b_seat_v1",
    priceEnvKey: "STRIPE_PRICE_B2B_SEAT",
    mode: "payment",
    // Generous v1 cap — large bulk orders go through manual sales rather than
    // self-serve checkout. Tighten if abuse surfaces.
    maxQuantity: 500,
    isB2B: true,
  },
};

export function getProduct(sku: unknown): ProductDefinition | null {
  if (typeof sku !== "string") return null;
  return Object.prototype.hasOwnProperty.call(PRODUCTS, sku)
    ? PRODUCTS[sku]
    : null;
}

// payment_method_types: card + DACH-relevant alternatives per the plan
// (TYP-35 section 0.2). Stripe rejects unsupported methods per mode, so we
// keep one-time and subscription lists separate.
//
// Note on subscription methods: Stripe does not support `sofort` or `klarna`
// for recurring charges; we silently fall back to card+sepa+paypal there.
export function paymentMethodsFor(mode: StripeCheckoutMode): string[] {
  if (mode === "subscription") {
    return ["card", "sepa_debit", "paypal"];
  }
  return ["card", "sepa_debit", "sofort", "klarna", "paypal"];
}
