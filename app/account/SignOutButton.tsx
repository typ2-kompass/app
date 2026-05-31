"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/login/actions";
import { de } from "@/lib/i18n/messages/de";

function Button() {
  const { pending } = useFormStatus();
  const t = de.auth.account;
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
    >
      {pending ? t.signOutSubmitting : t.signOut}
    </button>
  );
}

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button />
    </form>
  );
}
