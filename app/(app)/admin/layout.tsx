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
      {children}
    </div>
  );
}
