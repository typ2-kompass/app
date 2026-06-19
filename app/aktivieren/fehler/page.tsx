import type { Metadata } from "next";
import Link from "next/link";
import { de } from "@/lib/i18n/messages/de";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Aktivierung — Typ2-Kompass",
};

export default async function ActivationErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const t = de.auth.activation;
  const body = reason === "ungueltig" ? t.errorAlreadyUsed : t.errorGeneric;

  return (
    <main className="flex min-h-screen items-center justify-center bg-kompass-mist px-4 py-12">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-kompass-accent">
          Typ2-Kompass
        </p>
        <h1 className="text-2xl font-bold text-kompass-ink">
          {t.errorHeading}
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">{body}</p>
        <p className="text-sm leading-relaxed text-slate-600">
          {t.fallbackBody}
        </p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-kompass-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t.loginCta}
        </Link>
      </div>
    </main>
  );
}
