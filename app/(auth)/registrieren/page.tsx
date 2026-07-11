import type { Metadata } from "next";
import { RegisterForm } from "@/components/buchwerk/register-form";

export const metadata: Metadata = {
  title: "Registrieren — Buchwerk",
};

export default async function RegistrierenPage({
  searchParams,
}: {
  searchParams: Promise<{ thema?: string }>;
}) {
  const { thema } = await searchParams;
  const topic = typeof thema === "string" ? thema.trim().slice(0, 300) : "";
  // Carry the captured topic into the first project after signup.
  const weiter = topic
    ? `/projekte?thema=${encodeURIComponent(topic)}`
    : "/dashboard";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Konto erstellen
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {topic
          ? "Leg schnell dein Konto an — danach erstellen wir kostenlos deine Gliederung."
          : "Starte dein erstes Buchprojekt mit Buchwerk."}
      </p>

      {topic ? (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Dein Thema
          </p>
          <p className="mt-1 text-sm text-foreground">{topic}</p>
        </div>
      ) : null}

      <div className="mt-6">
        <RegisterForm weiter={weiter} />
      </div>
    </div>
  );
}
