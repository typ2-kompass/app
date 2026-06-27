import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAppEnv } from "@/lib/env";
import { resolveEntitlement } from "@/lib/billing/entitlement";
import { getChangelogForUser, getUserActivatedAt } from "@/lib/updates/changelog";
import UpdateExpiryBanner from "@/components/UpdateExpiryBanner";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Was ist neu? — Typ2-Kompass",
};

export default async function UpdatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const env = await getAppEnv();

  if (!env.DB) {
    return <main className="p-8 text-slate-600">Datenbank nicht verfügbar.</main>;
  }

  const ent = await resolveEntitlement(env.DB, userId);
  if (ent.status === "none") redirect("/login");

  const activatedAt = await getUserActivatedAt(env.DB, userId);
  if (!activatedAt) redirect("/login");

  const entries = await getChangelogForUser(env.DB, activatedAt);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <Link href="/account" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
          ← Konto
        </Link>
        <h1 className="text-2xl font-bold text-kompass-ink">Was ist neu?</h1>
        <p className="mt-2 text-sm text-slate-500">
          Alle Updates seit deinem Kauf am{" "}
          <time dateTime={activatedAt}>
            {new Date(activatedAt).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </time>
          .
        </p>
      </div>

      <UpdateExpiryBanner activatedAt={activatedAt} />

      {entries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
          Noch keine Updates seit deinem Kauf — wir halten dich auf dem Laufenden.
        </div>
      ) : (
        <ol className="mt-8 space-y-6">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-slate-100 bg-white px-6 py-5 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-3">
                <time
                  dateTime={entry.date}
                  className="text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  {new Date(entry.date).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    entry.is_new
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {entry.is_new ? "Neu" : "Aktualisiert"}
                </span>
              </div>

              <h2 className="mb-2 text-base font-semibold text-kompass-ink">{entry.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600">{entry.body}</p>

              {entry.content_link && (
                <Link
                  href={entry.content_link}
                  className="mt-3 inline-block text-sm font-medium text-kompass-accent hover:underline"
                >
                  Zum aktualisierten Inhalt →
                </Link>
              )}

              <div className="mt-4 border-t border-slate-50 pt-3 text-xs text-slate-400">
                Fachlich geprüft von {entry.reviewed_by} am{" "}
                {new Date(entry.reviewed_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
