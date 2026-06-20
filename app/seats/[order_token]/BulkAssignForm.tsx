"use client";

// Bulk-assign form: textarea with one "code:email" pair per line.
// Lines with no code placeholder are matched to pending codes in order.

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { bulkAssign, type BulkAssignResult } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-kompass-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-kompass-accentDark disabled:opacity-60"
    >
      {pending ? "Wird verarbeitet…" : "Alle versenden"}
    </button>
  );
}

export default function BulkAssignForm({
  orderToken,
  pendingCodes,
}: {
  orderToken: string;
  pendingCodes: string[];
}) {
  const [result, setResult] = useState<BulkAssignResult | null>(null);
  const [loading, setLoading] = useState(false);

  if (pendingCodes.length === 0) return null;

  const placeholder = pendingCodes
    .slice(0, 3)
    .map((c) => `${c}:mitarbeiter@firma.de`)
    .join("\n");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = (fd.get("emails") as string ?? "").trim();
    if (!raw) return;

    const pairs: { code: string; email: string }[] = [];
    for (const line of raw.split(/\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx < 0) continue;
      const code = trimmed.slice(0, colonIdx).trim();
      const email = trimmed.slice(colonIdx + 1).trim();
      if (code && email) pairs.push({ code, email });
    }

    if (pairs.length === 0) return;
    setLoading(true);
    const res = await bulkAssign(orderToken, pairs);
    setResult(res);
    setLoading(false);
  }

  if (result) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="font-semibold text-slate-800">
          {result.sent} Aktivierungs-Mail{result.sent !== 1 ? "s" : ""} gesendet.
        </p>
        {result.errors.length > 0 && (
          <ul className="mt-2 space-y-1">
            {result.errors.map((e, i) => (
              <li key={i} className="text-sm text-rose-600">
                {e}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-1 text-base font-semibold text-slate-800">
        Alle Zugänge auf einmal versenden
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Trage je eine Zeile im Format <code className="rounded bg-slate-100 px-1">CODE:email@firma.de</code> ein.
      </p>
      <textarea
        name="emails"
        rows={Math.min(pendingCodes.length + 1, 8)}
        required
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-kompass-accent focus:ring-2 focus:ring-kompass-accent/20"
      />
      <div className="mt-3">
        <SubmitButton />
        {loading && (
          <span className="ml-3 text-sm text-slate-500">Bitte warten…</span>
        )}
      </div>
    </form>
  );
}
