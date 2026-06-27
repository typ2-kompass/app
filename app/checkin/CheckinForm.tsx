"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/track";

interface Props {
  todayIso: string;
  promptText: string;
  promptKey: string;
  existing?: { mood: number; note: string | null } | null;
}

const MOODS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: "😞", label: "Nicht gut" },
  { value: 2, emoji: "😕", label: "Eher schwierig" },
  { value: 3, emoji: "😐", label: "So la la" },
  { value: 4, emoji: "🙂", label: "Ganz gut" },
  { value: 5, emoji: "😄", label: "Sehr gut" },
];

export default function CheckinForm({ todayIso, promptText, promptKey, existing }: Props) {
  const router = useRouter();
  const [mood, setMood] = useState<number | null>(existing?.mood ?? null);
  const [note, setNote] = useState(existing?.note ?? "");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood) return;
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, note: note.trim() || null, checkinDate: todayIso }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if ((data as { loginRequired?: boolean }).loginRequired) {
          router.push("/login");
          return;
        }
        throw new Error("server_error");
      }
      track({
        name: "checkin_submitted",
        props: {
          mood,
          prompt_key: promptKey,
          has_note: note.trim().length > 0,
          weekday: new Date(todayIso).getDay() || 7,
        },
      });
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("Speichern hat nicht geklappt. Bitte versuche es gleich noch einmal.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-800 mb-1">Gespeichert!</p>
        <p className="text-sm text-green-700 mb-4">
          Dein heutiger Check-in wurde gespeichert.
        </p>
        <a
          href="/checkin/history"
          className="text-sm text-green-700 underline"
        >
          Zur 7-Tage-Übersicht →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {existing && (
        <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
          Du hast heute schon eingecheckt. Du kannst deinen Eintrag aktualisieren.
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700 mb-3">
          Wie geht es dir heute?
        </legend>
        <div className="flex justify-between gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-label={m.label}
              aria-pressed={mood === m.value}
              onClick={() => setMood(m.value)}
              className={[
                "flex-1 flex flex-col items-center gap-1 rounded-xl py-3 text-2xl transition-all",
                "border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
                mood === m.value
                  ? "border-teal-500 bg-teal-50 shadow-sm scale-105"
                  : "border-slate-200 bg-white hover:border-teal-300",
              ].join(" ")}
            >
              {m.emoji}
              <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="text-base font-semibold text-slate-800 mb-3">{promptText}</p>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={4}
          placeholder="Notiz (optional)"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none resize-none"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{note.length}/500</p>
      </div>

      {errorMsg && (
        <p role="alert" className="text-sm text-red-600">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={!mood || status === "submitting"}
        className="w-full rounded-xl bg-teal-600 text-white font-semibold py-3 px-4 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {status === "submitting" ? "Wird gespeichert…" : "Speichern"}
      </button>

      <p className="text-xs text-slate-400 text-center">
        Deine Notiz wird ausschließlich in deinem Konto gespeichert und nicht weitergegeben.
      </p>
    </form>
  );
}
