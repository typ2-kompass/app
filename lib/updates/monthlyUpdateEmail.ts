interface MonthlyUpdateEmailParams {
  monthLabel: string;   // e.g. "Juni 2026"
  total: number;
  newCount: number;
  updatesUrl: string;
}

export function renderMonthlyUpdateEmail({
  monthLabel,
  total,
  newCount,
  updatesUrl,
}: MonthlyUpdateEmailParams): { subject: string; html: string; text: string } {
  const subject = `Dein Update-Bericht für ${monthLabel}`;

  const updatedCount = total - newCount;
  const summaryParts: string[] = [];
  if (newCount > 0) summaryParts.push(`${newCount} neue Inhalte`);
  if (updatedCount > 0) summaryParts.push(`${updatedCount} aktualisierte Inhalte`);
  const summary = summaryParts.length > 0 ? summaryParts.join(", ") : "keine Änderungen";

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: Georgia, serif; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f8f9fa;">
  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
    <p style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; margin: 0 0 8px;">Typ2-Kompass</p>
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 24px; color: #1a1a2e;">
      Update-Bericht ${monthLabel}
    </h1>

    <p style="font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
      Im ${monthLabel} haben wir ${total > 0 ? summary : "keine inhaltlichen Änderungen"} vorgenommen.
    </p>

    ${total > 0 ? `
    <p style="font-size: 15px; line-height: 1.7; margin: 0 0 28px; color: #374151;">
      Alle Updates findest du in deinem persönlichen Changelog — dort siehst du nur die Inhalte,
      die seit deinem Kauf neu erschienen oder überarbeitet worden sind.
    </p>

    <a href="${updatesUrl}"
       style="display: inline-block; background: #1a1a2e; color: white; text-decoration: none;
              padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600;">
      Zum Changelog →
    </a>
    ` : `
    <p style="font-size: 15px; line-height: 1.7; color: #374151;">
      Unsere Redaktion arbeitet kontinuierlich an neuen und aktualisierten Inhalten.
      Du erhältst nächsten Monat wieder einen Bericht.
    </p>
    `}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 36px 0;">
    <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
      Du erhältst diese E-Mail, weil du beim Kauf von Typ2-Kompass dem monatlichen Update-Bericht zugestimmt hast.
      Du kannst den Bericht in deinen Konto-Einstellungen jederzeit deaktivieren.
    </p>
  </div>
</body>
</html>`;

  const text = `Update-Bericht ${monthLabel} — Typ2-Kompass

Im ${monthLabel}: ${summary}.

${total > 0 ? `Alle Updates: ${updatesUrl}` : "Unsere Redaktion arbeitet weiter an neuen Inhalten."}

---
Du erhältst diese E-Mail, weil du dem monatlichen Update-Bericht zugestimmt hast.
`;

  return { subject, html, text };
}
