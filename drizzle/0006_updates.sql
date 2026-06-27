-- Update-Kommunikation: changelog entries, in-app notifications, user_preferences.
-- Applied via: wrangler d1 execute typ2-kompass-db --file=drizzle/0006_updates.sql
-- For local dev: wrangler d1 execute typ2-kompass-db --local --file=drizzle/0006_updates.sql

-- Changelog entries maintained by the editorial team.
CREATE TABLE IF NOT EXISTS "changelog_entries" (
    "id"           text     NOT NULL,
    "date"         text     NOT NULL,   -- YYYY-MM-DD
    "title"        text     NOT NULL,
    "body"         text     NOT NULL,
    "reviewed_by"  text     NOT NULL,   -- Reviewer name + DDG qualification
    "reviewed_at"  text     NOT NULL,   -- YYYY-MM-DD
    "content_link" text,                -- optional deep link to updated module
    "is_new"       integer  NOT NULL DEFAULT 0,  -- 1 = "Neu", 0 = "Aktualisiert"
    "created_at"   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_changelog_date" ON "changelog_entries" ("date");

-- In-app notification inbox per user (monthly update reports, etc.).
CREATE TABLE IF NOT EXISTS "in_app_notifications" (
    "id"        text     NOT NULL,
    "userId"    text     NOT NULL,
    "kind"      text     NOT NULL,   -- 'monthly_update_report'
    "title"     text     NOT NULL,
    "body"      text,
    "readAt"    datetime,
    "createdAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_notifications_userId" ON "in_app_notifications" ("userId");

-- Lightweight per-user preferences (update email opt-in, etc.).
CREATE TABLE IF NOT EXISTS "user_preferences" (
    "userId"              text    NOT NULL,
    "updateEmailOptIn"    integer NOT NULL DEFAULT 0,  -- 1 = opted in at purchase
    "updatedAt"           datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId")
);
