import type { D1Database } from "@cloudflare/workers-types";

export interface ChangelogEntry {
  id: string;
  date: string;         // YYYY-MM-DD
  title: string;
  body: string;
  reviewed_by: string;
  reviewed_at: string;  // YYYY-MM-DD
  content_link: string | null;
  is_new: 0 | 1;
}

/** Returns changelog entries with date >= activatedAt, newest first. */
export async function getChangelogForUser(
  db: D1Database,
  activatedAt: string,
): Promise<ChangelogEntry[]> {
  const rows = await db
    .prepare(
      `SELECT id, date, title, body, reviewed_by, reviewed_at, content_link, is_new
       FROM changelog_entries
       WHERE date >= ?
       ORDER BY date DESC`,
    )
    .bind(activatedAt.slice(0, 10))
    .all<ChangelogEntry>();
  return rows.results ?? [];
}

/** Returns the count of entries in the given calendar month (YYYY-MM). */
export async function countEntriesInMonth(
  db: D1Database,
  yearMonth: string,  // e.g. "2026-06"
): Promise<{ total: number; newCount: number }> {
  const from = `${yearMonth}-01`;
  const [y, m] = yearMonth.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const to = `${nextMonth}-01`;

  const row = await db
    .prepare(
      `SELECT COUNT(*) as total, SUM(is_new) as newCount
       FROM changelog_entries
       WHERE date >= ? AND date < ?`,
    )
    .bind(from, to)
    .first<{ total: number; newCount: number }>();
  return { total: row?.total ?? 0, newCount: row?.newCount ?? 0 };
}

/** Returns the user's earliest activatedAt (ISO) from entitlements, or null. */
export async function getUserActivatedAt(
  db: D1Database,
  userId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT activatedAt FROM entitlements
       WHERE userId = ? AND revokedAt IS NULL
       ORDER BY activatedAt ASC LIMIT 1`,
    )
    .bind(userId)
    .first<{ activatedAt: string }>();
  return row?.activatedAt ?? null;
}
