"use client";

import { useState, useTransition } from "react";
import { de } from "@/lib/i18n/messages/de";

const t = de.auth.resend;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "success" | "error_invalid" | "error_rate_minute" | "error_rate_day" | "error_generic";

export default function ResendForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();

  const errorMsg =
    status === "error_invalid"
      ? t.errorInvalid
      : status === "error_rate_minute"
        ? t.errorRateLimitMinute
        : status === "error_rate_day"
          ? t.errorRateLimitDay
          : status === "error_generic"
            ? t.errorGeneric
            : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (
      (e.currentTarget.elements.namedItem("email") as HTMLInputElement)?.value ?? ""
    )
      .trim()
      .toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      setStatus("error_invalid");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/resend-activation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.status === 429) {
          const body = (await res.json().catch(() => ({}))) as { scope?: string };
          setStatus(body.scope === "day" ? "error_rate_day" : "error_rate_minute");
          return;
        }
        if (!res.ok) {
          setStatus("error_generic");
          return;
        }
        setStatus("success");
      } catch {
        setStatus("error_generic");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="space-y-4">
        <p className="text-base font-semibold text-kompass-accent">
          {t.successHeading}
        </p>
        <p className="text-sm leading-relaxed text-slate-600">{t.successBody}</p>
        <a
          href="/login"
          className="inline-block rounded-xl bg-kompass-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t.backToLogin}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {t.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={t.emailPlaceholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none ring-kompass-accent/30 placeholder:text-slate-400 focus:border-kompass-accent focus:ring-4"
        />
      </div>

      {errorMsg && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-kompass-accent px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-kompass-accentDark disabled:opacity-60"
      >
        {isPending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
