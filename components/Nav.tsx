import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-kompass-ink">
          Typ2-Kompass
        </Link>
        <div className="hidden gap-6 text-sm font-medium text-slate-600 sm:flex">
          <a href="#system" className="hover:text-kompass-accent">
            Das System
          </a>
          <a href="#warteliste" className="hover:text-kompass-accent">
            Warteliste
          </a>
        </div>
        <a
          href="#warteliste"
          className="rounded-lg bg-kompass-accent px-4 py-2 text-sm font-semibold text-white hover:bg-kompass-accentDark"
        >
          Jetzt eintragen
        </a>
      </div>
    </nav>
  );
}
