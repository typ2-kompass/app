"use client";

interface UpdateBadgeProps {
  /** YYYY-MM-DD — the date the content was updated/added. */
  date: string;
  isNew?: boolean;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Renders "Neu YYYY-MM-DD" or "Aktualisiert YYYY-MM-DD" for 30 days, then nothing. */
export default function UpdateBadge({ date, isNew = false }: UpdateBadgeProps) {
  const updated = new Date(date);
  const age = Date.now() - updated.getTime();
  if (age > THIRTY_DAYS_MS) return null;

  const label = isNew ? "Neu" : "Aktualisiert";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-kompass-accent/10 px-2.5 py-0.5 text-xs font-semibold text-kompass-accent">
      {label} {date}
    </span>
  );
}
