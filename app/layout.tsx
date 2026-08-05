import type { Metadata } from "next";
import Script from "next/script";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://buchwerk.info";

const TITLE = "Buchwerk — Dein Buch mit KI schreiben und veröffentlichen";
const DESCRIPTION =
  "Schreib dein Buch mit KI: Buchwerk recherchiert dein Thema im Web, schreibt ein vollständiges Manuskript, gestaltet das Cover und liefert das fertige Amazon-KDP-Listing — auf Deutsch, kein Abo-Zwang.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // Selbstreferenzierendes Canonical pro Seite ("./" = aktueller Pfad) —
  // Google hatte die Seite u. a. unter www. indexiert; zusammen mit dem
  // www-Redirect macht das die Nicht-www-URLs zur eindeutigen Referenz.
  alternates: { canonical: "./" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Buchwerk",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  // Grunddaten für Suchmaschinen: Website + Betreiber. Seiten-spezifische
  // Schemas (FAQ auf der Landing, Book im Buchshop) liegen bei den Seiten.
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Buchwerk",
    url: SITE_URL,
    inLanguage: "de",
    description: DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: "Buchwerk",
      url: SITE_URL,
    },
  };

  return (
    <html lang="de" className="h-full">
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {children}
        {/* Privacy-friendly analytics (no cookies, DSGVO). Loads only when a
            domain is configured, so it stays off until explicitly enabled. */}
        {plausibleDomain ? (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
