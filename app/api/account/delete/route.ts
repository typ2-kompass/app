import { NextResponse } from "next/server";
import { auth, signOut } from "@/lib/auth";
import { getAppEnv } from "@/lib/env";

export const runtime = "edge";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let body: { confirm?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  // Require the user to type their own email address as re-confirmation.
  if (body.confirm?.trim().toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "confirm_mismatch" }, { status: 422 });
  }

  const env = await getAppEnv();
  if (!env.DB) {
    return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const userId = session.user.id;

  // Delete in dependency order: child rows first, then the user row.
  // D1 doesn't enforce FK constraints, so order matters for a clean wipe.
  await env.DB.batch([
    env.DB.prepare("DELETE FROM module_progress WHERE userId = ?").bind(userId),
    env.DB.prepare("DELETE FROM consent WHERE userId = ?").bind(userId),
    env.DB.prepare("DELETE FROM sessions WHERE userId = ?").bind(userId),
    env.DB.prepare("DELETE FROM accounts WHERE userId = ?").bind(userId),
    env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId),
  ]);

  // Sign the session out server-side. Auth.js v5 signOut() redirects by default;
  // we pass redirect:false so the API can return JSON and the client handles nav.
  await signOut({ redirect: false });

  return NextResponse.json({ ok: true });
}
