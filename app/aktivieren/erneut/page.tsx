import type { Metadata } from "next";
import { de } from "@/lib/i18n/messages/de";
import ResendForm from "./ResendForm";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Aktivierungs-E-Mail erneut senden — Typ2-Kompass",
  robots: "noindex",
};

const t = de.auth.resend;

export default function ResendActivationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-kompass-mist px-4 py-12">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-kompass-accent">
          Typ2-Kompass
        </p>
        <h1 className="text-2xl font-bold text-kompass-ink">{t.heading}</h1>
        <p className="text-sm leading-relaxed text-slate-500">{t.subheading}</p>
        <ResendForm />
      </div>
    </main>
  );
}
