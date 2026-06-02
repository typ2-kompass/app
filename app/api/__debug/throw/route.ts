// Verification endpoint: forces an uncaught error so we can confirm error
// reporting is wired. Gated by a server-only secret so it cannot be triggered
// by drive-by traffic.
//
// Note: on Cloudflare Workers / next-on-pages, server-side Sentry is wired
// in a follow-up issue (needs @sentry/cloudflare, not @sentry/nextjs).
// For TYP-4 verification we use the client-side /_throw page instead, which
// surfaces a real error through the browser Sentry SDK.

export const runtime = "edge";

export async function GET(request: Request): Promise<Response> {
  const expected = process.env.NEXT_PUBLIC_DEBUG_THROW_KEY;
  if (!expected) {
    return new Response("not configured", { status: 404 });
  }
  const url = new URL(request.url);
  const supplied = url.searchParams.get("key");
  if (supplied !== expected) {
    return new Response("not found", { status: 404 });
  }
  throw new Error(
    `typ2-kompass __debug/throw at ${new Date().toISOString()} — verifying error reporting wiring (server-side; on Workers this is surfaced via wrangler tail / CF Logs)`,
  );
}
