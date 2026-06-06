import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { de } from "@/lib/i18n/messages/de";
import SignOutButton from "./SignOutButton";
import { ExportButton, DeleteAccountFlow } from "./GdprActions";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Konto — Typ2-Kompass",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const t = de.auth.account;
  const email = session.user.email;

  return (
    <main className="flex min-h-screen items-center justify-center bg-kompass-mist px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-kompass-accent">
            Typ2-Kompass
          </p>
          <h1 className="text-2xl font-bold text-kompass-ink">{t.heading}</h1>
        </div>

        <div className="rounded-xl bg-kompass-mist px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t.emailLabel}
          </p>
          <p className="mt-1 break-all text-base font-medium text-slate-800">
            {email}
          </p>
        </div>

        <SignOutButton />

        <p className="text-xs leading-relaxed text-slate-400">{t.privacyNote}</p>

        {/* DSGVO Art. 15 — Datenauskunft */}
        <div className="border-t border-slate-100 pt-5">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            {t.exportHeading}
          </h2>
          <p className="mb-3 text-xs leading-relaxed text-slate-500">
            {t.exportBody}
          </p>
          <ExportButton />
        </div>

        {/* DSGVO Art. 17 — Recht auf Löschung */}
        <div className="border-t border-slate-100 pt-5">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            {t.deleteHeading}
          </h2>
          <p className="mb-3 text-xs leading-relaxed text-slate-500">
            {t.deleteBody}
          </p>
          <DeleteAccountFlow email={email} />
        </div>

        <div className="border-t border-slate-100 pt-4 text-center">
          <Link href="/datenschutz" className="text-xs text-slate-400 hover:underline">
            {de.footer.privacy}
          </Link>
        </div>
      </div>
    </main>
  );
}
