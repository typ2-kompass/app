import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAppEnv } from "@/lib/env";

export const runtime = "edge";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,80}$/;

function newId(): string {
  return crypto.randomUUID();
}

// GET — returns current completion state for the authed user.
// 200 { completed: boolean } when authenticated.
// 401 { loginRequired: true } when not.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, loginRequired: true }, { status: 401 });
  }

  const env = await getAppEnv();
  if (!env.DB) {
    return NextResponse.json({ completed: false });
  }

  const row = await env.DB.prepare(
    "SELECT completed FROM module_progress WHERE userId = ? AND moduleSlug = ?",
  )
    .bind(session.user.id, slug)
    .first<{ completed: number } | null>();

  return NextResponse.json({ completed: row?.completed === 1 });
}

// POST — marks the module as completed for the authed user.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, loginRequired: true, error: "auth_required" }, { status: 401 });
  }

  const env = await getAppEnv();
  if (!env.DB) {
    return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const userId = session.user.id;
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO module_progress (id, userId, moduleSlug, completed, updatedAt)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT (userId, moduleSlug)
     DO UPDATE SET completed = 1, updatedAt = excluded.updatedAt`,
  )
    .bind(newId(), userId, slug, now)
    .run();

  return NextResponse.json({ ok: true, completed: true });
}
