import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { de } from "@/lib/i18n/messages/de";
import { getAppEnv } from "@/lib/env";
import { resolveEntitlement } from "@/lib/billing/entitlement";
import { getUserActivatedAt } from "@/lib/updates/changelog";
import RefundGraceBanner from "@/components/RefundGraceBanner";
import UpdateExpiryBanner from "@/components/UpdateExpiryBanner";
import SignOutButton from "./SignOutButton";
import { ExportButton, DeleteAccountFlow } from "./GdprActions";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Konto — Typ2-Kompass",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const t = de.auth.account;
  const email = session.user.email;

  let graceUntil: string | null = null;
  let entitlementExpired = false;
  let activatedAt: string | null = null;
  const userId = session.user.id;
  if (userId) {
    const env = await getAppEnv();
    if (env.DB) {
      const ent = await resolveEntitlement(env.DB, userId);
      if (ent.status === "grace" && ent.revokedAt) {
        graceUntil = ent.revokedAt;
      } else if (ent.status === "expired") {
        entitlementExpired = true;
      }
      activatedAt = await getUserActivatedAt(env.DB, userId);
    }
  }

  const tRefund = de.auth.refund;

  return (
    <main className="flex min-h-screen items-center justify-center bg-kompass-mist px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        {graceUntil && <RefundGraceBanner revokedAt={graceUntil} />}
        {activatedAt && <UpdateExpiryBanner activatedAt={activatedAt} />}
        {entitlementExpired && (
          <div
            role="status"
            data-testid="refund-expired-card"
            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700"
          >
            <p className="mb-1 font-semibold text-slate-900">
              {tRefund.expiredHeading}
            </p>
            <p
              className="leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: tRefund.expiredBody.replace(
                  "{support}",
                  `<a class="font-semibold underline" href="mailto:${tRefund.supportEmail}">${tRefund.supportEmail}</a>`,
                ),
              }}
            />
          </div>
        )}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-kompass-accent">
            Typ2-Kompass
          </p>
          <h1 className="text-2xl font-bold text-kompass-ink">{t.heading}</h1>
        </div>

        <div className="rounded-xl bg-kompass-mist px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t.emailLabel}
          </p>
          <p className="mt-1 break-all text-base font-medium text-slate-800">
            {email}
          </p>
        </div>

        <SignOutButton />

        <p className="text-xs leading-relaxed text-slate-400">{t.privacyNote}</p>

        {/* Update-Changelog */}
        {activatedAt && (
          <div className="border-t border-slate-100 pt-5">
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Updates &amp; Changelog</h2>
            <p className="mb-3 text-xs leading-relaxed text-slate-500">
              Alle inhaltlichen Updates seit deinem Kauf — mit fachlicher Prüfungsangabe.
            </p>
            <Link
              href="/updates"
              className="inline-block rounded-lg bg-kompass-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Was ist neu? →
            </Link>
          </div>
        )}

        {/* DSGVO Art. 15 — Datenauskunft */}
        <div className="border-t border-slate-100 pt-5">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            {t.exportHeading}
          </h2>
          <p className="mb-3 text-xs leading-relaxed text-slate-500">
            {t.exportBody}
          </p>
          <ExportButton />
        </div>

        {/* DSGVO Art. 17 — Recht auf Löschung */}
        <div className="border-t border-slate-100 pt-5">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            {t.deleteHeading}
          </h2>
          <p className="mb-3 text-xs leading-relaxed text-slate-500">
            {t.deleteBody}
          </p>
          <DeleteAccountFlow email={email} />
        </div>

        <div className="border-t border-slate-100 pt-4 text-center">
          <Link href="/datenschutz" className="text-xs text-slate-400 hover:underline">
            {de.footer.privacy}
          </Link>
        </div>
      </div>
    </main>
  );
}
