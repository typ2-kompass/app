// Aggregate-only event contract. No PII, no per-user trails.
// Property values are constrained to short strings or booleans; the runtime
// guard in `track.ts` enforces the same rule for non-TS callers.

export type SignupSource = "landing" | "module_gate" | "footer";
export type SignupMethod = "email";
export type DurationBucket = "lt_5min" | "5_15min" | "15_30min" | "gt_30min";

export type AnalyticsEvent =
  | { name: "page_viewed"; props?: { path?: string; referrer?: string; locale?: string } }
  | { name: "signup_started"; props: { source: SignupSource } }
  | { name: "signup_completed"; props: { method: SignupMethod } }
  | { name: "module_opened"; props: { module_slug: string } }
  | {
      name: "module_completed";
      props: { module_slug: string; duration_bucket: DurationBucket };
    }
  | { name: "reflection_submitted"; props: { module_slug: string; prompt_slug: string } };

export type AnalyticsEventName = AnalyticsEvent["name"];

export function bucketDurationMs(ms: number): DurationBucket {
  if (ms < 5 * 60 * 1000) return "lt_5min";
  if (ms < 15 * 60 * 1000) return "5_15min";
  if (ms < 30 * 60 * 1000) return "15_30min";
  return "gt_30min";
}
