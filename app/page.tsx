import EmailCaptureForm from "@/components/EmailCaptureForm";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const MODULES = [
  {
    day: "Tag 1",
    title: "Ernährung ohne Verzicht",
    body: "Wir erstellen gemeinsam deinen persönlichen Ernährungsplan — realistisch, umsetzbar, ohne Verbotslisten.",
  },
  {
    day: "Tag 7",
    title: "Bewegung, die wirkt",
    body: "Keine Fitnessmitgliedschaft nötig. Wir zeigen dir, welche Bewegung deinen Blutzucker wirklich senkt.",
  },
  {
    day: "Tag 18",
    title: "Tagesroutinen aufbauen",
    body: "Kleine, tägliche Gewohnheiten entscheiden langfristig. Wir helfen dir, sie in deinen Alltag zu integrieren.",
  },
  {
    day: "Tag 32",
    title: "Rückfälle analysieren",
    body: "Rückschritte gehören dazu. Du lernst, sie zu verstehen und gezielt gegenzusteuern.",
  },
  {
    day: "Tag 54",
    title: "Arztgespräche vorbereiten",
    body: "Du weißt, welche Fragen du stellen musst — und was dein Arzt wirklich braucht.",
  },
  {
    day: "Tag 75",
    title: "Dein 90-Tage-Abschluss",
    body: "Du hast ein System. Kein Diätplan, kein Zufallsprogramm — eine Struktur, die zu dir passt.",
  },
];

export default function HomePage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="bg-kompass-mist px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-kompass-accent">
            Typ2-Kompass
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-kompass-ink sm:text-5xl">
            Hallo, Typ2-Kompass.
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            Typ2-Kompass begleitet Menschen mit Typ-2-Diabetes auf dem Weg zu mehr
            Selbstverantwortung. Mit verständlichen Inhalten, kurzen Reflexionsimpulsen und
            digitalen Werkzeugen helfen wir dir, deine Erkrankung Schritt für Schritt besser
            zu verstehen, neue Routinen aufzubauen und langfristig gesünder zu leben — in
            deinem Tempo und an deiner Seite.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            Kein Medikamentenprogramm. Keine ärztliche Diagnose. Bildung und Reflexion, die
            Eigenverantwortung stärken.
          </p>
          <a
            href="#warteliste"
            className="mt-8 inline-block rounded-xl bg-kompass-accent px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-kompass-accentDark"
          >
            Jetzt auf die Warteliste
          </a>
        </div>
      </section>

      {/* 90-day system */}
      <section id="system" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-kompass-ink">
            Das 90-Tage-System
          </h2>
          <p className="mb-12 text-center text-slate-500">
            Struktur statt Motivation. Schritt für Schritt, Modul für Modul.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <div
                key={m.day}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <span className="mb-3 inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-kompass-accent">
                  {m.day}
                </span>
                <h3 className="mb-2 text-lg font-semibold text-kompass-ink">{m.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email capture */}
      <section id="warteliste" className="bg-kompass-mist px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-3 text-3xl font-bold text-kompass-ink">Bleib auf dem Laufenden</h2>
          <p className="mb-8 text-slate-500">
            Trag dich ein, um zu erfahren, sobald die ersten Inhalte und Werkzeuge verfügbar
            sind. Keine Werbung, kein Spam, jederzeit abbestellbar.
          </p>
          <EmailCaptureForm />
          <p className="mt-4 text-xs text-slate-400">
            Mit dem Absenden willigst du in die Speicherung deiner E-Mail-Adresse zum Zweck
            der Vorab-Information ein. Du kannst dich jederzeit abmelden.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
