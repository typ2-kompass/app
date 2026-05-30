import type { AnalyticsEvent } from "./events";

// Keys we hard-refuse to send to any third-party analytics. Belt-and-suspenders
// for the type system, in case a non-TS call site or a future contributor
// tries to slip an identifier in.
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
  "geburt",
  "geburtsdatum",
  "address",
  "adresse",
  "text",
  "content",
  "note",
  "notiz",
  "reflection",
  "reflexion",
  "diary",
  "hba1c",
  "glucose",
  "insulin",
  "weight",
  "gewicht",
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
    if (FORBIDDEN_PROP_KEYS.has(key.toLowerCase())) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[analytics] dropped forbidden prop key: ${key}`);
      }
      continue;
    }
    if (typeof value === "boolean") {
      out[key] = value;
      continue;
    }
    if (typeof value === "string") {
      if (value.length > MAX_PROP_LENGTH) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn(`[analytics] dropped over-long prop ${key} (>${MAX_PROP_LENGTH} chars)`);
        }
        continue;
      }
      out[key] = value;
      continue;
    }
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[analytics] dropped non-string/boolean prop ${key} (${typeof value})`);
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  const plausible = window.plausible;
  if (typeof plausible !== "function") return;
  const props = sanitiseProps(event.props as Record<string, unknown> | undefined);
  plausible(event.name, props ? { props } : undefined);
}
