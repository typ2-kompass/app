import { NextResponse } from "next/server";

export const runtime = "edge";

// Slug shape guard — accept lowercase, digits, and hyphens only. Persistence
// (and the actual whitelist check against `content/modules/`) lands with TYP-3,
// once auth + ModuleProgress is wired and we can import the manifest from a
// node runtime route. Until then this endpoint always returns 401 so the UI
// shows the registration prompt; the slug shape check is cheap defence.
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,80}$/;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: false,
      loginRequired: true,
      error: "auth_required",
    },
    { status: 401 },
  );
}
