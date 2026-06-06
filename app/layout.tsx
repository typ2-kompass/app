import type { Metadata } from "next";
import Link from "next/link";
import Analytics from "@/components/Analytics";
import { de } from "@/lib/i18n/messages/de";
import "./globals.css";

export const metadata: Metadata = {
  title: "Typ2-Kompass — Dein Begleiter bei Typ-2-Diabetes",
  description:
    "Typ2-Kompass begleitet Menschen mit Typ-2-Diabetes auf dem Weg zu mehr Selbstverantwortung — mit verständlichen Inhalten, Reflexionsimpulsen und digitalen Werkzeugen.",
  metadataBase: new URL("https://typ2-kompass.de"),
  openGraph: {
    title: "Typ2-Kompass — Dein Begleiter bei Typ-2-Diabetes",
    description:
      "Typ2-Kompass begleitet Menschen mit Typ-2-Diabetes auf dem Weg zu mehr Selbstverantwortung.",
    url: "https://typ2-kompass.de",
    siteName: "Typ2-Kompass",
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <html lang="de">
      <body>
        {children}
        <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
          <p className="mb-1">{de.footer.rights.replace("{year}", String(year))}</p>
          <nav className="flex justify-center gap-4">
            <Link href="/datenschutz" className="hover:underline">
              {de.footer.privacy}
            </Link>
          </nav>
        </footer>
      </body>
      <Analytics />
    </html>
  );
}
