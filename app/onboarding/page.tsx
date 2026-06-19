import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { de } from "@/lib/i18n/messages/de";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Willkommen — Typ2-Kompass",
};

// Minimal v0 onboarding — TYP-35-6 lands new activations here so the welcome
// surface exists; richer onboarding lives in a later TYP-35 subtask.
// CLINICAL-REVIEW: welcome copy is general — no medical claim.
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }
  const t = de.auth.onboarding;
  return (
    <main className="flex min-h-screen items-center justify-center bg-kompass-mist px-4 py-12">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-kompass-accent">
          Typ2-Kompass
        </p>
        <h1 className="text-2xl font-bold text-kompass-ink">{t.heading}</h1>
        <p className="text-sm leading-relaxed text-slate-600">{t.body}</p>
        <Link
          href="/account"
          className="inline-block rounded-xl bg-kompass-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t.cta}
        </Link>
      </div>
    </main>
  );
}
