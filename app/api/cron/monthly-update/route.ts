// POST /api/cron/monthly-update
// Triggered by Cloudflare Cron Trigger on the 1st of each month at 09:00 UTC.
// Wrangler config: [[triggers.crons]] = "0 9 1 * *"
//
// 1. Counts changelog entries for the previous calendar month.
// 2. Creates an in_app_notifications row for every active-entitlement user.
// 3. Sends an update-report email via Resend to users with updateEmailOptIn = 1.
//
// Protected by CRON_SECRET — must match the env var.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAppEnv } from "@/lib/env";
import { countEntriesInMonth } from "@/lib/updates/changelog";
import { renderMonthlyUpdateEmail } from "@/lib/updates/monthlyUpdateEmail";

export const runtime = "edge";

function prevMonthKey(): string {
  const now = new Date();
  const y = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const m = now.getUTCMonth() === 0 ? 12 : now.getUTCMonth();
  return `${y}-${String(m).padStart(2, "0")}`;
}

function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

export async function POST(req: NextRequest) {
  const env = await getAppEnv();

  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== (process.env.CRON_SECRET ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.DB) {
    return NextResponse.json({ error: "DB not available" }, { status: 503 });
  }

  const yearMonth = prevMonthKey();
  const { total, newCount } = await countEntriesInMonth(env.DB, yearMonth);
  const label = monthLabel(yearMonth);
  const notifTitle = `Update-Bericht ${label}: ${total} neue/aktualisierte Inhalte`;

  // Fetch all users with active entitlements.
  const activeUsers = await env.DB
    .prepare(
      `SELECT DISTINCT e.userId, u.email,
              COALESCE(p.updateEmailOptIn, 0) as emailOptIn
       FROM entitlements e
       JOIN users u ON u.id = e.userId
       LEFT JOIN user_preferences p ON p.userId = e.userId
       WHERE e.revokedAt IS NULL`,
    )
    .all<{ userId: string; email: string; emailOptIn: number }>();

  const users = activeUsers.results ?? [];
  const notifId = () => crypto.randomUUID();

  // Insert in-app notifications in a batch.
  const inserts = users.map((u) =>
    env.DB.prepare(
      `INSERT OR IGNORE INTO in_app_notifications (id, userId, kind, title, createdAt)
       VALUES (?, ?, 'monthly_update_report', ?, CURRENT_TIMESTAMP)`,
    ).bind(notifId(), u.userId, notifTitle),
  );

  if (inserts.length > 0) {
    await env.DB.batch(inserts);
  }

  // Send emails to opted-in users.
  const optedIn = users.filter((u) => u.emailOptIn === 1);
  let emailsSent = 0;

  for (const user of optedIn) {
    const { subject, html, text } = renderMonthlyUpdateEmail({
      monthLabel: label,
      total,
      newCount,
      updatesUrl: "https://app.typ2-kompass.de/updates",
    });

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: user.email,
          subject,
          html,
          text,
        }),
      });
      if (res.ok) emailsSent++;
    } catch {
      // Log and continue — don't abort the entire batch on a single failure.
      console.error(`Failed to send update email to ${user.email}`);
    }
  }

  return NextResponse.json({
    yearMonth,
    total,
    newCount,
    notificationsCreated: inserts.length,
    emailsSent,
  });
}
