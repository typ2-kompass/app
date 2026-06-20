// CSV export for the B2B Verwalter page — TYP-52.
// GET /seats/[order_token]/codes.csv → download all codes + status for the order.

import { type NextRequest, NextResponse } from "next/server";
import { getAppEnv } from "@/lib/env";

export const runtime = "edge";

type CodeRow = {
  code: string;
  status: string;
  recipientEmail: string | null;
  sentAt: string | null;
  redeemedAt: string | null;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ order_token: string }> },
): Promise<Response> {
  const { order_token } = await context.params;
  const env = await getAppEnv();

  if (!env.DB) {
    return NextResponse.json({ error: "runtime" }, { status: 503 });
  }

  const order = await env.DB.prepare(
    `SELECT id FROM orders WHERE orderToken = ?`,
  )
    .bind(order_token)
    .first<{ id: string }>();

  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const result = await env.DB.prepare(
    `SELECT code, status, recipientEmail, sentAt, redeemedAt
       FROM activation_codes
      WHERE orderId = ?
      ORDER BY code ASC`,
  )
    .bind(order.id)
    .all<CodeRow>();

  const rows = result.results ?? [];
  const header = "Code,Status,Empfänger-E-Mail,Gesendet am,Eingelöst am\r\n";
  const lines = rows
    .map((r) =>
      [
        r.code,
        r.status,
        r.recipientEmail ?? "",
        r.sentAt ?? "",
        r.redeemedAt ?? "",
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\r\n");

  return new Response(header + lines, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aktivierungscodes.csv"`,
    },
  });
}
