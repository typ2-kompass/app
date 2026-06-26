import type { D1Database } from "@cloudflare/workers-types";

export interface AppEnv {
  DB: D1Database;
  AUTH_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  AUTH_URL?: string;
  // Stripe (test-mode for now; live keys swapped in via CF Pages env).
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_B2C?: string;
  STRIPE_PRICE_B2B_SEAT?: string;
  // Marketing/sales site origin — used as the default cancel_url and as the
  // referer when no explicit return path is provided.
  MARKETING_URL?: string;
}

// Resolve the Cloudflare Pages request context lazily. We can't import
// `@cloudflare/next-on-pages` at module top level because it isn't usable in
// `next dev` (it only exists inside the Pages worker runtime). Doing it inline
// per call keeps `next dev` from crashing on import resolution while letting
// production / `wrangler pages dev` use the real bindings.
export async function getAppEnv(): Promise<AppEnv> {
  try {
    const mod = await import("@cloudflare/next-on-pages");
    const ctx = mod.getRequestContext();
    return ctx.env as unknown as AppEnv;
  } catch {
    // Fallback for `next dev` (and tooling): read from process.env. The D1
    // binding will be undefined here; routes that need it should be invoked
    // through `wrangler pages dev` instead.
    return {
      DB: undefined as unknown as D1Database,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "",
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
      EMAIL_FROM: process.env.EMAIL_FROM ?? "Typ2-Kompass <no-reply@typ2-kompass.de>",
      AUTH_URL: process.env.AUTH_URL,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      STRIPE_PRICE_B2C: process.env.STRIPE_PRICE_B2C,
      STRIPE_PRICE_B2B_SEAT: process.env.STRIPE_PRICE_B2B_SEAT,
      MARKETING_URL: process.env.MARKETING_URL,
    };
  }
}
