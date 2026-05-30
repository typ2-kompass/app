// Plausible event proxy. Forwards POSTs to plausible.io/api/event preserving
// the visitor's User-Agent and CF-Connecting-IP so Plausible can do its
// daily-rotating-salt aggregation. Plausible never sees our origin; the
// visitor's browser never sees plausible.io.

export const runtime = "edge";

const UPSTREAM = "https://plausible.io/api/event";

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const ua = request.headers.get("user-agent");
  if (ua) headers.set("User-Agent", ua);
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for");
  if (ip) headers.set("X-Forwarded-For", ip);

  const upstream = await fetch(UPSTREAM, {
    method: "POST",
    headers,
    body,
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "text/plain" },
  });
}
