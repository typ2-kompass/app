// B2B-Verwalter-Seite — TYP-52.
// Auth: order token in URL (long random string from buyer confirmation email).
// No session / magic-link login required — the token IS the credential.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppEnv } from "@/lib/env";
import AssignForm from "./AssignForm";
import BulkAssignForm from "./BulkAssignForm";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Zugänge verwalten — Typ2-Kompass",
  robots: { index: false, follow: false },
};

type CodeRow = {
  code: string;
  status: string;
  recipientEmail: string | null;
  sentAt: string | null;
  redeemedAt: string | null;
};

type OrderRow = {
  id: string;
  buyerEmail: string;
  quantity: number;
  productSku: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Ausstehend",
  sent: "Gesendet",
  redeemed: "Eingelöst",
  revoked: "Widerrufen",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  sent: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  redeemed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  revoked: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

export default async function SeatsPage({
  params,
}: {
  params: Promise<{ order_token: string }>;
}) {
  const { order_token } = await params;
  const env = await getAppEnv();

  if (!env.DB) notFound();

  const order = await env.DB.prepare(
    `SELECT id, buyerEmail, quantity, productSku, createdAt
       FROM orders WHERE orderToken = ?`,
  )
    .bind(order_token)
    .first<OrderRow>();

  if (!order) notFound();

  const codesResult = await env.DB.prepare(
    `SELECT code, status, recipientEmail, sentAt, redeemedAt
       FROM activation_codes WHERE orderId = ?
       ORDER BY code ASC`,
  )
    .bind(order.id)
    .all<CodeRow>();

  const codes = codesResult.results ?? [];
  const pendingCodes = codes.filter((c) => c.status === "pending").map((c) => c.code);
  const redeemed = codes.filter((c) => c.status === "redeemed").length;
  const sent = codes.filter((c) => c.status === "sent").length;

  return (
    <main className="min-h-screen bg-kompass-mist px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Header */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-kompass-accent">
            Typ2-Kompass
          </p>
          <h1 className="text-2xl font-bold text-kompass-ink">
            Zugänge verwalten
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bestellung von <span className="font-medium">{order.buyerEmail}</span>
            {" · "}
            {new Date(order.createdAt).toLocaleDateString("de-DE")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Gesamt", value: codes.length },
            { label: "Gesendet", value: sent },
            { label: "Eingelöst", value: redeemed },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center"
            >
              <p className="text-2xl font-bold text-kompass-ink">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* CSV export */}
        <div className="flex items-center justify-end">
          <a
            href={`/seats/${order_token}/codes.csv`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            CSV exportieren
          </a>
        </div>

        {/* Code list */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Mitarbeiter</th>
                <th className="px-4 py-3 text-left">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.map((c) => (
                <tr key={c.code} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {c.code}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[c.status] ?? STATUS_CLASS.revoked}`}
                    >
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.recipientEmail ?? (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "pending" ? (
                      <AssignForm orderToken={order_token} code={c.code} />
                    ) : (
                      <span className="text-slate-400 text-xs">
                        {c.status === "redeemed"
                          ? `Eingelöst ${c.redeemedAt ? new Date(c.redeemedAt).toLocaleDateString("de-DE") : ""}`
                          : c.status === "sent"
                          ? `Gesendet ${c.sentAt ? new Date(c.sentAt).toLocaleDateString("de-DE") : ""}`
                          : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {codes.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              Keine Aktivierungs-Codes für diese Bestellung gefunden.
            </p>
          )}
        </div>

        {/* Bulk assign (only if pending codes exist) */}
        {pendingCodes.length > 0 && (
          <BulkAssignForm orderToken={order_token} pendingCodes={pendingCodes} />
        )}

      </div>
    </main>
  );
}
