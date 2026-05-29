import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email: unknown = body?.email;

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
  }

  // TODO (Phase 1): persist to email provider (Brevo / Mailchimp / custom DB)
  console.log("[waitlist] new signup:", email);

  return NextResponse.json({ ok: true });
}
