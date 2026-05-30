# Typ2-Kompass

Next.js (TypeScript) + Tailwind CSS — App-Layer für [typ2-kompass.de](https://typ2-kompass.de).

> **Wichtig:** Diese App läuft unter `app.typ2-kompass.de`. Die Haupt-Domain `typ2-kompass.de` zeigt weiterhin auf die bestehende WordPress-Seite und wird durch dieses Repo **nicht** verändert.

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
- **Custom-Domain:** `https://app.typ2-kompass.de` — wird gesetzt, sobald die Domain im Cloudflare-Account freigegeben und der CNAME bei checkdomain gepflegt ist.

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
typ2-kompass-app.pages.dev   +   app.typ2-kompass.de (CNAME)
```

- **Hosting:** Cloudflare Pages (Free-Tier), Account `info@typ2-kompass.de`.
- **Adapter:** [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) — App-Router auf Cloudflare Workers.
- **Runtime:** `compatibility_flags = ["nodejs_compat"]`, `compatibility_date = "2025-05-01"` (siehe `wrangler.toml`).
- **DNS:** `app.typ2-kompass.de` als CNAME auf `typ2-kompass-app.pages.dev` (verwaltet bei [checkdomain](https://www.checkdomain.de/)). Haupt-Domain `typ2-kompass.de` bleibt unverändert auf WordPress (185.3.235.231).

### Benötigte GitHub-Secrets (einmalig)

Im Repo unter *Settings → Secrets and variables → Actions → New repository secret*:

| Secret                  | Wert                                                           |
| ----------------------- | -------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare-API-Token mit Scope `Account: Cloudflare Pages — Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | `c9fdac58848b011b5047a77f37ce65e2` (Account `info@typ2-kompass.de`) |

Ohne diese Secrets schlägt der Deploy-Workflow fehl — der CI-Workflow (Lint/Typecheck) läuft unabhängig weiter.

### Production-Deploys

Push auf `main` → GitHub-Actions-Workflow `Deploy` → `wrangler pages deploy` → neue Production-Version auf `typ2-kompass-app.pages.dev` und (sobald CNAME aktiv) `app.typ2-kompass.de`.

Manueller Deploy lokal (selten gebraucht, erfordert lokal `wrangler login` oder `CLOUDFLARE_API_TOKEN` im Environment):

```bash
npm run pages:deploy
```

### Custom-Domain ergänzen

Sobald die Hostname-Reservierung für `app.typ2-kompass.de` im Cloudflare-Account frei ist:

1. Cloudflare-Pages-API oder Dashboard → Projekt `typ2-kompass-app` → *Custom domains* → `app.typ2-kompass.de` hinzufügen.
2. Cloudflare zeigt CNAME-Ziel `typ2-kompass-app.pages.dev`.
3. Im checkdomain-Kundencenter: DNS-Eintrag `app` (Typ `CNAME`) → `typ2-kompass-app.pages.dev`. **A/AAAA/MX der Haupt-Domain unverändert lassen.**
4. Zertifikat wird automatisch ausgestellt (1–5 Min).

### Rollback

Cloudflare-Dashboard → *Workers & Pages* → `typ2-kompass-app` → *Deployments* → älteren Eintrag → *Rollback to this deployment*. Geht in Sekunden, kein Re-Push nötig.

---

## Umgebungsvariablen

Lokale Variablen in `.env.local` eintragen (wird von Git ignoriert). Für die Produktion im **Cloudflare-Pages-Dashboard** unter *Settings → Environment variables* pflegen.

| Variable                        | Beschreibung                          | Erforderlich |
| ------------------------------- | ------------------------------------- | ------------ |
| *(keine Phase-0-Pflichtfelder)* |                                       |              |

Phase 1 ergänzt Variablen für Auth ([TYP-3](/TYP/issues/TYP-3)), Analytics ([TYP-4](/TYP/issues/TYP-4)) und E-Mail-Provider.

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
