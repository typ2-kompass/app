// Aggregate-only event names shared with the Next.js app's funnel events.
// Property values are constrained to short strings or booleans; no PII.
// Mirrors the strictness of lib/analytics/track.ts in the Next.js app.

export type MarketingAnalyticsEventName =
  | "sales_page_view"
  | "cta_clicked";

const FORBIDDEN_PROP_KEYS = new Set([
  "userid",
  "user_id",
  "uid",
  "email",
  "name",
  "vorname",
  "nachname",
  "distinctid",
  "distinct_id",
  "ip",
  "ip_address",
]);

const MAX_PROP_LENGTH = 32;

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

function sanitiseProps(
  raw: Record<string, unknown> | undefined,
): Record<string, string | boolean> | undefined {
  if (!raw) return undefined;
  const out: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (FORBIDDEN_PROP_KEYS.has(key.toLowerCase())) continue;
    if (typeof value === "boolean") {
      out[key] = value;
      continue;
    }
    if (typeof value === "string" && value.length <= MAX_PROP_LENGTH) {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function trackMarketingEvent(
  name: MarketingAnalyticsEventName,
  props?: Record<string, string | boolean>,
): void {
  if (typeof window === "undefined") return;
  const plausible = window.plausible;
  if (typeof plausible !== "function") return;
  const cleaned = sanitiseProps(props as Record<string, unknown> | undefined);
  plausible(name, cleaned ? { props: cleaned } : undefined);
}
