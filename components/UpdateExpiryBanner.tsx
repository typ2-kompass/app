import Link from "next/link";

interface UpdateExpiryBannerProps {
  /** ISO timestamp from entitlements.activatedAt */
  activatedAt: string;
}

const UPDATE_PERIOD_DAYS = 365;
const BANNER_WARN_DAYS = 60;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Shows a calm informational banner from day 305 onward (60 days before the
 * 12-month update period ends). No lock-out — read access continues.
 */
export default function UpdateExpiryBanner({ activatedAt }: UpdateExpiryBannerProps) {
  const activated = new Date(activatedAt);
  const expiryDate = new Date(activated.getTime() + UPDATE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const warnDate = new Date(expiryDate.getTime() - BANNER_WARN_DAYS * 24 * 60 * 60 * 1000);

  const now = new Date();
  if (now < warnDate) return null;

  const isExpired = now >= expiryDate;
  const expiryFormatted = formatDate(expiryDate.toISOString());

  if (isExpired) {
    return (
      <div
        role="status"
        className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700"
      >
        <p className="mb-1 font-semibold text-slate-900">Dein Update-Zeitraum ist abgelaufen</p>
        <p className="leading-relaxed">
          Du behältst deinen vollen Lese-Zugang. Updates werden nicht mehr eingeschlossen.{" "}
          <Link href="/account/renewal" className="font-semibold underline">
            Jetzt für 19 EUR/Jahr verlängern.
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800"
    >
      <p className="mb-1 font-semibold">Dein Update-Zeitraum endet am {expiryFormatted}</p>
      <p className="leading-relaxed">
        Danach behältst du deinen vollen Lese-Zugang. Updates sind dann nicht mehr eingeschlossen.
        Optional:{" "}
        <Link href="/account/renewal" className="font-semibold underline">
          für 19 EUR/Jahr verlängern.
        </Link>
      </p>
    </div>
  );
}
