export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-100 px-6 py-10 text-center text-sm text-slate-400">
      <p>© {year} Typ2-Kompass. Alle Rechte vorbehalten.</p>
      <p className="mt-2">
        <a href="/impressum" className="hover:text-kompass-accent">
          Impressum
        </a>{" "}
        ·{" "}
        <a href="/datenschutz" className="hover:text-kompass-accent">
          Datenschutz
        </a>
      </p>
      <p className="mt-3 text-xs text-slate-300">
        Hinweis: Typ2-Kompass ersetzt keine ärztliche Beratung. Wir bieten Bildung und
        Reflexion, keine medizinische Diagnose oder Therapie.
      </p>
    </footer>
  );
}
