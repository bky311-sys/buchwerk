"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/buchwerk/status-badge";
import { updateImprintAction } from "@/lib/books/imprint-actions";

type Props = {
  projectId: string;
  name: string;
  street: string;
  zip: string;
  city: string;
};

export function ImprintForm({ projectId, name, street, zip, city }: Props) {
  const router = useRouter();
  const [nameValue, setName] = useState(name);
  const [streetValue, setStreet] = useState(street);
  const [zipValue, setZip] = useState(zip);
  const [cityValue, setCity] = useState(city);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = [nameValue, streetValue, zipValue, cityValue].every((v) =>
    v.trim(),
  );

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateImprintAction(projectId, {
        name: nameValue,
        street: streetValue,
        zip: zipValue,
        city: cityValue,
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error ?? "Etwas ist schiefgelaufen.");
      }
    });
  }

  return (
    <section
      id="impressum"
      className="scroll-mt-6 rounded-2xl border border-border bg-card p-6 sm:p-7"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="font-display text-lg font-semibold">
          Impressum
        </h2>
        {complete ? (
          <StatusBadge intent="done">✓ Vollständig</StatusBadge>
        ) : (
          <StatusBadge intent="error">Pflichtangabe fehlt</StatusBadge>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Bücher, die in Deutschland verkauft werden, brauchen ein Impressum mit
        Name und Anschrift des Verantwortlichen. Diese Angaben erscheinen auf
        einer Impressumsseite in deinem Manuskript und sind Pflicht, bevor du das
        Manuskript-PDF herunterlädst.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="imp-name">Name (Autor / Verantwortlicher)</Label>
          <Input
            id="imp-name"
            value={nameValue}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            placeholder="Vor- und Nachname"
            className="h-10"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="imp-street">Straße & Hausnummer</Label>
          <Input
            id="imp-street"
            value={streetValue}
            onChange={(e) => setStreet(e.target.value)}
            disabled={isPending}
            placeholder="Musterstraße 12"
            className="h-10"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="imp-zip">PLZ</Label>
          <Input
            id="imp-zip"
            value={zipValue}
            onChange={(e) => setZip(e.target.value)}
            disabled={isPending}
            inputMode="numeric"
            placeholder="12345"
            className="h-10"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="imp-city">Ort</Label>
          <Input
            id="imp-city"
            value={cityValue}
            onChange={(e) => setCity(e.target.value)}
            disabled={isPending}
            placeholder="Musterstadt"
            className="h-10"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={save} disabled={isPending}>
          {isPending ? "Speichern…" : "Impressum speichern"}
        </Button>
        {saved ? (
          <span role="status" className="text-sm text-success">
            Gespeichert.
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">
        Hinweis: Für ein in Deutschland verkauftes Buch ist eine ladungsfähige
        Anschrift vorgeschrieben. Ein Postfach reicht nicht.
      </p>
    </section>
  );
}
