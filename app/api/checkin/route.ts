import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAppEnv } from "@/lib/env";
import { promptForDate, PROMPTS } from "@/lib/checkin/prompts";

export const runtime = "edge";

interface CheckinRow {
  id: string;
  checkinDate: string;
  mood: number;
  promptKey: string;
  promptText: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /api/checkin?days=7
// Returns the last N check-ins for the authenticated user.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, loginRequired: true }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") ?? "7", 10) || 7, 1), 30);

  const env = await getAppEnv();
  if (!env.DB) {
    return NextResponse.json({ ok: true, checkins: [] });
  }

  const rows = await env.DB.prepare(
    `SELECT id, checkinDate, mood, promptKey, promptText, note, createdAt, updatedAt
     FROM checkin
     WHERE userId = ?
     ORDER BY checkinDate DESC
     LIMIT ?`,
  )
    .bind(session.user.id, days)
    .all<CheckinRow>();

  // Strip note from response to avoid leaking it to analytics or error tools —
  // it exists on the object only for data-export (TYP-7), not history views.
  const checkins = (rows.results ?? []).map((r) => ({
    id: r.id,
    checkinDate: r.checkinDate,
    mood: r.mood,
    promptKey: r.promptKey,
    promptText: r.promptText,
    hasNote: r.note !== null && r.note.length > 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return NextResponse.json({ ok: true, checkins });
}

// POST /api/checkin
// Body: { mood: 1-5, note?: string, checkinDate: string (YYYY-MM-DD) }
// Upserts one check-in per user per calendar day.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, loginRequired: true, error: "auth_required" }, { status: 401 });
  }

  let body: { mood?: unknown; note?: unknown; checkinDate?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const mood = Number(body.mood);
  if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
    return NextResponse.json({ ok: false, error: "invalid_mood" }, { status: 400 });
  }

  const checkinDate =
    typeof body.checkinDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.checkinDate)
      ? body.checkinDate
      : null;
  if (!checkinDate) {
    return NextResponse.json({ ok: false, error: "invalid_date" }, { status: 400 });
  }

  // Reject dates more than 1 day in the future (clock skew tolerance).
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (checkinDate > tomorrow.toISOString().slice(0, 10)) {
    return NextResponse.json({ ok: false, error: "future_date" }, { status: 400 });
  }

  // note: strip to max 500 chars; never logged/tracked elsewhere
  const rawNote = typeof body.note === "string" ? body.note.trim().slice(0, 500) : null;
  const note = rawNote && rawNote.length > 0 ? rawNote : null;

  const prompt = promptForDate(checkinDate);
  const env = await getAppEnv();
  if (!env.DB) {
    return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const userId = session.user.id;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO checkin (id, userId, checkinDate, mood, promptKey, promptText, note, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (userId, checkinDate)
     DO UPDATE SET mood = excluded.mood,
                   promptKey = excluded.promptKey,
                   promptText = excluded.promptText,
                   note = excluded.note,
                   updatedAt = excluded.updatedAt`,
  )
    .bind(id, userId, checkinDate, mood, prompt.key, prompt.text, note, now, now)
    .run();

  return NextResponse.json({ ok: true, checkinDate, mood, promptKey: prompt.key });
}
