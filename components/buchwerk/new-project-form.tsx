"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProjectAction,
  type ProjectFormState,
} from "@/lib/books/actions";

const initialState: ProjectFormState = { error: null };

export function NewProjectForm() {
  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="topic">Worum soll dein Buch gehen?</Label>
        <textarea
          id="topic"
          name="topic"
          required
          disabled={isPending}
          rows={3}
          placeholder="z. B. Ein Ratgeber für Hundehalter zur stressfreien Autofahrt mit Hund"
          className="flex w-full rounded-lg border border-input bg-background px-4 py-3 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="audience">Zielgruppe (optional)</Label>
        <Input
          id="audience"
          name="audience"
          disabled={isPending}
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
        className="h-11 px-5 text-base"
      >
        {isPending
          ? "Gliederung wird erstellt… (kann ~20 Sek. dauern)"
          : "Projekt anlegen & Gliederung erstellen"}
      </Button>
    </form>
  );
}
