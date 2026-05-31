-- Module progress tracking. One row per (userId, moduleSlug) pair; INSERT OR
-- REPLACE keeps it idempotent when the user clicks "Modul abschließen" again.
-- Only boolean completion and optional last-seen section index are stored —
-- no freetext, no per-event trail, in line with the no-PII scope rule.

CREATE TABLE IF NOT EXISTS "module_progress" (
    "id"          text NOT NULL,
    "userId"      text NOT NULL,
    "moduleSlug"  text NOT NULL,
    "completed"   integer NOT NULL DEFAULT 0,
    "position"    integer DEFAULT NULL,
    "updatedAt"   datetime NOT NULL,
    PRIMARY KEY ("id"),
    UNIQUE ("userId", "moduleSlug")
);

CREATE INDEX IF NOT EXISTS "idx_module_progress_userId"
    ON "module_progress" ("userId");
