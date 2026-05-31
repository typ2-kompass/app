import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { de } from "@/lib/i18n/messages/de";
import LoginForm from "./LoginForm";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Anmelden — Typ2-Kompass",
  description: "Anmeldung bei Typ2-Kompass per E-Mail-Link.",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/account");
  }

  const t = de.auth.login;

  return (
    <main className="flex min-h-screen items-center justify-center bg-kompass-mist px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-kompass-accent">
          Typ2-Kompass
        </p>
        <h1 className="mb-2 text-2xl font-bold text-kompass-ink">{t.heading}</h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">
          {t.subheading}
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
