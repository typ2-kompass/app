import type { Metadata } from "next";
import Link from "next/link";
import { de } from "@/lib/i18n/messages/de";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Anmeldelink gesendet — Typ2-Kompass",
};

export default function VerifyRequestPage() {
  const t = de.auth.verifyRequest;
  return (
    <main className="flex min-h-screen items-center justify-center bg-kompass-mist px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-kompass-accent">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-kompass-ink">{t.heading}</h1>
        <p className="mb-4 text-sm leading-relaxed text-slate-600">{t.body}</p>
        <p className="mb-6 text-xs leading-relaxed text-slate-400">{t.hint}</p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-kompass-accent hover:underline"
        >
          {t.backToLogin}
        </Link>
      </div>
    </main>
  );
}
