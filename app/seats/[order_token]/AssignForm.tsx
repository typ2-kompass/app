"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { assignSeat, type AssignResult } from "./actions";

const ERROR_LABELS: Record<string, string> = {
  invalid_email: "Bitte eine gültige E-Mail-Adresse eingeben.",
  code_not_found: "Code nicht gefunden.",
  already_assigned: "Dieser Code wurde bereits vergeben oder ist nicht mehr ausstehend.",
  runtime: "Serverfehler. Bitte versuche es erneut.",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-kompass-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-kompass-accentDark disabled:opacity-60"
    >
      {pending ? "Wird gesendet…" : "Aktivierungs-Mail versenden"}
    </button>
  );
}

const initialState: AssignResult | null = null;

export default function AssignForm({
  orderToken,
  code,
}: {
  orderToken: string;
  code: string;
}) {
  const [result, formAction] = useActionState(
    async (_prev: AssignResult | null, fd: FormData) => {
      const email = fd.get("email") as string;
      return assignSeat(orderToken, code, email);
    },
    initialState,
  );

  if (result && "ok" in result && result.ok) {
    return (
      <span className="text-sm font-medium text-emerald-600">
        ✓ E-Mail gesendet
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        name="email"
        type="email"
        required
        placeholder="mitarbeiter@firma.de"
        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-kompass-accent focus:ring-2 focus:ring-kompass-accent/20"
      />
      <SubmitButton />
      {result && "error" in result && (
        <p className="w-full text-xs text-rose-600">
          {ERROR_LABELS[result.error] ?? "Unbekannter Fehler."}
        </p>
      )}
    </form>
  );
}
