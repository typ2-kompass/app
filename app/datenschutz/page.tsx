import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung — Typ2-Kompass',
  description:
    'Datenschutzerklärung von Typ2-Kompass: Informationen zur Verarbeitung Ihrer personenbezogenen Daten gemäß DSGVO.',
  robots: { index: false, follow: false },
};

export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 pb-20">
      <h1 className="mb-1 font-serif text-3xl font-semibold">Datenschutzerklärung</h1>
      <p className="mb-10 text-sm text-slate-400">Stand: 19. Juni 2026</p>

      <div className="prose prose-slate max-w-none">
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlicher im Sinne der DSGVO ist <strong>Typ2-Kompass</strong>.<br />
          Kontakt:{' '}
          <a href="mailto:datenschutz@typ2-kompass.de">datenschutz@typ2-kompass.de</a>
        </p>

        <h2>2. Erhobene Daten und Verarbeitungszwecke</h2>

        <h3>2.1 Nutzerkonto und Authentifizierung</h3>
        <p>
          Zur Nutzung der App verarbeiten wir Ihre E-Mail-Adresse sowie Authentifizierungs-Token
          (Session). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
        </p>

        <h3>2.2 Käufe und Zahlungsabwicklung</h3>
        <p>
          Beim Erwerb eines Abonnements verarbeiten wir folgende Bestelldaten:
        </p>
        <ul>
          <li>E-Mail-Adresse</li>
          <li>Name</li>
          <li>Rechnungsadresse</li>
          <li>Kaufbetrag und Währung</li>
          <li>Zahlungsmethode (z. B. Kreditkarte, SEPA-Lastschrift)</li>
        </ul>
        <p>
          Die Zahlungsabwicklung erfolgt durch{' '}
          <strong>Stripe Payments Europe, Ltd.</strong>, 1 Grand Canal Street Lower, Grand Canal
          Dock, Dublin, D02 H210, Irland. Stripe ist als Auftragsverarbeiter gemäß Art. 28 DSGVO
          für uns tätig. Wir haben mit Stripe einen Auftragsverarbeitungsvertrag abgeschlossen.
          Transfers in Drittländer erfolgen auf Basis der EU-Standardvertragsklauseln (SCC,
          Art. 46 Abs. 2 lit. c DSGVO).
        </p>
        <p>
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
        </p>

        <h3>2.3 Aufbewahrung von Bestelldaten</h3>
        <p>
          Bestelldaten und Rechnungen speichern wir für <strong>10 Jahre</strong> gemäß § 147
          Abs. 1 AO. Rechtsgrundlage: Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung).
        </p>

        <h2>3. Cookies und lokaler Speicher</h2>
        <table>
          <thead>
            <tr>
              <th>Name / Schlüssel</th>
              <th>Art</th>
              <th>Zweck</th>
              <th>Lebensdauer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>next-auth.session-token</code></td>
              <td>Cookie (httpOnly)</td>
              <td>Authentifizierungs-Session</td>
              <td>30 Tage</td>
            </tr>
            <tr>
              <td><code>next-auth.csrf-token</code></td>
              <td>Cookie (httpOnly)</td>
              <td>CSRF-Schutz</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>next-auth.callback-url</code></td>
              <td>Cookie</td>
              <td>Weiterleitungs-URL nach Login</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>__stripe_mid</code></td>
              <td>Cookie</td>
              <td>Stripe Betrugsschutz (Merchant ID)</td>
              <td>1 Jahr</td>
            </tr>
            <tr>
              <td><code>__stripe_sid</code></td>
              <td>Cookie</td>
              <td>Stripe Betrugsschutz (Session ID)</td>
              <td>30 Minuten</td>
            </tr>
          </tbody>
        </table>
        <p>
          Stripe-Cookies werden nur während des Bezahlvorgangs gesetzt und sind technisch
          notwendig für die Zahlungsabwicklung. Rechtsgrundlage: Art. 6 Abs. 1 lit. b und
          lit. f DSGVO.
        </p>

        <h2>4. Auftragsverarbeiter</h2>
        <table>
          <thead>
            <tr>
              <th>Anbieter</th>
              <th>Zweck</th>
              <th>Sitz / Transferbasis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cloudflare, Inc.</td>
              <td>Hosting, CDN</td>
              <td>USA / EU-Standardvertragsklauseln</td>
            </tr>
            <tr>
              <td>Stripe Payments Europe, Ltd.</td>
              <td>Zahlungsabwicklung</td>
              <td>Irland (EU) / SCC für Drittlandtransfer</td>
            </tr>
            <tr>
              <td>Neon Tech, Inc.</td>
              <td>Datenbankhosting (PostgreSQL)</td>
              <td>EU-Region / EU-Standardvertragsklauseln</td>
            </tr>
          </tbody>
        </table>

        <h2>5. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung
          (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch
          (Art. 21 DSGVO). Anfragen an:{' '}
          <a href="mailto:datenschutz@typ2-kompass.de">datenschutz@typ2-kompass.de</a>
        </p>
        <p>
          Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren
          (zuständig: Bundesbeauftragter für den Datenschutz und die Informationsfreiheit, BfDI).
        </p>

        <h2>6. Änderungen</h2>
        <p>
          Diese Datenschutzerklärung kann angepasst werden, wenn sich Dienste oder
          Rechtslage ändern. Die aktuelle Version ist auf dieser Seite verfügbar.
        </p>
      </div>
    </main>
  );
}
