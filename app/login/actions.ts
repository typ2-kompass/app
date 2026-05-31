"use server";

import { signIn, signOut } from "@/lib/auth";

export type LoginActionState = {
  ok?: boolean;
  error?: "invalid_email" | "consent_missing" | "generic";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function startMagicLink(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const consent = formData.get("consent") === "on";

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "invalid_email" };
  }
  if (!consent) {
    return { error: "consent_missing" };
  }

  try {
    await signIn("resend", {
      email,
      redirect: true,
      redirectTo: "/verify-request",
    });
  } catch (err) {
    // Auth.js throws a NEXT_REDIRECT to bounce the user to /verify-request.
    // Re-throw it so Next handles the redirect; only swallow real failures.
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest: unknown }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    return { error: "generic" };
  }

  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirect: true, redirectTo: "/login" });
}
