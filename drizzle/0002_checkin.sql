-- Daily check-in table. One row per (userId, checkinDate); upsert on same-day
-- resubmit. Free-text notes stay in our DB only — never sent to analytics or
-- error-tracking (enforced by sentry-scrubber and the track() guard).
-- promptText is a snapshot of the German prompt at submit time so history
-- remains readable even if the prompt pool changes.

CREATE TABLE IF NOT EXISTS "checkin" (
    "id"           text NOT NULL,
    "userId"       text NOT NULL,
    "checkinDate"  text NOT NULL,  -- ISO date YYYY-MM-DD in user browser tz
    "mood"         integer NOT NULL CHECK ("mood" BETWEEN 1 AND 5),
    "promptKey"    text NOT NULL,  -- e.g. "p1".."p10"
    "promptText"   text NOT NULL,  -- snapshot at submit time
    "note"         text,           -- nullable; never leaves this database
    "createdAt"    datetime NOT NULL,
    "updatedAt"    datetime NOT NULL,
    PRIMARY KEY ("id"),
    UNIQUE ("userId", "checkinDate")
);

CREATE INDEX IF NOT EXISTS "idx_checkin_userId_date"
    ON "checkin" ("userId", "checkinDate" DESC);
