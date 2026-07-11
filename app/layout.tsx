import type { Metadata } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buchwerk — Vom Thema zum fertigen Buch",
  description:
    "Die deutschsprachige KI-Plattform fürs Self-Publishing: Manuskript, Cover und KDP-Listing in einem Workflow. Thema und Gliederung gratis, kein Abo-Zwang.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
