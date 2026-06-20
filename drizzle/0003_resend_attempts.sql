-- Resend-Attempts: per-email rate-limiting bucket for /api/billing/resend-activation (TYP-51).
-- One row per successful (non-rate-limited) resend request. Rate-limit logic
-- counts rows in the last 60s (max 1) and last 24h (max 5) for the requesting
-- email before allowing another attempt.
-- Applied via: wrangler d1 execute typ2-kompass-db --file=drizzle/0003_resend_attempts.sql
-- For local dev: wrangler d1 execute typ2-kompass-db --local --file=drizzle/0003_resend_attempts.sql

CREATE TABLE IF NOT EXISTS "resend_attempts" (
    "id"           text     NOT NULL,
    "email"        text     NOT NULL,
    "attemptedAt"  datetime NOT NULL,
    PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_resend_attempts_email_time"
    ON "resend_attempts" ("email", "attemptedAt");
