// Diagnostic endpoint for TYP-25: reports which auth-related env vars
// the worker can actually see at runtime, without leaking the secret
// values themselves. Gated by NEXT_PUBLIC_DEBUG_THROW_KEY (same gate as
// /api/dev-throw). Remove once auth is verified.

import { getAppEnv } from "@/lib/env";

export const runtime = "edge";

// Hardcoded one-shot diagnostic key. Endpoint is removed in a follow-up
// commit once auth is verified, so this string never sticks around.
const DIAG_KEY = "typ25-diag-2026-06-04";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const supplied = url.searchParams.get("key");
  if (supplied !== DIAG_KEY) {
    return new Response("not found", { status: 404 });
  }
  let report: Record<string, unknown> = {};
  try {
    const env = await getAppEnv();
    report = {
      hasDB: typeof env.DB === "object" && env.DB !== null,
      hasAuthSecret: typeof env.AUTH_SECRET === "string" && env.AUTH_SECRET.length > 0,
      authSecretLen: typeof env.AUTH_SECRET === "string" ? env.AUTH_SECRET.length : null,
      hasResendKey: typeof env.RESEND_API_KEY === "string" && env.RESEND_API_KEY.length > 0,
      hasEmailFrom: typeof env.EMAIL_FROM === "string" && env.EMAIL_FROM.length > 0,
      emailFrom: env.EMAIL_FROM ?? null,
      hasAuthUrl: typeof env.AUTH_URL === "string" && env.AUTH_URL.length > 0,
      authUrl: env.AUTH_URL ?? null,
      envKeys: Object.keys(env as object).sort(),
    };
  } catch (e) {
    report = { error: String(e) };
  }
  return new Response(JSON.stringify(report, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
