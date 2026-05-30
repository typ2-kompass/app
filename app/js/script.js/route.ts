// Plausible script proxy. The script is served from our origin so content
// blockers (uBlock, Brave Shields) don't drop it. We fetch the upstream
// script once per cold start and cache it at the edge. Returning early
// without a domain set keeps preview deploys lean.

export const runtime = "edge";

const UPSTREAM = "https://plausible.io/js/script.js";

export async function GET(): Promise<Response> {
  const upstream = await fetch(UPSTREAM, {
    cf: { cacheTtl: 3600, cacheEverything: true },
  } as RequestInit);
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
