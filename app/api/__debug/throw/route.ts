// Verification endpoint: forces an uncaught error so we can confirm Sentry
// receives it with a readable, source-mapped stack. Gated by a server-only
// secret so it cannot be triggered by drive-by traffic.

export const runtime = "edge";

export async function GET(request: Request): Promise<Response> {
  const expected = process.env.DEBUG_THROW_KEY;
  if (!expected) {
    return new Response("not configured", { status: 404 });
  }
  const url = new URL(request.url);
  const supplied = url.searchParams.get("key");
  if (supplied !== expected) {
    return new Response("not found", { status: 404 });
  }
  throw new Error(
    `typ2-kompass __debug/throw at ${new Date().toISOString()} — verifying error reporting wiring`,
  );
}
