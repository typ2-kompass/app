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

`https://app.typ2-kompass.de` wird von **Cloudflare Pages** ausgeliefert. Jeder Push auf `main` triggert automatisch einen Production-Deploy. Pull Requests bekommen eine Preview-URL.

### Architektur

```
GitHub (main)  ──push──►  Cloudflare Pages Build
                              │
                              ▼
                     @cloudflare/next-on-pages
                     (next build → Workers)
                              │
                              ▼
                  app.typ2-kompass.de (CNAME → Pages)
```

- **Hosting:** Cloudflare Pages (Free-Tier).
- **Adapter:** [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) — App-Router + Edge-API-Routes ohne Vercel.
- **Runtime:** Cloudflare Workers (`compatibility_flags = ["nodejs_compat"]`, siehe `wrangler.toml`).
- **Node.js:** Build-Container nutzt Node 22 (siehe `.nvmrc`).
- **DNS:** `app.typ2-kompass.de` ist ein CNAME auf das Pages-Projekt (verwaltet bei [checkdomain](https://www.checkdomain.de/)).

### Ersteinrichtung (einmalig, durch FoundingEngineer)

1. **GitHub-Repo erstellen** und diesen Commit pushen:
   ```bash
   git remote add origin git@github.com:<owner>/typ2-kompass.git
   git push -u origin main
   ```
2. **Cloudflare Pages**: Dashboard → *Workers & Pages* → *Create application* → *Pages* → *Connect to Git* → Repo `typ2-kompass` auswählen.
3. **Build-Konfiguration** im Pages-Setup:
   - Framework preset: **Next.js**
   - Build command: `npm run pages:build`
   - Build output directory: `.vercel/output/static`
   - Root directory: `/` (Repo-Root)
   - Environment variable: `NODE_VERSION = 22`
4. **Custom Domain hinzufügen**: Pages-Projekt → *Custom domains* → `app.typ2-kompass.de` eintragen. Cloudflare zeigt den CNAME-Zielwert (z. B. `<project>.pages.dev`).
5. **DNS bei checkdomain setzen**: Im checkdomain-Kundencenter unter DNS-Verwaltung für `typ2-kompass.de` einen CNAME-Eintrag `app` → `<project>.pages.dev` hinterlegen. TTL Standard. **Keine A/AAAA/MX-Einträge der Haupt-Domain anfassen** — die WordPress-Seite bleibt unberührt.
6. **HTTPS verifizieren**: Cloudflare stellt automatisch ein Zertifikat aus (kann 1–5 Min dauern). Anschließend `https://app.typ2-kompass.de` aufrufen.

### Production-Deploys

Ab Punkt 5 reicht ein `git push` auf `main`. Branches und PRs bekommen automatisch eine Preview-URL der Form `https://<commit>.typ2-kompass.pages.dev`.

### Rollback

Im Pages-Dashboard → *Deployments* → älteren Deploy auswählen → *Rollback to this deployment*. Geht in Sekunden, ohne Repo-Änderung.

---

## Umgebungsvariablen

Lokale Variablen in `.env.local` eintragen (wird von Git ignoriert). Für die Produktion im **Cloudflare-Pages-Dashboard** unter *Settings → Environment variables* pflegen.

| Variable                        | Beschreibung                          | Erforderlich |
| ------------------------------- | ------------------------------------- | ------------ |
| *(keine Phase-0-Pflichtfelder)* |                                       |              |

Phase 1 ergänzt Variablen für Auth ([TYP-3](/TYP/issues/TYP-3)), Analytics ([TYP-4](/TYP/issues/TYP-4)) und E-Mail-Provider.

---

## CI

`.github/workflows/ci.yml` lintet und typecheckt bei jedem Push/PR auf `main`. Der eigentliche Deploy läuft separat über Cloudflare Pages.

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
wrangler.toml       # Cloudflare-Pages-/Workers-Konfiguration
.nvmrc              # Node-Version für Build-Container (22)
```

---

## Lizenz

Copyright 2026 Typ2-Kompass. Alle Rechte vorbehalten.
