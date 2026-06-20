// German-language activation email body for B2C buyers and B2B Verwalter.
// Shared between:
//   - the Stripe webhook (TYP-49, lands later) which sends the first activation
//   - /api/billing/resend-activation (TYP-51) which lets buyers re-trigger the
//     same email if it got lost.

export function renderActivationEmail(params: { url: string; code: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const { url, code } = params;
  const subject = "Dein Aktivierungs-Link für Typ2-Kompass";

  const text = [
    "Hallo,",
    "",
    "danke für deinen Kauf bei Typ2-Kompass. Mit dem folgenden Link aktivierst du deinen Zugang:",
    url,
    "",
    `Dein Aktivierungs-Code: ${code}`,
    "",
    "Der Link kann nur einmal eingelöst werden. Sobald du ihn anklickst, ist dein Konto aktiv.",
    "",
    "Solltest du den Link nicht angefordert haben, kannst du diese E-Mail ignorieren.",
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
          <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px;color:#0f172a;">Dein Aktivierungs-Link</h1>
          <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#334155;">
            Danke für deinen Kauf. Klicke auf den Button, um deinen Zugang zu aktivieren.
            Der Link kann nur <strong>einmal</strong> eingelöst werden.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${url}"
               style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;">
              Jetzt aktivieren
            </a>
          </p>
          <p style="font-size:13px;line-height:1.6;margin:0 0 16px;color:#64748b;">
            Falls der Button nicht funktioniert, kopiere diese URL in deinen Browser:<br>
            <a href="${url}" style="color:#0d9488;word-break:break-all;">${url}</a>
          </p>
          <p style="font-size:13px;line-height:1.6;margin:16px 0;color:#64748b;">
            Dein Aktivierungs-Code: <code style="background:#f1f5f9;padding:2px 8px;border-radius:6px;font-size:13px;">${code}</code>
          </p>
          <p style="font-size:12px;line-height:1.6;margin:24px 0 0;color:#94a3b8;">
            Solltest du den Link nicht angefordert haben, kannst du diese E-Mail ignorieren.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

export async function sendActivationEmail(params: {
  apiKey: string;
  from: string;
  to: string;
  code: string;
  baseUrl: string;
}): Promise<void> {
  const { apiKey, from, to, code, baseUrl } = params;
  const url = `${baseUrl.replace(/\/$/, "")}/aktivieren/${encodeURIComponent(code)}`;
  const { subject, html, text } = renderActivationEmail({ url, code });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend activation send failed: ${res.status} ${body}`);
  }
}
