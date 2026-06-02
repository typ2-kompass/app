// Client-side error trigger for Sentry verification. Renders an error after
// mount when the URL has ?key=<DEBUG_THROW_KEY> and the value matches. The
// browser Sentry SDK's global error handler captures it with a stack trace
// that maps back to TypeScript via the uploaded source maps.

"use client";

import { useEffect, useState } from "react";

export default function DebugThrowPage() {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const supplied = url.searchParams.get("key");
    const expected = process.env.NEXT_PUBLIC_DEBUG_THROW_KEY;
    if (expected && supplied === expected) {
      setArmed(true);
    }
  }, []);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => {
      throw new Error(
        `typ2-kompass /dev-throw at ${new Date().toISOString()} — verifying client error reporting wiring`,
      );
    }, 50);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <main className="mx-auto max-w-md p-8 text-sm text-slate-500">
      {armed
        ? "Triggering error in 50ms — check Sentry."
        : "404 — not found."}
    </main>
  );
}
