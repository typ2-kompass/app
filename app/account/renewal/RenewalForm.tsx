"use client";

import { useState } from "react";

export default function RenewalForm() {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/renewal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError("Zahlung konnte nicht gestartet werden. Bitte versuche es erneut.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Es ist ein Fehler aufgetreten. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:border-slate-300">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-kompass-accent"
        />
        <span className="text-sm text-slate-700">
          Ich möchte meinen Update-Zeitraum für <strong>19 EUR</strong> um 12 Monate verlängern.
          Ich bestätige, dass dies eine einmalige Zahlung ohne Abo ist.
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!confirmed || loading}
        className="w-full rounded-xl bg-kompass-ink px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Weiterleitung zu Stripe…" : "Jetzt für 19 EUR verlängern"}
      </button>
    </form>
  );
}
