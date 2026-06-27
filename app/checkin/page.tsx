import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAppEnv } from "@/lib/env";
import { promptForDate } from "@/lib/checkin/prompts";
import CheckinForm from "./CheckinForm";

export const runtime = "edge";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function CheckinPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = todayISO();
  const prompt = promptForDate(today);

  const env = await getAppEnv();
  let existing: { mood: number; note: string | null } | null = null;

  if (env.DB) {
    const row = await env.DB.prepare(
      "SELECT mood, note FROM checkin WHERE userId = ? AND checkinDate = ?",
    )
      .bind(session.user.id, today)
      .first<{ mood: number; note: string | null } | null>();
    existing = row ?? null;
  }

  const dateLabel = new Date(today + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="border-b border-slate-100 bg-white px-4 py-3 flex items-center justify-between">
        <a href="/" className="text-sm font-semibold text-teal-700">
          Typ2-Kompass
        </a>
        <a href="/account" className="text-sm text-slate-500 hover:underline">
          Konto
        </a>
      </nav>

      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
          Täglicher Check-in
        </p>
        <h1 className="text-xl font-bold text-slate-800 mb-6">{dateLabel}</h1>

        <CheckinForm
          todayIso={today}
          promptText={prompt.text}
          promptKey={prompt.key}
          existing={existing}
        />

        <div className="mt-6 text-center">
          <a href="/checkin/history" className="text-sm text-teal-600 hover:underline">
            7-Tage-Verlauf ansehen →
          </a>
        </div>
      </div>
    </main>
  );
}
