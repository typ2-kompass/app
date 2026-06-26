import { de } from "@/lib/i18n/messages/de";
import { formatGermanDate } from "@/lib/billing/entitlement";

interface Props {
  revokedAt: string;
}

export default function RefundGraceBanner({ revokedAt }: Props) {
  const t = de.auth.refund;
  const date = formatGermanDate(revokedAt);
  const body = t.graceBody
    .replace("{date}", date)
    .replace(
      "{support}",
      `<a class="font-semibold underline" href="mailto:${t.supportEmail}">${t.supportEmail}</a>`,
    );

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
      data-testid="refund-grace-banner"
    >
      <p className="mb-1 font-semibold">{t.graceHeading}</p>
      <p
        className="leading-relaxed"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}
