-- Add Stripe PaymentIntent ID to orders so we can resolve charge.refunded
-- events back to the original order (the charge object carries
-- payment_intent, not checkout_session). Nullable because legacy/test rows
-- inserted before this migration won't have it.
-- Applied via: wrangler d1 execute typ2-kompass-db --file=drizzle/0005_order_payment_intent.sql
-- For local dev: wrangler d1 execute typ2-kompass-db --local --file=drizzle/0005_order_payment_intent.sql

ALTER TABLE "orders" ADD COLUMN "stripePaymentIntentId" text;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_orders_stripePaymentIntentId"
    ON "orders" ("stripePaymentIntentId")
    WHERE "stripePaymentIntentId" IS NOT NULL;
