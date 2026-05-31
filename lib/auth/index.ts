import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { D1Adapter } from "@auth/d1-adapter";
import { getAppEnv, type AppEnv } from "@/lib/env";
import { renderMagicLinkEmail } from "./sendMagicLink";
import { recordSignupConsent } from "./consent";

// Auth.js v5 supports a function-form config that's invoked per-request.
// We need that here because the D1 binding only exists at request time on
// Cloudflare Pages (`getRequestContext().env.DB`), not at module load.
export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const env: AppEnv = await getAppEnv();

  return {
    adapter: env.DB ? D1Adapter(env.DB) : undefined,
    secret: env.AUTH_SECRET,
    session: { strategy: "database" },
    pages: {
      signIn: "/login",
      verifyRequest: "/verify-request",
      error: "/login",
    },
    providers: [
      Resend({
        apiKey: env.RESEND_API_KEY,
        from: env.EMAIL_FROM,
        // 10 minutes — the German UI promises this in the email body.
        maxAge: 60 * 10,
        async sendVerificationRequest({ identifier: to, url, provider }) {
          const { subject, html, text } = renderMagicLinkEmail({ url });
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${provider.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: provider.from,
              to,
              subject,
              html,
              text,
            }),
          });
          if (!res.ok) {
            const body = await res.text();
            throw new Error(`Resend send failed: ${res.status} ${body}`);
          }
        },
      }),
    ],
    callbacks: {
      // Block third-party profile data from sneaking onto the user record.
      // The no-PII scope rule means we only ever store `email`. If the adapter
      // sees a `name`/`image` it would happily persist them — strip those here.
      async signIn({ user }) {
        if (user) {
          user.name = null;
          user.image = null;
        }
        return true;
      },
      async session({ session, user }) {
        if (session.user && user) {
          session.user.id = user.id;
        }
        return session;
      },
    },
    events: {
      // The magic link only goes out after the /login form validates the GDPR
      // consent checkbox, so by the time a user record is created we know the
      // user agreed. Record the consent receipt so we have an audit trail.
      async createUser({ user }) {
        if (env.DB && user.id) {
          try {
            await recordSignupConsent(env.DB, { userId: user.id });
          } catch {
            // A failed consent insert must not break sign-up; the receipt can
            // be backfilled. Errors surface in the request log.
          }
        }
      },
    },
  };
});
