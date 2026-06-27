import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAppEnv } from "@/lib/env";
import { getUserActivatedAt } from "@/lib/updates/changelog";
import RenewalForm from "./RenewalForm";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Updates verlängern — Typ2-Kompass",
};

export default async function RenewalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const env = await getAppEnv();
  if (!env.DB) return <main className="p-8 text-slate-600">Datenbank nicht verfügbar.</main>;

  const activatedAt = await getUserActivatedAt(env.DB, session.user.id);
  if (!activatedAt) redirect("/account");

  const expiryDate = new Date(new Date(activatedAt).getTime() + 365 * 24 * 60 * 60 * 1000);
  const expiryFormatted = expiryDate.toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Link href="/account" className="mb-6 inline-block text-sm text-slate-500 hover:underline">
        ← Konto
      </Link>
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-kompass-accent">
          Updates
        </p>
        <h1 className="mb-4 text-2xl font-bold text-kompass-ink">Update-Zeitraum verlängern</h1>

        <div className="mb-6 rounded-xl bg-kompass-mist px-5 py-4 text-sm text-slate-700">
          <p className="mb-1 font-semibold">Was du bekommst</p>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li>✓ 12 weitere Monate Zugang zu allen Updates</li>
            <li>✓ Monatlicher Update-Bericht per E-Mail (optional)</li>
            <li>✓ Kein Abo, keine automatische Verlängerung</li>
          </ul>
        </div>

        <p className="mb-6 text-sm text-slate-500">
          Dein aktueller Update-Zeitraum endet am{" "}
          <span className="font-semibold text-slate-700">{expiryFormatted}</span>.
        </p>

        <RenewalForm />

        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          Einmalige Zahlung von 19 EUR (inkl. MwSt.). Kein Abo, keine automatische Verlängerung.
          Bezahlung über Stripe — sicher und verschlüsselt.
        </p>
      </div>
    </main>
  );
}
