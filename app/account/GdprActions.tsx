"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { de } from "@/lib/i18n/messages/de";

const t = de.auth.account;

export function ExportButton() {
  return (
    <a
      href="/api/account/export"
      download="typ2-kompass-export.json"
      className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
    >
      {t.exportButton}
    </a>
  );
}

export function DeleteAccountFlow({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data: { ok: boolean; error?: string } = await res.json();
      if (!data.ok) {
        setError(
          data.error === "confirm_mismatch"
            ? t.deleteErrorMismatch
            : t.deleteErrorGeneric,
        );
        setSubmitting(false);
        return;
      }
      // Session is gone — navigate to landing as a full reload to clear client state.
      router.push("/");
      router.refresh();
    } catch {
      setError(t.deleteErrorGeneric);
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 active:scale-95"
      >
        {t.deleteButton}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h3 className="mb-1 text-sm font-semibold text-red-800">
        {t.deleteModalHeading}
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-red-700">
        {t.deleteModalBody}
      </p>

      <label className="mb-1 block text-xs font-medium text-red-800">
        {t.deleteConfirmLabel}
      </label>
      <input
        type="email"
        autoComplete="email"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={email}
        disabled={submitting}
        className="mb-3 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-60"
      />

      {error && (
        <p className="mb-3 text-xs text-red-700">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={submitting || !confirm.trim()}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t.deleteConfirmSubmitting : t.deleteConfirmButton}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setConfirm("");
            setError(null);
          }}
          disabled={submitting}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {t.deleteCancelButton}
        </button>
      </div>
    </div>
  );
}
