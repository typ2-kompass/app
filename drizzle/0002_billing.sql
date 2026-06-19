-- Billing tables: orders, activation_codes, entitlements, webhook_events.
-- Applied via: wrangler d1 execute typ2-kompass-db --file=drizzle/0002_billing.sql
-- For local dev: wrangler d1 execute typ2-kompass-db --local --file=drizzle/0002_billing.sql

CREATE TABLE IF NOT EXISTS "orders" (
    "id"                 text    NOT NULL,
    "stripeSessionId"    text    NOT NULL,
    "buyerEmail"         text    NOT NULL,
    "productSku"         text    NOT NULL,
    "quantity"           integer NOT NULL,
    "amountTotalCents"   integer NOT NULL,
    "currency"           text    NOT NULL,
    "status"             text    NOT NULL,   -- 'paid' | 'refunded'
    "createdAt"          datetime NOT NULL,
    "refundedAt"         datetime,
    PRIMARY KEY ("id"),
    UNIQUE ("stripeSessionId")
);

CREATE TABLE IF NOT EXISTS "activation_codes" (
    "code"              text NOT NULL,        -- K-XXXX-XXXX-XXXX
    "orderId"           text NOT NULL,
    "recipientEmail"    text,                 -- set when B2B distributor assigns a seat (B2C = buyerEmail)
    "status"            text NOT NULL,        -- 'pending' | 'sent' | 'redeemed' | 'revoked'
    "redeemedByUserId"  text,
    "sentAt"            datetime,
    "redeemedAt"        datetime,
    "revokedAt"         datetime,
    PRIMARY KEY ("code")
);

CREATE TABLE IF NOT EXISTS "entitlements" (
    "id"           text     NOT NULL,
    "userId"       text     NOT NULL,
    "orderId"      text     NOT NULL,
    "productSku"   text     NOT NULL,
    "activatedAt"  datetime NOT NULL,
    "revokedAt"    datetime,
    PRIMARY KEY ("id"),
    UNIQUE ("userId", "orderId")
);

CREATE TABLE IF NOT EXISTS "webhook_events" (
    "stripeEventId"  text     NOT NULL,
    "type"           text     NOT NULL,
    "processedAt"    datetime NOT NULL,
    PRIMARY KEY ("stripeEventId")
);

CREATE INDEX IF NOT EXISTS "idx_activation_codes_orderId" ON "activation_codes" ("orderId");
CREATE INDEX IF NOT EXISTS "idx_entitlements_userId"      ON "entitlements"      ("userId");
