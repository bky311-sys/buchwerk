import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buchwerk.info — KI-gestütztes Self-Publishing",
  description:
    "Vom Thema bis zum KDP-fertigen Buch in einem Workflow. Deutschsprachige Plattform für Self-Publishing mit KI.",
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
