// Entitlement status resolver — TYP-54 / TYP-35 subtask 10.
//
// A user can be in one of three states with respect to a given order:
//   - active:  entitlement exists, revokedAt is null → full access.
//   - grace:   entitlement exists, revokedAt is set but still in the future →
//              show "your access ends on <date>" banner, content stays open.
//   - expired: entitlement exists, revokedAt is in the past → block module
//              content with an explanatory page.
//   - none:    no entitlement row for this user.
//
// Refund logic in app/api/billing/webhook/route.ts sets revokedAt = now+7d
// when a charge is refunded. This file is the read-side counterpart used by
// server components to gate UI.

import type { D1Database } from "@cloudflare/workers-types";

export type EntitlementStatus = "active" | "grace" | "expired" | "none";

export interface EntitlementInfo {
  status: EntitlementStatus;
  // ISO timestamp when access ends; null when status is "active" or "none".
  revokedAt: string | null;
}

export interface ResolveOptions {
  // Override "now" for tests so we can exercise the grace/expired boundary.
  now?: Date;
}

type Row = { revokedAt: string | null };

// Returns the "strongest" entitlement for the user: an active one wins over a
// grace-period one, which wins over an expired one. A user might own multiple
// orders; only one needs to be live for them to keep access.
export async function resolveEntitlement(
  db: D1Database,
  userId: string,
  options: ResolveOptions = {},
): Promise<EntitlementInfo> {
  const now = options.now ?? new Date();

  const rows = await db
    .prepare(`SELECT revokedAt FROM entitlements WHERE userId = ?`)
    .bind(userId)
    .all<Row>();

  const list = rows.results ?? [];
  if (list.length === 0) {
    return { status: "none", revokedAt: null };
  }

  return classify(list, now);
}

export function classify(
  rows: ReadonlyArray<Row>,
  now: Date,
): EntitlementInfo {
  if (rows.length === 0) {
    return { status: "none", revokedAt: null };
  }

  let bestGraceUntil: number | null = null;
  let mostRecentExpired: number | null = null;

  for (const row of rows) {
    if (row.revokedAt == null) {
      return { status: "active", revokedAt: null };
    }
    const ts = Date.parse(row.revokedAt);
    if (!Number.isFinite(ts)) continue;
    if (ts > now.getTime()) {
      if (bestGraceUntil == null || ts > bestGraceUntil) {
        bestGraceUntil = ts;
      }
    } else if (mostRecentExpired == null || ts > mostRecentExpired) {
      mostRecentExpired = ts;
    }
  }

  if (bestGraceUntil != null) {
    return {
      status: "grace",
      revokedAt: new Date(bestGraceUntil).toISOString(),
    };
  }
  if (mostRecentExpired != null) {
    return {
      status: "expired",
      revokedAt: new Date(mostRecentExpired).toISOString(),
    };
  }
  return { status: "none", revokedAt: null };
}

// Formats an ISO timestamp as a German date string ("01.07.2026"). Used by
// the refund banner so the "Dein Zugang endet am <Datum>" copy reads
// naturally.
export function formatGermanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}
