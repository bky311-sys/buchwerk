import Link from "next/link";
import { Wordmark } from "@/components/buchwerk/wordmark";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="flex justify-center"
          aria-label="buchwerk – Startseite"
        >
          <Wordmark />
        </Link>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
