"use server";

// Server actions for the B2B Verwalter page — TYP-52.
// Both actions validate the orderToken first so they're safe to call from the
// public page without additional session auth.

import { revalidatePath } from "next/cache";
import { getAppEnv } from "@/lib/env";
import { sendActivationEmail } from "@/lib/auth/sendActivation";

export type AssignResult =
  | { ok: true }
  | { error: "invalid_email" | "code_not_found" | "already_assigned" | "runtime" };

export type BulkAssignResult = {
  sent: number;
  errors: string[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CodeRow = {
  code: string;
  status: string;
  recipientEmail: string | null;
};

type OrderRow = {
  id: string;
  buyerEmail: string;
};

export async function assignSeat(
  orderToken: string,
  code: string,
  recipientEmail: string,
): Promise<AssignResult> {
  const email = recipientEmail.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return { error: "invalid_email" };

  const env = await getAppEnv();
  if (!env.DB) return { error: "runtime" };

  // Verify orderToken → order
  const order = await env.DB.prepare(
    `SELECT id, buyerEmail FROM orders WHERE orderToken = ?`,
  )
    .bind(orderToken)
    .first<OrderRow>();
  if (!order) return { error: "runtime" };

  // Verify code belongs to this order and is still pending
  const row = await env.DB.prepare(
    `SELECT code, status, recipientEmail FROM activation_codes WHERE code = ? AND orderId = ?`,
  )
    .bind(code, order.id)
    .first<CodeRow>();
  if (!row) return { error: "code_not_found" };
  if (row.status !== "pending") return { error: "already_assigned" };

  // Write recipientEmail + set status=sent atomically (single statement)
  const nowIso = new Date().toISOString();
  const update = await env.DB.prepare(
    `UPDATE activation_codes
        SET recipientEmail = ?, status = 'sent', sentAt = ?
      WHERE code = ? AND orderId = ? AND status = 'pending'`,
  )
    .bind(email, nowIso, code, order.id)
    .run();

  const changes = (update.meta as { changes?: number } | undefined)?.changes ?? 0;
  if (changes === 0) return { error: "already_assigned" };

  // Send activation email — non-fatal if it fails (status is already updated)
  const baseUrl =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "https://mein.typ2-kompass.de";
  try {
    await sendActivationEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      to: email,
      code,
      baseUrl,
    });
  } catch {
    // Email failure is logged implicitly — the DB update already succeeded
  }

  revalidatePath(`/seats/${orderToken}`);
  return { ok: true };
}

export async function bulkAssign(
  orderToken: string,
  pairs: { code: string; email: string }[],
): Promise<BulkAssignResult> {
  const env = await getAppEnv();
  if (!env.DB) return { sent: 0, errors: ["runtime"] };

  const order = await env.DB.prepare(
    `SELECT id, buyerEmail FROM orders WHERE orderToken = ?`,
  )
    .bind(orderToken)
    .first<OrderRow>();
  if (!order) return { sent: 0, errors: ["invalid_token"] };

  const baseUrl =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "https://mein.typ2-kompass.de";
  const nowIso = new Date().toISOString();
  let sent = 0;
  const errors: string[] = [];

  for (const { code, email: rawEmail } of pairs) {
    const email = rawEmail.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      errors.push(`${code}: ungültige E-Mail`);
      continue;
    }
    try {
      const update = await env.DB.prepare(
        `UPDATE activation_codes
            SET recipientEmail = ?, status = 'sent', sentAt = ?
          WHERE code = ? AND orderId = ? AND status = 'pending'`,
      )
        .bind(email, nowIso, code, order.id)
        .run();
      const changes = (update.meta as { changes?: number } | undefined)?.changes ?? 0;
      if (changes === 0) {
        errors.push(`${code}: bereits vergeben`);
        continue;
      }
      await sendActivationEmail({
        apiKey: env.RESEND_API_KEY,
        from: env.EMAIL_FROM,
        to: email,
        code,
        baseUrl,
      });
      sent += 1;
    } catch {
      errors.push(`${code}: Fehler beim Senden`);
    }
  }

  revalidatePath(`/seats/${orderToken}`);
  return { sent, errors };
}
