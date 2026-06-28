import type { EventContext } from '@cloudflare/workers-types';

interface Env {
  B2B_NOTIFY_EMAIL: string; // set in CF Pages env: hallo@typ2-kompass.de
}

interface B2BPayload {
  name?: unknown;
  company?: unknown;
  email?: unknown;
  seats?: unknown;
  note?: unknown;
  _honeypot?: unknown;
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function sanitise(v: unknown, maxLen = 200): string {
  if (!isString(v)) return '';
  return v.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

const ALLOWED_SEATS = new Set(['5-24', '25-99', '100+']);

export async function onRequestPost(context: EventContext<Env, string, unknown>) {
  const { request, env } = context;

  // Rate limiting: CF will handle at the WAF level. No extra token needed here.

  let body: B2BPayload;
  try {
    body = (await request.json()) as B2BPayload;
  } catch {
    return jsonError(400, 'Invalid JSON');
  }

  // Honeypot — bots fill hidden fields
  if (body._honeypot) {
    return jsonOk(); // silently accept
  }

  const name = sanitise(body.name);
  const company = sanitise(body.company);
  const email = sanitise(body.email, 254);
  const seats = sanitise(body.seats, 10);
  const note = sanitise(body.note, 1000);

  if (!name || !company || !email || !seats) {
    return jsonError(400, 'Pflichtfelder fehlen');
  }
  if (!isValidEmail(email)) {
    return jsonError(400, 'Ungültige E-Mail-Adresse');
  }
  if (!ALLOWED_SEATS.has(seats)) {
    return jsonError(400, 'Ungültige Sitzanzahl');
  }

  const notifyTo = env.B2B_NOTIFY_EMAIL ?? 'hallo@typ2-kompass.de';

  // Send via MailChannels (available on CF Pages for free, no setup needed)
  const emailBody = [
    `Neue B2B-Anfrage über typ2-kompass.de/firmen`,
    '',
    `Name: ${name}`,
    `Unternehmen: ${company}`,
    `E-Mail: ${email}`,
    `Sitze: ${seats}`,
    note ? `Anmerkungen: ${note}` : '',
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: notifyTo }] }],
        from: { email: 'noreply@typ2-kompass.de', name: 'Typ2-Kompass Website' },
        reply_to: { email, name },
        subject: `B2B-Anfrage: ${company} (${seats} Sitze)`,
        content: [{ type: 'text/plain', value: emailBody }],
      }),
    });

    if (!res.ok && res.status !== 202) {
      console.error('MailChannels error', res.status, await res.text());
      return jsonError(502, 'E-Mail-Versand fehlgeschlagen');
    }
  } catch (err) {
    console.error('MailChannels fetch error', err);
    return jsonError(502, 'E-Mail-Versand fehlgeschlagen');
  }

  return jsonOk();
}

function jsonOk() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
