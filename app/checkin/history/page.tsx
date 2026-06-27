import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAppEnv } from "@/lib/env";

export const runtime = "edge";

interface CheckinRow {
  checkinDate: string;
  mood: number;
  promptText: string;
  note: string | null;
  updatedAt: string;
}

const MOOD_EMOJI: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

const MOOD_COLOR: Record<number, string> = {
  1: "bg-red-400",
  2: "bg-orange-400",
  3: "bg-yellow-400",
  4: "bg-lime-400",
  5: "bg-teal-400",
};

function formatDate(isoDate: string) {
  return new Date(isoDate + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Build a 7-slot grid (today and 6 days back) and join with DB rows.
function buildGrid(rows: CheckinRow[], today: string) {
  const slots: { date: string; row: CheckinRow | null }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today + "T12:00:00");
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    slots.push({ date: iso, row: rows.find((r) => r.checkinDate === iso) ?? null });
  }
  return slots;
}

export default async function CheckinHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = new Date().toISOString().slice(0, 10);
  const env = await getAppEnv();

  let rows: CheckinRow[] = [];
  if (env.DB) {
    const result = await env.DB.prepare(
      `SELECT checkinDate, mood, promptText, note, updatedAt
       FROM checkin
       WHERE userId = ?
       ORDER BY checkinDate DESC
       LIMIT 7`,
    )
      .bind(session.user.id)
      .all<CheckinRow>();
    rows = result.results ?? [];
  }

  const grid = buildGrid(rows, today);
  const hasAny = rows.length > 0;

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-800">Deine letzten 7 Tage</h1>
          <a href="/checkin" className="text-sm text-teal-600 hover:underline">
            Heute einchecken →
          </a>
        </div>

        {/* Mood trend strip */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Stimmungsverlauf</p>
          <div className="flex gap-2 items-end h-14">
            {grid.map(({ date, row }) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={[
                    "w-full rounded-md transition-all",
                    row
                      ? `${MOOD_COLOR[row.mood]} opacity-90`
                      : "bg-slate-100",
                  ].join(" ")}
                  style={{ height: row ? `${(row.mood / 5) * 48 + 8}px` : "8px" }}
                  title={row ? `${formatDate(date)}: ${MOOD_EMOJI[row.mood]}` : formatDate(date)}
                />
                <span className="text-[9px] text-slate-400">
                  {new Date(date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Entry list */}
        {!hasAny && (
          <p className="text-center text-slate-400 text-sm py-8">
            Noch keine Check-ins vorhanden.{" "}
            <a href="/checkin" className="text-teal-600 underline">
              Jetzt starten →
            </a>
          </p>
        )}

        <div className="space-y-3">
          {grid.map(({ date, row }) => (
            <div
              key={date}
              className={[
                "rounded-xl border p-4",
                row ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100",
              ].join(" ")}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-700">{formatDate(date)}</span>
                {row ? (
                  <span className="text-xl">{MOOD_EMOJI[row.mood]}</span>
                ) : (
                  <span className="text-xs text-slate-300">Kein Eintrag</span>
                )}
              </div>
              {row && (
                <>
                  <p className="text-sm text-slate-600 italic mb-1">„{row.promptText}"</p>
                  {row.note && (
                    <p className="text-sm text-slate-500 line-clamp-2">{row.note}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
