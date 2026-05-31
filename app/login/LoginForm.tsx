"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { startMagicLink, type LoginActionState } from "./actions";
import { de } from "@/lib/i18n/messages/de";

const initialState: LoginActionState = {};
const t = de.auth.login;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-kompass-accent px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-kompass-accentDark disabled:opacity-60"
    >
      {pending ? t.submitting : t.submit}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(startMagicLink, initialState);

  const errorMsg =
    state.error === "invalid_email"
      ? t.errorInvalid
      : state.error === "consent_missing"
        ? t.consentMissing
        : state.error === "generic"
          ? t.errorGeneric
          : null;

  return (
    <form action={formAction} className="space-y-5" noValidate>
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

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-600">
        <input
          type="checkbox"
          name="consent"
          className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-slate-300 text-kompass-accent focus:ring-kompass-accent"
        />
        <span>{t.consentLabel}</span>
      </label>

      {errorMsg && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {errorMsg}
        </p>
      )}

      <SubmitButton />

      <p className="pt-2 text-xs leading-relaxed text-slate-400">
        {t.privacyNote}
      </p>
    </form>
  );
}
