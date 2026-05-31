"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { track } from "@/lib/analytics/track";
import { bucketDurationMs } from "@/lib/analytics/events";
import { de } from "@/lib/i18n/messages/de";

type State =
  | { kind: "loading" }
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "completed" }
  | { kind: "login_required" }
  | { kind: "error"; message: string };

type StatusResponse =
  | { completed: boolean }
  | { ok: false; loginRequired?: boolean };

type CompleteResponse =
  | { ok: true; completed: true }
  | { ok: false; loginRequired?: boolean; error?: string };

export default function ModuleProgress({ slug }: { slug: string }) {
  const t = de.modulePage;
  const [state, setState] = useState<State>({ kind: "loading" });
  const openedAt = useRef<number>(Date.now());
  const trackedOpen = useRef(false);

  useEffect(() => {
    let cancelled = false;
    // Fetch completion status from edge — determines whether to show the
    // button or the success state without a server-side session read on the
    // (cached) static page.
    fetch(`/api/module/${encodeURIComponent(slug)}/complete`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<StatusResponse>)
      .then((data) => {
        if (cancelled) return;
        if ("loginRequired" in data && data.loginRequired) {
          setState({ kind: "idle" });
          return;
        }
        if ("completed" in data && data.completed) {
          setState({ kind: "completed" });
          return;
        }
        setState({ kind: "idle" });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "idle" });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (trackedOpen.current) return;
    trackedOpen.current = true;
    openedAt.current = Date.now();
    track({ name: "module_opened", props: { module_slug: slug } });
  }, [slug]);

  async function handleComplete() {
    setState({ kind: "submitting" });
    try {
      const res = await fetch(`/api/module/${encodeURIComponent(slug)}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as CompleteResponse;
      if (res.status === 401 || ("loginRequired" in data && data.loginRequired)) {
        setState({ kind: "login_required" });
        return;
      }
      if (!res.ok || !("ok" in data && data.ok)) {
        setState({ kind: "error", message: t.completeErrorGeneric });
        return;
      }
      const elapsed = Date.now() - openedAt.current;
      track({
        name: "module_completed",
        props: { module_slug: slug, duration_bucket: bucketDurationMs(elapsed) },
      });
      setState({ kind: "completed" });
    } catch {
      setState({ kind: "error", message: t.completeErrorGeneric });
    }
  }

  if (state.kind === "loading") {
    return (
      <section className="mt-12 rounded-2xl border border-slate-100 bg-kompass-mist p-6">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
      </section>
    );
  }

  if (state.kind === "completed") {
    return (
      <section className="mt-12 rounded-2xl border border-teal-100 bg-teal-50 p-6">
        <p className="font-medium text-kompass-accent">{t.completeSuccess}</p>
      </section>
    );
  }

  return (
    <section className="mt-12 rounded-2xl border border-slate-100 bg-kompass-mist p-6">
      <h2 className="mb-2 text-lg font-bold text-kompass-ink">{t.completeHeading}</h2>
      <p className="mb-5 text-sm leading-relaxed text-slate-600">{t.completeIntro}</p>

      {state.kind === "login_required" && (
        <div className="mb-4 rounded-xl border border-kompass-accent/30 bg-white p-5">
          <h3 className="mb-2 text-base font-semibold text-kompass-ink">
            {t.loginRequiredHeading}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-slate-600">{t.loginRequiredBody}</p>
          <Link
            href={`/login?next=/module/${encodeURIComponent(slug)}`}
            className="inline-block rounded-xl bg-kompass-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-kompass-accentDark"
          >
            {t.loginCta}
          </Link>
        </div>
      )}

      {state.kind === "error" && (
        <p className="mb-3 text-sm text-red-600">{state.message}</p>
      )}

      {(state.kind === "idle" || state.kind === "submitting" || state.kind === "error") && (
        <button
          type="button"
          onClick={handleComplete}
          disabled={state.kind === "submitting"}
          className="rounded-xl bg-kompass-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-kompass-accentDark disabled:opacity-60"
        >
          {state.kind === "submitting" ? t.completeButtonSubmitting : t.completeButton}
        </button>
      )}
    </section>
  );
}
