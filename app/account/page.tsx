import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { de } from "@/lib/i18n/messages/de";
import SignOutButton from "./SignOutButton";

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
            {session!.user!.email}
          </p>
        </div>

        <SignOutButton />

        <p className="text-xs leading-relaxed text-slate-400">{t.privacyNote}</p>

        <div className="border-t border-slate-100 pt-5">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            {t.deleteHeading}
          </h2>
          <p className="text-xs leading-relaxed text-slate-500">{t.deleteBody}</p>
        </div>
      </div>
    </main>
  );
}
