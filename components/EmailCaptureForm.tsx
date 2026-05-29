"use client";

import { useState } from "react";

type State = "idle" | "submitting" | "success" | "error";

export default function EmailCaptureForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Bitte gib eine gültige E-Mail-Adresse ein.");
      setState("error");
      return;
    }
    setState("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("server");
      setState("success");
    } catch {
      setErrorMsg("Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <p className="rounded-xl bg-teal-50 px-6 py-4 text-kompass-accent font-medium">
        Danke! Wir melden uns, sobald es losgeht.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="email" className="sr-only">
        E-Mail-Adresse
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state === "error") setState("idle");
        }}
        placeholder="name@beispiel.de"
        required
        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-kompass-ink placeholder-slate-400 focus:border-kompass-accent focus:outline-none focus:ring-2 focus:ring-kompass-accent/20"
      />
      <button
        type="submit"
        disabled={state === "submitting"}
        className="rounded-xl bg-kompass-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-kompass-accentDark disabled:opacity-60"
      >
        {state === "submitting" ? "Wird gesendet…" : "Benachrichtigt mich"}
      </button>
      {state === "error" && (
        <p className="w-full text-sm text-red-500">{errorMsg}</p>
      )}
    </form>
  );
}
