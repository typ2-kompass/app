import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — Typ2-Kompass",
};

// LEGAL-REVIEW: This stub satisfies DSGVO Art. 13 for MVP. Replace with a
// full Datenschutzerklärung before public launch; review with a lawyer.
export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-kompass-accent">
        Typ2-Kompass
      </p>
      <h1 className="mb-8 text-3xl font-bold text-kompass-ink">
        Datenschutzerklärung
      </h1>

      <div className="prose prose-slate max-w-none text-sm leading-relaxed">
        <section className="mb-8">
          <h2 className="mb-2 text-base font-semibold text-kompass-ink">
            Verantwortliche Stelle
          </h2>
          <p className="text-slate-600">
            Typ2-Kompass (Einzelunternehmen) · Kontaktadresse auf Anfrage per
            E-Mail an{" "}
            <a
              href="mailto:kontakt@typ2-kompass.de"
              className="text-kompass-accent underline"
            >
              kontakt@typ2-kompass.de
            </a>
            .
          </p>
        </section>

        <section className="mb-8 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <h2 className="mb-2 text-base font-semibold text-emerald-800">
            Keine Gesundheitsdaten
          </h2>
          <p className="text-emerald-700">
            Diese Anwendung verarbeitet{" "}
            <strong>keine Gesundheitsdaten</strong> im Sinne von Art.&thinsp;9
            DSGVO (keine Sonderkategorien personenbezogener Daten). Es werden
            ausschließlich gespeichert:
          </p>
          <ul className="mt-2 list-disc pl-5 text-emerald-700">
            <li>E-Mail-Adresse (für die passwortlose Anmeldung)</li>
            <li>
              Zeitstempel der Einwilligung (DSGVO-Pflicht, Art.&thinsp;7)
            </li>
            <li>
              Welche Lern-Module du abgeschlossen hast (IDs, kein Freitext)
            </li>
          </ul>
          <p className="mt-2 text-emerald-700">
            Persönliche Angaben wie Name, Diagnose, Laborwerte oder
            Medikamente werden nicht abgefragt und nicht gespeichert.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-base font-semibold text-kompass-ink">
            Zweck der Verarbeitung
          </h2>
          <p className="text-slate-600">
            Deine E-Mail-Adresse dient ausschließlich der Anmeldung (DSGVO
            Art.&thinsp;6 Abs.&thinsp;1 lit.&thinsp;b). Der Modul-Fortschritt
            wird gespeichert, damit du beim nächsten Besuch dort
            weitermachen kannst, wo du aufgehört hast.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-base font-semibold text-kompass-ink">
            Deine Rechte (DSGVO Art.&thinsp;15 + 17)
          </h2>
          <p className="text-slate-600">
            Du hast das Recht, eine Kopie deiner Daten abzurufen und dein
            Konto vollständig zu löschen. Beides ist direkt in deinem{" "}
            <Link
              href="/account"
              className="text-kompass-accent underline"
            >
              Konto
            </Link>{" "}
            möglich — ohne E-Mail an uns.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-base font-semibold text-kompass-ink">
            Dienste Dritter
          </h2>
          <ul className="list-disc pl-5 text-slate-600">
            <li>
              <strong>Resend</strong> (eu-west-1): Versand des Anmeldelinks.
              Datenschutzerklärung: resend.com/legal/privacy-policy
            </li>
            <li>
              <strong>Cloudflare Pages + D1</strong>: Hosting und Datenbank
              in der EU. Datenschutzerklärung: cloudflare.com/privacypolicy
            </li>
            <li>
              <strong>Plausible Analytics</strong>: Datenschutzfreundliche
              Nutzungsstatistiken, kein Tracking-Cookie, keine personenbezogenen
              Daten. Datenschutzerklärung: plausible.io/privacy
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-base font-semibold text-kompass-ink">
            Kontakt
          </h2>
          <p className="text-slate-600">
            Bei Fragen oder Auskunftsersuchen wende dich an{" "}
            <a
              href="mailto:kontakt@typ2-kompass.de"
              className="text-kompass-accent underline"
            >
              kontakt@typ2-kompass.de
            </a>
            .
          </p>
        </section>

        <p className="text-xs text-slate-400">
          Stand: Juni 2026 · Diese Erklärung wird vor dem öffentlichen Launch
          durch einen Rechtsanwalt geprüft.
        </p>
      </div>

      <div className="mt-10 border-t border-slate-100 pt-6">
        <Link
          href="/"
          className="text-xs text-kompass-accent hover:underline"
        >
          ← Zurück zur Startseite
        </Link>
      </div>
    </main>
  );
}
