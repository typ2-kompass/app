-- Add orderToken to orders for B2B-Verwalter page auth (TYP-52).
-- The token is a long random string (UUID or similar) included in the buyer
-- confirmation email. Visiting /seats/{orderToken} grants read+write access
-- to all activation codes in that order — no session / magic-link login
-- required. The UNIQUE constraint ensures tokens are globally unguessable.
-- Applied via: wrangler d1 execute typ2-kompass-db --file=drizzle/0004_order_token.sql
-- For local dev: wrangler d1 execute typ2-kompass-db --local --file=drizzle/0004_order_token.sql

ALTER TABLE "orders" ADD COLUMN "orderToken" text;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_orders_orderToken" ON "orders" ("orderToken")
    WHERE "orderToken" IS NOT NULL;
