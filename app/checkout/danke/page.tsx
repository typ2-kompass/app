// Stripe success-URL landing page — TYP-36 / TYP-88.
//
// Stripe redirects buyers here after a successful Checkout Session
// (`https://app.typ2-kompass.de/checkout/danke?session_id={CHECKOUT_SESSION_ID}`).
// The activation email is generated server-side by the webhook handler — this
// page only confirms receipt and sets expectations about the email.
//
// We deliberately do NOT look up the session here: the webhook is authoritative
// (it fires `checkout_completed` to Plausible and mints activation codes).
// This page is purely UX confirmation so the buyer doesn't sit on a 404 while
// the email is in flight.

import type { Metadata } from "next";
import Link from "next/link";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Danke für Ihren Kauf — Typ2-Kompass",
  // Keep search engines out; this URL only makes sense with a valid Stripe
  // session id and we don't want it indexed.
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-kompass-mist px-4 py-12">
      <div className="w-full max-w-xl space-y-5 rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-kompass-accent">
          Typ2-Kompass
        </p>
        <h1 className="text-2xl font-bold text-kompass-ink">
          Danke für Ihren Kauf.
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Wir haben Ihre Zahlung erhalten. In den nächsten Minuten erhalten Sie
          eine E-Mail mit Ihrem persönlichen Aktivierungs-Link. Bitte prüfen Sie
          auch Ihren Spam-Ordner.
        </p>
        <p className="text-sm leading-relaxed text-slate-600">
          Mit einem Klick auf den Link in der E-Mail richten wir Ihren Zugang
          ein — kein Passwort, keine weitere Anmeldung nötig.
        </p>
        <div className="rounded-xl bg-kompass-mist px-4 py-3 text-sm text-slate-700">
          <strong className="font-semibold">Keine E-Mail nach 15 Minuten?</strong>{" "}
          Lassen Sie sich Ihren Aktivierungs-Link erneut zusenden.
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/aktivieren/erneut"
            className="inline-block rounded-xl bg-kompass-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            E-Mail erneut anfordern
          </Link>
          <a
            href="mailto:hallo@typ2-kompass.de"
            className="inline-block rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            Support kontaktieren
          </a>
        </div>
      </div>
    </main>
  );
}
