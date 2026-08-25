"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/buchwerk/spinner";
import {
  createProjectAction,
  type ProjectFormState,
} from "@/lib/books/actions";

const initialState: ProjectFormState = { error: null };

// Buchformat-Auswahl: Ratgeber (Fließtext) oder Workbook (Lektionen mit
// Übungen, Checklisten, Notizfeldern — Prompts + PDF/EPUB rendern das).
const BOOK_TYPES = [
  {
    value: "ratgeber",
    label: "Ratgeber / Sachbuch",
    hint: "Klassischer Fließtext",
  },
  {
    value: "workbook",
    label: "Workbook",
    hint: "Mit Übungen & Notizfeldern",
  },
] as const;

// Umfangswahl: steuert Kapitelzahl und Wortziele (lib/books/length.ts).
// Seitenangaben beziehen sich aufs KDP-Taschenbuch 5,5×8,5".
const LENGTH_OPTIONS = [
  {
    value: "kompakt",
    label: "Kompakt",
    seiten: "ca. 80 Seiten",
    hint: "Auf den Punkt — für klar umrissene Themen",
  },
  {
    value: "standard",
    label: "Standard",
    seiten: "ca. 130 Seiten",
    hint: "Ausgewachsener Ratgeber mit Tiefe",
  },
  {
    value: "premium",
    label: "Premium",
    seiten: "ca. 200 Seiten",
    hint: "Das umfassende Standardwerk deiner Nische",
  },
] as const;

export function NewProjectForm({
  defaultTopic,
  defaultAudience,
  defaultBookType,
}: {
  defaultTopic?: string;
  defaultAudience?: string;
  defaultBookType?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    initialState,
  );
  const initialBookType = defaultBookType === "workbook" ? "workbook" : "ratgeber";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Buchformat</legend>
        <div className="flex flex-wrap gap-2">
          {BOOK_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="buchtyp"
                value={type.value}
                defaultChecked={initialBookType === type.value}
                disabled={isPending}
                className="size-4 accent-primary"
              />
              <span>
                <span className="block font-medium">{type.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {type.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Umfang</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {LENGTH_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-2 rounded-xl border border-input bg-card px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="umfang"
                value={option.value}
                defaultChecked={option.value === "kompakt"}
                disabled={isPending}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span>
                <span className="block font-medium">
                  {option.label}
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {option.seiten}
                  </span>
                </span>
                <span className="block text-xs text-muted-foreground">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="topic">Worum soll dein Buch gehen?</Label>
        <textarea
          id="topic"
          name="topic"
          required
          disabled={isPending}
          rows={3}
          defaultValue={defaultTopic}
          placeholder="z. B. Ein Ratgeber für Hundehalter zur stressfreien Autofahrt mit Hund"
          className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="audience">Zielgruppe (optional)</Label>
        <Input
          id="audience"
          name="audience"
          disabled={isPending}
          defaultValue={defaultAudience}
          placeholder="z. B. Erst-Hundebesitzer ab 50"
          className="h-11 px-4 text-base"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="h-auto min-h-11 whitespace-normal px-5 py-2.5 text-base"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="size-4" />
            Gliederung wird erstellt… (kann ~20 Sek. dauern)
          </span>
        ) : (
          "Projekt anlegen & Gliederung erstellen"
        )}
      </Button>
    </form>
  );
}
