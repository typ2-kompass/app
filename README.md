# Typ2-Kompass

Next.js (TypeScript) + Tailwind CSS — offizielle Webpräsenz für [typ2-kompass.de](https://typ2-kompass.de).

---

## Lokal ausführen

**Voraussetzungen:** Node.js ≥ 20, npm ≥ 9

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffne anschließend [http://localhost:3000](http://localhost:3000) im Browser.

### Weitere Skripte

| Befehl             | Beschreibung                   |
| ------------------ | ------------------------------ |
| `npm run build`    | Produktions-Build erstellen    |
| `npm run start`    | Produktionsserver starten      |
| `npm run lint`     | ESLint ausführen               |
| `npm run typecheck`| TypeScript-Typen prüfen        |

---

## Deployment (Vercel)

Die `main`-Branch wird automatisch auf Vercel deployed.

**Ersteinrichtung:**

1. Repository auf GitHub (oder GitLab/Bitbucket) pushen.
2. Auf [vercel.com/new](https://vercel.com/new) anmelden und das Repository importieren.
3. Framework-Preset: **Next.js** (wird automatisch erkannt).
4. Domain `typ2-kompass.de` im Vercel-Dashboard unter *Domains* eintragen.
5. DNS-Einträge beim Registrar/Hoster anpassen (Vercel zeigt die genauen Werte).

Ab diesem Punkt deployt jeder Push auf `main` automatisch in Produktion. Pull Requests erhalten automatisch Preview-URLs.

---

## Umgebungsvariablen

Lokale Variablen in `.env.local` eintragen (wird von Git ignoriert). Für die Produktion im Vercel-Dashboard pflegen.

| Variable | Beschreibung | Erforderlich |
| -------- | ------------ | ------------ |
| *(keine Phase-0-Pflichtfelder)* | | |

Phase 1 fügt Variablen für den E-Mail-Anbieter (z. B. `BREVO_API_KEY`) hinzu.

---

## Projektstruktur

```
app/
  layout.tsx        # Root-Layout, Metadaten, Sprache (de)
  page.tsx          # Landing Page
  globals.css       # Tailwind-Basis
  api/
    waitlist/
      route.ts      # E-Mail-Capture-Endpunkt (Platzhalter für Phase 1)
components/
  Nav.tsx           # Navigation
  Footer.tsx        # Fußzeile
  EmailCaptureForm.tsx  # Client-Komponente mit Formular
lib/
  i18n/
    locales.ts      # Unterstützte Sprachen
    messages/
      de.ts         # Deutsche Texte (Haupt-Locale)
.github/
  workflows/
    ci.yml          # Lint + Typecheck bei Push/PR auf main
```

---

## Lizenz

Copyright 2026 Typ2-Kompass. Alle Rechte vorbehalten.
