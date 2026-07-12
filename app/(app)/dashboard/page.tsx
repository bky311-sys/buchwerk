import { redirect } from "next/navigation";

// The dashboard was a thin dead-stop between login and the actual workspace.
// Send users straight to their projects, where they can start or continue a book.
export default function DashboardPage() {
  redirect("/projekte");
}
