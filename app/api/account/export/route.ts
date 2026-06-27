import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAppEnv } from "@/lib/env";

export const runtime = "edge";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const env = await getAppEnv();
  if (!env.DB) {
    return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  const userId = session.user.id;

  const [consentRow, moduleRows] = await Promise.all([
    env.DB.prepare(
      "SELECT acceptedAt FROM consent WHERE userId = ? ORDER BY acceptedAt ASC LIMIT 1",
    )
      .bind(userId)
      .first<{ acceptedAt: string } | null>(),
    env.DB.prepare(
      "SELECT moduleSlug FROM module_progress WHERE userId = ? AND completed = 1",
    )
      .bind(userId)
      .all<{ moduleSlug: string }>(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    email: session.user.email,
    consentTimestamp: consentRow?.acceptedAt ?? null,
    completedModuleIds: (moduleRows.results ?? []).map((r) => r.moduleSlug),
  };

  const json = JSON.stringify(payload, null, 2);

  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="typ2-kompass-export.json"',
    },
  });
}
