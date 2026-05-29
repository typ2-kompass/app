import type { Metadata } from "next";
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
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
