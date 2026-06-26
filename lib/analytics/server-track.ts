// Server-side Plausible event firing. Browser events go through window.plausible
// (see lib/analytics/track.ts); server flows that finish with a redirect — like
// the activation route — never reach the client, so we POST directly to
// Plausible from the Pages worker. Mirrors the proxy in app/api/event/route.ts
// (User-Agent + X-Forwarded-For preserved so the daily-rotating-salt visitor
// aggregation stays accurate).

const UPSTREAM = "https://plausible.io/api/event";

export type ServerAnalyticsEventName =
  | "activation_clicked"
  | "activation_email_sent"
  | "app_first_login"
  | "checkout_started"
  | "checkout_completed"
  | "payment_failed";

export async function trackServerEvent(params: {
  name: ServerAnalyticsEventName;
  url: string;
  headers: Headers;
  props?: Record<string, string | boolean>;
}): Promise<void> {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return;
  const ua = params.headers.get("user-agent") ?? "Mozilla/5.0";
  const ip =
    params.headers.get("cf-connecting-ip") ??
    params.headers.get("x-forwarded-for");
  try {
    await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": ua,
        ...(ip ? { "X-Forwarded-For": ip } : {}),
      },
      body: JSON.stringify({
        name: params.name,
        url: params.url,
        domain,
        ...(params.props ? { props: params.props } : {}),
      }),
    });
  } catch {
    // Analytics must never break the user flow.
  }
}
