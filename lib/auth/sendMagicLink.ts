// German-language magic-link email body for Auth.js Resend provider.
// Kept separate so the email content is unit-testable and matches the
// brand voice without leaking template noise into auth config.

export function renderMagicLinkEmail(params: { url: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const { url } = params;
  const subject = "Dein Anmeldelink für Typ2-Kompass";

  const text = [
    "Hallo,",
    "",
    "klicke auf den folgenden Link, um dich bei Typ2-Kompass anzumelden:",
    url,
    "",
    "Der Link ist 10 Minuten gültig und kann nur einmal verwendet werden.",
    "Wenn du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren.",
    "",
    "Typ2-Kompass",
  ].join("\n");

  const html = `<!doctype html>
<html lang="de">
  <body style="background:#f6f7f9;margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <tr>
        <td>
          <p style="font-size:14px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488;margin:0 0 16px;">Typ2-Kompass</p>
          <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px;color:#0f172a;">Dein Anmeldelink</h1>
          <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#334155;">
            Klicke auf den folgenden Button, um dich anzumelden. Der Link ist
            <strong>10 Minuten</strong> gültig.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${url}"
               style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;">
              Jetzt anmelden
            </a>
          </p>
          <p style="font-size:13px;line-height:1.6;margin:0 0 16px;color:#64748b;">
            Falls der Button nicht funktioniert, kopiere diese URL in deinen Browser:<br>
            <a href="${url}" style="color:#0d9488;word-break:break-all;">${url}</a>
          </p>
          <p style="font-size:12px;line-height:1.6;margin:24px 0 0;color:#94a3b8;">
            Wenn du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren — es passiert nichts weiter.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
