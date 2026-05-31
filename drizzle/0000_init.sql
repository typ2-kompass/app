-- Initial schema for Typ2-Kompass auth + GDPR consent.
-- Applied via: wrangler d1 execute typ2-kompass-db --file=drizzle/0000_init.sql
-- The first four tables follow the @auth/d1-adapter shape and are non-negotiable;
-- the `consent` table is our own GDPR receipt store.

CREATE TABLE IF NOT EXISTS "accounts" (
    "id" text NOT NULL,
    "userId" text NOT NULL DEFAULT NULL,
    "type" text NOT NULL DEFAULT NULL,
    "provider" text NOT NULL DEFAULT NULL,
    "providerAccountId" text NOT NULL DEFAULT NULL,
    "refresh_token" text DEFAULT NULL,
    "access_token" text DEFAULT NULL,
    "expires_at" number DEFAULT NULL,
    "token_type" text DEFAULT NULL,
    "scope" text DEFAULT NULL,
    "id_token" text DEFAULT NULL,
    "session_state" text DEFAULT NULL,
    "oauth_token_secret" text DEFAULT NULL,
    "oauth_token" text DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL DEFAULT NULL,
    "expires" datetime NOT NULL DEFAULT NULL,
    PRIMARY KEY (sessionToken)
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" text NOT NULL DEFAULT '',
    "name" text DEFAULT NULL,
    "email" text DEFAULT NULL,
    "emailVerified" datetime DEFAULT NULL,
    "image" text DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" text NOT NULL,
    "token" text NOT NULL DEFAULT NULL,
    "expires" datetime NOT NULL DEFAULT NULL,
    PRIMARY KEY (token)
);

-- GDPR consent receipts. One row per consent event; we never delete or mutate
-- past rows, so we keep a full audit trail of what each user agreed to and when.
CREATE TABLE IF NOT EXISTS "consent" (
    "id" text NOT NULL,
    "userId" text NOT NULL,
    "kind" text NOT NULL,
    "version" text NOT NULL,
    "acceptedAt" datetime NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "idx_consent_userId" ON "consent" ("userId");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
