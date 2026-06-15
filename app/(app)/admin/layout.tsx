import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminUser } from "@/lib/admin/access";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Non-admins shouldn't even learn this area exists.
  const admin = await getAdminUser();
  if (!admin) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Admin
        </span>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Zum Dashboard
        </Link>
      </div>
      <nav className="mt-4 flex flex-wrap gap-4 border-b border-border pb-4 text-sm">
        {[
          { href: "/admin", label: "Übersicht" },
          { href: "/admin/posteingang", label: "Posteingang" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
