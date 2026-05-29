export const de = {
  meta: {
    title: "Typ2-Kompass — Dein Begleiter bei Typ-2-Diabetes",
    description:
      "Typ2-Kompass hilft Menschen mit Typ-2-Diabetes, ihre Erkrankung durch Wissen, Reflexion und nachhaltige Gewohnheiten selbst in die Hand zu nehmen.",
  },
  hero: {
    eyebrow: "Typ2-Kompass",
    headline: "Hallo, Typ2-Kompass.",
    mission:
      "Typ2-Kompass begleitet Menschen mit Typ-2-Diabetes auf dem Weg zu mehr Selbstverantwortung. Mit verständlichen Inhalten, kurzen Reflexionsimpulsen und digitalen Werkzeugen helfen wir dir, deine Erkrankung Schritt für Schritt besser zu verstehen, neue Routinen aufzubauen und langfristig gesünder zu leben — in deinem Tempo und an deiner Seite.",
    disclaimer:
      "Hinweis: Typ2-Kompass ersetzt keine ärztliche Beratung. Wir bieten Bildung und Reflexion, keine medizinische Diagnose oder Therapie.",
  },
  emailCapture: {
    title: "Bleib auf dem Laufenden",
    subtitle:
      "Trag dich ein, um zu erfahren, sobald die ersten Inhalte und Werkzeuge verfügbar sind. Keine Werbung, kein Spam, jederzeit abbestellbar.",
    emailLabel: "E-Mail-Adresse",
    emailPlaceholder: "name@beispiel.de",
    submit: "Benachrichtigt mich",
    submitting: "Wird gesendet…",
    success: "Danke! Wir melden uns, sobald es losgeht.",
    errorGeneric: "Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.",
    errorInvalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
    privacy:
      "Mit dem Absenden willigst du in die Speicherung deiner E-Mail-Adresse zum Zweck der Vorab-Information ein. Du kannst dich jederzeit abmelden.",
  },
  footer: {
    rights: "© {year} Typ2-Kompass. Alle Rechte vorbehalten.",
    imprint: "Impressum",
    privacy: "Datenschutz",
  },
} as const;

export type Messages = typeof de;
