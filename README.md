# Typ2-Kompass

Next.js (TypeScript) + Tailwind CSS — App-Layer für [typ2-kompass.de](https://typ2-kompass.de).

> **Wichtig:** Diese App läuft unter `mein.typ2-kompass.de`. Die Haupt-Domain `typ2-kompass.de` zeigt weiterhin auf die bestehende WordPress-Seite und wird durch dieses Repo **nicht** verändert.

---

## Lokal ausführen

**Voraussetzungen:** Node.js ≥ 22, npm ≥ 10

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffne anschließend [http://localhost:3000](http://localhost:3000) im Browser.

### Skripte

| Befehl                | Beschreibung                                                |
| --------------------- | ----------------------------------------------------------- |
| `npm run dev`         | Next.js Dev-Server (http://localhost:3000)                  |
| `npm run build`       | Standard-Next.js-Build (lokale Verifikation)                |
| `npm run start`       | Produktionsserver lokal starten                             |
| `npm run lint`        | ESLint ausführen                                            |
| `npm run typecheck`   | TypeScript-Typen prüfen                                     |
| `npm run pages:build` | Cloudflare-Pages-Build (`@cloudflare/next-on-pages`)        |
| `npm run pages:preview` | Pages-Build lokal mit Wrangler simulieren                 |
| `npm run pages:deploy`  | Pages-Build + manueller Wrangler-Deploy (selten gebraucht) |

---

## Deployment — Cloudflare Pages

Die App wird über **Cloudflare Pages** ausgeliefert. Build & Deploy laufen aus **GitHub Actions** (Workflow `.github/workflows/deploy.yml`) mit dem Wrangler-CLI gegen das Pages-Projekt `typ2-kompass-app`.

- **Default-URL:** `https://typ2-kompass-app.pages.dev` (immer verfügbar, von Cloudflare gestellt).
- **Custom-Domain:** `https://mein.typ2-kompass.de` — wird gesetzt, sobald die Domain im Cloudflare-Account freigegeben und der CNAME bei checkdomain gepflegt ist.

### Architektur

```
GitHub (push main)
        │
        ▼
GitHub Actions  ──►  npm ci → npm run pages:build (@cloudflare/next-on-pages)
        │
        ▼
wrangler pages deploy  ──►  Cloudflare Pages (typ2-kompass-app)
        │
        ▼
typ2-kompass-app.pages.dev   +   mein.typ2-kompass.de (CNAME)
```

- **Hosting:** Cloudflare Pages (Free-Tier), Account `info@typ2-kompass.de`.
- **Adapter:** [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) — App-Router auf Cloudflare Workers.
- **Runtime:** `compatibility_flags = ["nodejs_compat"]`, `compatibility_date = "2025-05-01"` (siehe `wrangler.toml`).
- **DNS:** `mein.typ2-kompass.de` als CNAME auf `typ2-kompass-app.pages.dev` (verwaltet bei [checkdomain](https://www.checkdomain.de/)). Haupt-Domain `typ2-kompass.de` bleibt unverändert auf WordPress (185.3.235.231).

### Benötigte GitHub-Secrets (einmalig)

Im Repo unter *Settings → Secrets and variables → Actions → New repository secret*:

| Secret                  | Wert                                                           |
| ----------------------- | -------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare-API-Token mit Scope `Account: Cloudflare Pages — Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | `c9fdac58848b011b5047a77f37ce65e2` (Account `info@typ2-kompass.de`) |

Ohne diese Secrets schlägt der Deploy-Workflow fehl — der CI-Workflow (Lint/Typecheck) läuft unabhängig weiter.

### Production-Deploys

Push auf `main` → GitHub-Actions-Workflow `Deploy` → `wrangler pages deploy` → neue Production-Version auf `typ2-kompass-app.pages.dev` und (sobald CNAME aktiv) `mein.typ2-kompass.de`.

Manueller Deploy lokal (selten gebraucht, erfordert lokal `wrangler login` oder `CLOUDFLARE_API_TOKEN` im Environment):

```bash
npm run pages:deploy
```

### Custom-Domain ergänzen

Sobald die Hostname-Reservierung für `mein.typ2-kompass.de` im Cloudflare-Account frei ist:

1. Cloudflare-Pages-API oder Dashboard → Projekt `typ2-kompass-app` → *Custom domains* → `mein.typ2-kompass.de` hinzufügen.
2. Cloudflare zeigt CNAME-Ziel `typ2-kompass-app.pages.dev`.
3. Im checkdomain-Kundencenter: DNS-Eintrag `mein` (Typ `CNAME`) → `typ2-kompass-app.pages.dev`. **A/AAAA/MX der Haupt-Domain unverändert lassen.**
4. Zertifikat wird automatisch ausgestellt (1–5 Min).

### Rollback

Cloudflare-Dashboard → *Workers & Pages* → `typ2-kompass-app` → *Deployments* → älteren Eintrag → *Rollback to this deployment*. Geht in Sekunden, kein Re-Push nötig.

---

## Umgebungsvariablen

Lokale Variablen in `.env.local` eintragen (wird von Git ignoriert). Für die Produktion müssen sie an **zwei Stellen** gepflegt werden:

1. **Cloudflare Pages-Dashboard** → *Settings → Environment variables* (für Laufzeit-Secrets)
2. **GitHub Actions Secrets** → *Settings → Secrets and variables → Actions* (für den Deploy-Job, soweit nötig)

Eine vollständige Vorlage liegt in `.env.example`.

| Variable                       | Beschreibung                                                                              | Erforderlich |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ------------ |
| `AUTH_SECRET`                  | Zufallsschlüssel für Auth.js-Session-Signatur (`openssl rand -base64 32`)                 | ✅           |
| `RESEND_API_KEY`               | API-Key vom Resend-Account (kostenloser Tarif reicht für Phase 1)                         | ✅           |
| `EMAIL_FROM`                   | Absender-Adresse für Magic-Link-E-Mails (verifizierte Resend-Domain)                      | ✅           |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible-Site-Domain (`mein.typ2-kompass.de`). Leer = Analytics deaktiviert.             | Phase 1      |
| `PLAUSIBLE_API_KEY`            | Plausible-API-Key (nur Server, für `signup_completed` aus Magic-Link-Callback)            | Phase 1      |
| `NEXT_PUBLIC_SENTRY_DSN`       | Sentry-DSN (öffentlich). Leer = Sentry-SDK no-op zur Laufzeit.                            | Phase 1      |
| `SENTRY_AUTH_TOKEN`            | Sentry-API-Token, nur Build-Zeit, für Source-Map-Upload                                   | Phase 1      |
| `SENTRY_ORG`                   | Sentry-Organisation-Slug                                                                  | Phase 1      |
| `SENTRY_PROJECT`               | Sentry-Projekt-Slug (`typ2-kompass-web`)                                                  | Phase 1      |
| `NEXT_PUBLIC_DEBUG_THROW_KEY`  | Zufallsschlüssel für `/dev-throw` (Client) und `/api/dev-throw` (Server-Log) Verifikation (`openssl rand -hex 16`) | Phase 1      |

> **Datenschutz-Hinweis:** In der App werden **keine personenbezogenen Daten eingegeben**. Gespeichert wird ausschließlich die E-Mail-Adresse zur Identifikation sowie der Modul-Fortschritt. Alle Daten liegen in der Cloudflare-D1-Datenbank, die dem Cloudflare-Account `info@typ2-kompass.de` gehört.

---

## Auth (Magic Link)

Anmeldung läuft über **Auth.js v5** mit dem Resend-E-Mail-Provider. Es gibt kein Passwort — der Nutzer gibt seine E-Mail ein und bekommt einen 10-minütigen Einmal-Link zugeschickt.

### Routen

| Route              | Beschreibung                                    |
| ------------------ | ----------------------------------------------- |
| `/`                | Redirect → `/account` (eingeloggt) oder `/login` |
| `/login`           | Anmeldeformular (E-Mail + DSGVO-Consent)        |
| `/verify-request`  | „Bitte prüfe deine E-Mails"-Bestätigungsseite   |
| `/account`         | Konto-Seite (E-Mail + Abmelden); Auth erforderlich |
| `/api/auth/[...nextauth]` | Auth.js-Handlers (GET + POST)          |

### Lokal entwickeln (mit Datenbankzugriff)

Für lokales Testen mit echter D1-Anbindung `wrangler pages dev` statt `next dev` verwenden:

```bash
# .dev.vars anlegen (wird von Git ignoriert):
# AUTH_SECRET=<dein-secret>
# RESEND_API_KEY=<dein-api-key>
# EMAIL_FROM=Typ2-Kompass <no-reply@mein.typ2-kompass.de>

npm run pages:build
npx wrangler pages dev .vercel/output/static
```

Resend-Logs im Dashboard zeigen den Magic-Link, ohne dass die E-Mail tatsächlich ankommt (Testmodus aktivieren unter *Resend → Emails → Test mode*).

---

## Datenbank (Cloudflare D1)

Auth-Sessions, Nutzer und DSGVO-Consent werden in einer **Cloudflare D1**-Datenbank gespeichert.

### Einmalige Einrichtung

```bash
# 1. Datenbank anlegen (einmalig):
npx wrangler d1 create typ2-kompass-db
# → Ausgabe enthält die database_id, diese in wrangler.toml eintragen

# 2. Schema anlegen:
npx wrangler d1 execute typ2-kompass-db --file=drizzle/0000_init.sql

# 3. D1-Binding in Cloudflare Pages einrichten:
#    Dashboard → Workers & Pages → typ2-kompass-app
#    → Settings → Functions → D1 database bindings
#    Binding name: DB  |  D1 database: typ2-kompass-db
```

> Das Feld `database_id` in `wrangler.toml` enthält aktuell einen Platzhalter — nach dem Anlegen der Datenbank mit dem echten Wert ersetzen und committen.

---

## CI

- `.github/workflows/ci.yml` — Lint + Typecheck bei jedem Push/PR auf `main`.
- `.github/workflows/deploy.yml` — Build (`@cloudflare/next-on-pages`) + Wrangler-Deploy nach `typ2-kompass-app`, bei jedem Push auf `main`. Erfordert die Secrets oben.

---

## Projektstruktur

```
app/
  layout.tsx        # Root-Layout, Metadaten, Sprache (de)
  page.tsx          # Landing Page
  globals.css       # Tailwind-Basis
  api/
    waitlist/
      route.ts      # E-Mail-Capture-Endpunkt (Edge-Runtime, Phase 1)
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
    deploy.yml      # Build + Wrangler-Deploy nach Cloudflare Pages
wrangler.toml       # Cloudflare-Pages-/Workers-Konfiguration
.nvmrc              # Node-Version für Build-Container (22)
```

---

## Lizenz

Copyright 2026 Typ2-Kompass. Alle Rechte vorbehalten.
