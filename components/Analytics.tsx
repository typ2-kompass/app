import Script from "next/script";

// Plausible Cloud EU, proxied through Cloudflare Pages functions to dodge
// content blockers. The script no-ops at runtime if NEXT_PUBLIC_PLAUSIBLE_DOMAIN
// is absent (e.g. preview deploys without the env var) — analytics goes dark,
// the rest of the app keeps working.
//
// Why a manual stub for window.plausible: Plausible's auto-injected queue stub
// lives inline in the script tag, but custom events fire before the script
// finishes loading on slow connections. The stub below buffers calls so the
// first signup_started after a cold load is not silently dropped.

const STUB = `window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`;

export default function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  return (
    <>
      <Script
        id="plausible-script"
        strategy="afterInteractive"
        defer
        data-domain={domain}
        data-api="/api/event"
        src="/js/script.js"
      />
      <Script id="plausible-stub" strategy="afterInteractive">
        {STUB}
      </Script>
    </>
  );
}
