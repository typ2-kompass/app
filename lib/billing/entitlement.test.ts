import { describe, it, expect } from "vitest";
import { classify, formatGermanDate } from "./entitlement";

const NOW = new Date("2026-06-26T12:00:00.000Z");
const PAST = "2026-06-19T12:00:00.000Z";
const FUTURE = "2026-07-03T12:00:00.000Z";
const SOONER_FUTURE = "2026-06-30T12:00:00.000Z";

describe("classify (entitlement status)", () => {
  it("returns 'none' when there are no rows", () => {
    expect(classify([], NOW)).toEqual({ status: "none", revokedAt: null });
  });

  it("returns 'active' when any row has no revokedAt", () => {
    expect(
      classify([{ revokedAt: null }, { revokedAt: PAST }], NOW),
    ).toEqual({ status: "active", revokedAt: null });
  });

  it("returns 'grace' with the latest future cutoff", () => {
    const out = classify(
      [{ revokedAt: SOONER_FUTURE }, { revokedAt: FUTURE }],
      NOW,
    );
    expect(out.status).toBe("grace");
    expect(out.revokedAt).toBe(FUTURE);
  });

  it("prefers 'active' over 'grace' if a non-revoked entitlement exists", () => {
    expect(
      classify(
        [{ revokedAt: SOONER_FUTURE }, { revokedAt: null }],
        NOW,
      ),
    ).toEqual({ status: "active", revokedAt: null });
  });

  it("returns 'expired' when all cutoffs are in the past", () => {
    const out = classify([{ revokedAt: PAST }], NOW);
    expect(out.status).toBe("expired");
    expect(out.revokedAt).toBe(PAST);
  });

  it("treats unparseable timestamps as if absent", () => {
    expect(classify([{ revokedAt: "not-a-date" }], NOW)).toEqual({
      status: "none",
      revokedAt: null,
    });
  });

  it("treats revokedAt exactly equal to now as expired (not grace)", () => {
    const out = classify([{ revokedAt: NOW.toISOString() }], NOW);
    expect(out.status).toBe("expired");
  });
});

describe("formatGermanDate", () => {
  it("renders an ISO timestamp as DD.MM.YYYY", () => {
    expect(formatGermanDate("2026-07-03T12:00:00.000Z")).toBe("03.07.2026");
  });

  it("zero-pads day and month", () => {
    expect(formatGermanDate("2026-01-05T00:00:00.000Z")).toBe("05.01.2026");
  });

  it("returns the original input on a parse failure", () => {
    expect(formatGermanDate("not-a-date")).toBe("not-a-date");
  });
});
