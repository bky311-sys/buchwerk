import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block text-center text-sm font-medium tracking-tight text-muted-foreground transition-colors hover:text-foreground"
        >
          Buchwerk
        </Link>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
