import type { Event } from "@sentry/nextjs";

// Hard scrubber applied to every event before send. The no-PII rule is
// non-negotiable: we strip cookies, auth headers, identifiers, anything
// that looks like a health field, and any query string value whose key
// hints at a token. Errors are operational telemetry — we want the stack
// trace, not the user.

const FIELD_KEY_PATTERN =
  /email|name|geburts|address|adresse|reflection|reflexion|note|notiz|diary|hba1c|glucose|insulin|weight|gewicht/i;
const SECRET_PARAM_PATTERN = /token|key|secret|email|auth/i;

function scrubObject(obj: Record<string, unknown> | undefined): void {
  if (!obj) return;
  for (const key of Object.keys(obj)) {
    if (FIELD_KEY_PATTERN.test(key)) {
      obj[key] = "[Filtered]";
    }
  }
}

function scrubQueryString(qs: string | undefined): string | undefined {
  if (!qs) return qs;
  try {
    const params = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
    let dirty = false;
    for (const [k] of params) {
      if (SECRET_PARAM_PATTERN.test(k)) {
        params.set(k, "[Filtered]");
        dirty = true;
      }
    }
    return dirty ? (qs.startsWith("?") ? "?" : "") + params.toString() : qs;
  } catch {
    return qs;
  }
}

export function scrubEvent<E extends Event>(event: E): E {
  if (event.user) {
    event.user = undefined;
  }
  if (event.request) {
    if (event.request.cookies) event.request.cookies = {};
    if (event.request.headers) {
      const h = event.request.headers as Record<string, unknown>;
      if ("authorization" in h) h.authorization = "[Filtered]";
      if ("cookie" in h) h.cookie = "[Filtered]";
    }
    if (typeof event.request.query_string === "string") {
      event.request.query_string = scrubQueryString(event.request.query_string);
    }
  }
  scrubObject(event.extra);
  scrubObject(event.tags as Record<string, unknown> | undefined);
  if (event.contexts) {
    for (const ctx of Object.values(event.contexts)) {
      if (ctx && typeof ctx === "object") {
        scrubObject(ctx as Record<string, unknown>);
      }
    }
  }
  return event;
}
