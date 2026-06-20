// Activation email templates for B2C buyers, B2B admins (Verwalter), and B2B employees.
// Mirrors the style of lib/auth/sendMagicLink.ts.

const SUPPORT_EMAIL = "support@typ2-kompass.de";

const SHARED_STYLES = {
  wrapper: `background:#f6f7f9;margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1f2937;`,
  table: `max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;`,
  brand: `font-size:14px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488;margin:0 0 16px;`,
  h1: `font-size:22px;line-height:1.3;margin:0 0 16px;color:#0f172a;`,
  body: `font-size:15px;line-height:1.6;margin:0 0 24px;color:#334155;`,
  button: `display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;`,
  fallback: `font-size:13px;line-height:1.6;margin:0 0 16px;color:#64748b;`,
  footer: `font-size:12px;line-height:1.6;margin:24px 0 0;color:#94a3b8;`,
  code: `font-family:monospace;background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:16px;letter-spacing:0.12em;`,
};

function htmlShell(body: string): string {
  return `<!doctype html>
<html lang="de">
  <body style="${SHARED_STYLES.wrapper}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${SHARED_STYLES.table}">
      <tr>
        <td>
          <p style="${SHARED_STYLES.brand}">Typ2-Kompass</p>
          ${body}
          <p style="${SHARED_STYLES.footer}">
            Bei Fragen: <a href="mailto:${SUPPORT_EMAIL}" style="color:#0d9488;">${SUPPORT_EMAIL}</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ─── B2C buyer ───────────────────────────────────────────────────────────────

export type B2CParams = {
  kind: "b2c";
  code: string;
  activationUrl: string;
};

function renderB2C({ code, activationUrl }: Omit<B2CParams, "kind">): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Dein Aktivierungscode für Typ2-Kompass";

  const text = [
    "Hallo,",
    "",
    "hier ist dein persönlicher Aktivierungscode für Typ2-Kompass:",
    "",
    `  Code: ${code}`,
    "",
    "Aktiviere deinen Zugang direkt unter:",
    activationUrl,
    "",
    "Falls du den Code lieber manuell eingibst: Gehe auf typ2-kompass.de/aktivieren und trage den Code oben ein.",
    "",
    `Bei Fragen erreichst du uns unter ${SUPPORT_EMAIL}.`,
    "",
    "Typ2-Kompass",
  ].join("\n");

  const html = htmlShell(`
          <h1 style="${SHARED_STYLES.h1}">Dein Aktivierungscode</h1>
          <p style="${SHARED_STYLES.body}">
            Hier ist dein persönlicher Aktivierungscode:
          </p>
          <p style="margin:0 0 24px;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#0f172a;text-align:center;">
            <span style="${SHARED_STYLES.code}">${code}</span>
          </p>
          <p style="margin:0 0 24px;">
            <a href="${activationUrl}" style="${SHARED_STYLES.button}">
              Jetzt aktivieren
            </a>
          </p>
          <p style="${SHARED_STYLES.fallback}">
            Falls der Button nicht funktioniert, kopiere diese URL in deinen Browser:<br>
            <a href="${activationUrl}" style="color:#0d9488;word-break:break-all;">${activationUrl}</a>
          </p>`);

  return { subject, html, text };
}

// ─── B2B Verwalter (admin) ────────────────────────────────────────────────────

export type B2BAdminParams = {
  kind: "b2b_admin";
  codes: string[];
  adminUrl: string;
};

function renderB2BAdmin({ codes, adminUrl }: Omit<B2BAdminParams, "kind">): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Deine ${codes.length} Aktivierungscodes für Typ2-Kompass`;

  const codeList = codes.map((c) => `  - ${c}`).join("\n");
  const text = [
    "Hallo,",
    "",
    `Für deine Organisation wurden ${codes.length} Aktivierungscode(s) bereitgestellt:`,
    "",
    codeList,
    "",
    "Verwalte die Codes und weise sie deinen Mitarbeitenden zu:",
    adminUrl,
    "",
    `Bei Fragen erreichst du uns unter ${SUPPORT_EMAIL}.`,
    "",
    "Typ2-Kompass",
  ].join("\n");

  const codesHtml = codes
    .map(
      (c) =>
        `<li style="margin:4px 0;font-family:monospace;font-size:15px;letter-spacing:0.1em;">${c}</li>`
    )
    .join("\n");

  const html = htmlShell(`
          <h1 style="${SHARED_STYLES.h1}">Deine ${codes.length} Aktivierungscodes</h1>
          <p style="${SHARED_STYLES.body}">
            Für deine Organisation wurden die folgenden Codes bereitgestellt.
            Weise sie deinen Mitarbeitenden zu oder gib sie direkt weiter.
          </p>
          <ul style="margin:0 0 24px;padding-left:20px;color:#0f172a;">
            ${codesHtml}
          </ul>
          <p style="margin:0 0 24px;">
            <a href="${adminUrl}" style="${SHARED_STYLES.button}">
              Zur Verwaltungsseite
            </a>
          </p>
          <p style="${SHARED_STYLES.fallback}">
            Falls der Button nicht funktioniert:<br>
            <a href="${adminUrl}" style="color:#0d9488;word-break:break-all;">${adminUrl}</a>
          </p>`);

  return { subject, html, text };
}

// ─── B2B employee (sent by admin) ────────────────────────────────────────────

export type B2BEmployeeParams = {
  kind: "b2b_employee";
  code: string;
  activationUrl: string;
  companyName?: string;
};

function renderB2BEmployee({
  code,
  activationUrl,
  companyName,
}: Omit<B2BEmployeeParams, "kind">): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Dein Zugang zu Typ2-Kompass";
  const senderNote = companyName
    ? `Dein Arbeitgeber (${companyName}) hat dir einen Zugang zu Typ2-Kompass bereitgestellt.`
    : "Dein Arbeitgeber hat dir einen Zugang zu Typ2-Kompass bereitgestellt.";

  const text = [
    "Hallo,",
    "",
    senderNote,
    "",
    "Dein persönlicher Aktivierungscode:",
    "",
    `  Code: ${code}`,
    "",
    "Aktiviere deinen Zugang unter:",
    activationUrl,
    "",
    `Bei Fragen erreichst du uns unter ${SUPPORT_EMAIL}.`,
    "",
    "Typ2-Kompass",
  ].join("\n");

  const html = htmlShell(`
          <h1 style="${SHARED_STYLES.h1}">Dein Zugang zu Typ2-Kompass</h1>
          <p style="${SHARED_STYLES.body}">${senderNote}</p>
          <p style="${SHARED_STYLES.body}">
            Dein persönlicher Aktivierungscode:
          </p>
          <p style="margin:0 0 24px;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#0f172a;text-align:center;">
            <span style="${SHARED_STYLES.code}">${code}</span>
          </p>
          <p style="margin:0 0 24px;">
            <a href="${activationUrl}" style="${SHARED_STYLES.button}">
              Jetzt aktivieren
            </a>
          </p>
          <p style="${SHARED_STYLES.fallback}">
            Falls der Button nicht funktioniert:<br>
            <a href="${activationUrl}" style="color:#0d9488;word-break:break-all;">${activationUrl}</a>
          </p>`);

  return { subject, html, text };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type ActivationEmailParams =
  | B2CParams
  | B2BAdminParams
  | B2BEmployeeParams;

export function renderActivationEmail(params: ActivationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  switch (params.kind) {
    case "b2c":
      return renderB2C(params);
    case "b2b_admin":
      return renderB2BAdmin(params);
    case "b2b_employee":
      return renderB2BEmployee(params);
  }
}
