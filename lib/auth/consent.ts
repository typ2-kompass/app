import type { D1Database } from "@cloudflare/workers-types";

// GDPR consent receipt — DSGVO requires we record *what* the user agreed to
// and *when*. Update CONSENT_VERSION when the wording changes; existing rows
// are never mutated.
export const CONSENT_VERSION = "2026-05-30";

export async function recordSignupConsent(
  db: D1Database,
  params: { userId: string; acceptedAt?: Date },
): Promise<void> {
  const acceptedAt = (params.acceptedAt ?? new Date()).toISOString();
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO consent (id, userId, kind, version, acceptedAt) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, params.userId, "signup", CONSENT_VERSION, acceptedAt)
    .run();
}
