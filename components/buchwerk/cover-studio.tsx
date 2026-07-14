"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/buchwerk/spinner";
import {
  suggestCoverPromptAction,
  selectCoverAction,
  deleteCoverAction,
  updateProjectAuthorAction,
  updateCoverTitleStyleAction,
  updateBlurbAction,
} from "@/lib/books/cover-actions";
import type { CoverModel } from "@/lib/ai/replicate";
import {
  COVER_POSITIONS,
  COVER_TONES,
  parseCoverStyle,
  buildCoverStyle,
  normalizeCoverTitleStyle,
  bandColorFromMain,
  bandTitleColor,
  bandAuthorColor,
  rgbCss,
  NEUTRAL_MAIN,
  type RGB,
} from "@/lib/books/cover-style";

const TEXTAREA_CLASS =
  "flex w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

// After this long without the new cover appearing we stop waiting and offer a
// retry — the generation almost certainly failed or was killed.
const COVER_TIMEOUT_MS = 120_000;

type Cover = {
  id: string;
  image_url: string;
  model: string | null;
  is_selected: boolean;
};

export function CoverStudio({
  projectId,
  title,
  author,
  titleStyle,
  blurb,
  covers,
}: {
  projectId: string;
  title: string;
  author: string;
  titleStyle: string;
  blurb: string;
  covers: Cover[];
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<CoverModel>("schnell");
  const [authorValue, setAuthorValue] = useState(author);
  const [blurbValue, setBlurbValue] = useState(blurb);
  const [style, setStyle] = useState<string>(
    normalizeCoverTitleStyle(titleStyle),
  );
  // Dominant colour of the selected cover motif, sampled client-side, so the
  // preview band matches what the PDF derives. Null until sampled / on failure.
  const [motifColor, setMotifColor] = useState<RGB | null>(null);
  const [isPending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cover count when the current generation started; generation is "done" once
  // the list grows past it (the new row was inserted).
  const startCountRef = useRef<number | null>(null);

  const busy = isPending || generating;
  const selectedCover = covers.find((c) => c.is_selected);
  const hasSelected = Boolean(selectedCover);

  // Detect completion: a new cover appeared.
  useEffect(() => {
    if (
      generating &&
      startCountRef.current !== null &&
      covers.length > startCountRef.current
    ) {
      setGenerating(false);
      startCountRef.current = null;
    }
  }, [covers.length, generating]);

  // Sample the selected motif's dominant colour so the preview band uses the
  // same shade the PDF derives. Best-effort: if the image is CORS-tainted we
  // fall back to a neutral tone.
  const selectedUrl = selectedCover?.image_url;
  useEffect(() => {
    if (!selectedUrl) return;
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setMotifColor({ r: r / 255, g: g / 255, b: b / 255 });
      } catch {
        setMotifColor(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) setMotifColor(null);
    };
    img.src = selectedUrl;
    return () => {
      cancelled = true;
    };
  }, [selectedUrl]);

  // While generating, re-fetch the page so the new cover shows up on its own —
  // even if the generate request never returned.
  useEffect(() => {
    if (!generating) return;
    const poll = setInterval(() => router.refresh(), 4000);
    const giveUp = setTimeout(() => {
      setGenerating(false);
      startCountRef.current = null;
      setError(
        "Das Cover ist nicht rechtzeitig fertig geworden. Bitte erneut versuchen.",
      );
    }, COVER_TIMEOUT_MS);
    return () => {
      clearInterval(poll);
      clearTimeout(giveUp);
    };
  }, [generating, router]);

  function suggest() {
    setError(null);
    startTransition(async () => {
      const result = await suggestCoverPromptAction(projectId);
      if (result.ok && result.prompt) setPrompt(result.prompt);
      else setError(result.error ?? "Konnte keinen Vorschlag erstellen.");
    });
  }

  function generate() {
    setError(null);
    startCountRef.current = covers.length;
    setGenerating(true);
    (async () => {
      try {
        const res = await fetch(`/api/projekte/${projectId}/cover`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt, model }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(data?.error ?? "Das Cover konnte nicht erstellt werden.");
          setGenerating(false);
          startCountRef.current = null;
        }
      } catch {
        // Request dropped (long generation past the gateway limit). The poll and
        // completion effect / timeout take over from here.
      } finally {
        router.refresh();
      }
    })();
  }

  function saveAuthor() {
    setError(null);
    startTransition(async () => {
      const result = await updateProjectAuthorAction(projectId, authorValue);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  function saveBlurb() {
    setError(null);
    startTransition(async () => {
      const result = await updateBlurbAction(projectId, blurbValue);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  function chooseStyle(next: string) {
    setStyle(next); // optimistic — the preview updates immediately
    setError(null);
    startTransition(async () => {
      const result = await updateCoverTitleStyleAction(projectId, next);
      if (!result.ok) setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  // Persist the current author + Klappentext, then trigger the PDF download — so
  // whatever is typed always lands on the cover, without a separate save step.
  function downloadCover() {
    setError(null);
    startTransition(async () => {
      const [authorRes, blurbRes] = await Promise.all([
        updateProjectAuthorAction(projectId, authorValue),
        updateBlurbAction(projectId, blurbValue),
      ]);
      const result = !authorRes.ok ? authorRes : blurbRes;
      if (!result.ok) {
        setError(result.error ?? "Etwas ist schiefgelaufen.");
        return;
      }
      window.location.href = `/projekte/${projectId}/cover/pdf`;
    });
  }

  function select(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await selectCoverAction(id);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  function remove(id: string) {
    if (!window.confirm("Dieses Cover wirklich löschen?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCoverAction(id);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Etwas ist schiefgelaufen.");
    });
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-7">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="cover-prompt">Bildbeschreibung (Prompt)</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={suggest}
              disabled={busy}
            >
              Vorschlag von der KI
            </Button>
          </div>
          <textarea
            id="cover-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={busy}
            rows={4}
            placeholder="Englischer Bildprompt – oder lass dir oben einen Vorschlag erstellen."
            className={TEXTAREA_CLASS}
          />
          <p className="text-xs text-muted-foreground">
            Beschreibe nur das <span className="font-medium">Motiv</span> —
            textfrei, ohne Buchstaben. Titel und Autor legt Buchwerk anschließend
            als saubere Typografie über das Bild.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Qualität</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="model"
                checked={model === "schnell"}
                onChange={() => setModel("schnell")}
                disabled={busy}
                className="size-4 accent-primary"
              />
              Entwurf (schnell, ~10 Sek.)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="model"
                checked={model === "pro"}
                onChange={() => setModel("pro")}
                disabled={busy}
                className="size-4 accent-primary"
              />
              Final (beste Qualität, ~30 Sek.)
            </label>
          </div>
        </fieldset>

        {generating ? (
          <div className="flex items-center gap-2 text-sm font-medium text-clay-strong">
            <Spinner className="size-4" />
            Cover wird erstellt… (kann ~30 Sek. dauern)
          </div>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={generate}
            disabled={busy || !prompt.trim()}
          >
            Cover generieren
          </Button>
        )}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Entwürfe</h2>
        {covers.length === 0 && !generating ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Noch keine Cover. Generiere oben dein erstes.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3">
            {generating ? (
              <li className="space-y-2">
                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted">
                  <Spinner className="size-6 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Wird erstellt…</p>
              </li>
            ) : null}
            {covers.map((cover) => (
              <li key={cover.id} className="space-y-2">
                <div
                  className={
                    cover.is_selected
                      ? "overflow-hidden rounded-lg ring-2 ring-primary"
                      : "overflow-hidden rounded-lg border border-border"
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover.image_url}
                    alt="Cover-Entwurf"
                    className="aspect-[2/3] w-full object-cover"
                  />
                </div>
                {cover.is_selected ? (
                  <p className="text-xs font-medium text-primary">
                    Ausgewählt ✓
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => select(cover.id)}
                  >
                    Als Cover wählen
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => remove(cover.id)}
                >
                  Löschen
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">
          Fertiges Cover-PDF
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vorderseite mit Titel + Autor. Die Rückseite übernimmt die Hauptfarbe
          des Covers, zeigt den Klappentext aus dem KDP-Listing und hält unten
          rechts den Bereich frei, in den Amazon den Barcode druckt.
        </p>

        {selectedCover ? (
          <div className="mt-4">
            {(() => {
              const { position, tone } = parseCoverStyle(style);
              const setPosition = (p: string) =>
                chooseStyle(buildCoverStyle(parseCoverStyle(`${p}-${tone}`).position, tone));
              const setTone = (t: string) =>
                chooseStyle(buildCoverStyle(position, parseCoverStyle(`${position}-${t}`).tone));
              const pill = (active: boolean) =>
                `rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`;
              const main = motifColor ?? NEUTRAL_MAIN;
              const bandCss = rgbCss(bandColorFromMain(main, tone));
              const titleCss = rgbCss(bandTitleColor(tone));
              const authorCss = rgbCss(bandAuthorColor(tone));
              return (
                <>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div>
                      <p className="mb-1.5 text-sm font-medium">Position</p>
                      <div className="flex gap-2">
                        {COVER_POSITIONS.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => setPosition(o.value)}
                            aria-pressed={position === o.value}
                            className={pill(position === o.value)}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium">Ton</p>
                      <div className="flex gap-2">
                        {COVER_TONES.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => setTone(o.value)}
                            aria-pressed={tone === o.value}
                            className={pill(tone === o.value)}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mb-2 mt-4 text-sm font-medium">
                    So sieht die Vorderseite aus:
                  </p>
                  <div className="relative w-full max-w-[220px] overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedCover.image_url}
                      alt="Cover-Vorschau"
                      className="aspect-[2/3] w-full object-cover"
                    />
                    <div
                      className={`absolute inset-x-0 px-3 pb-3 pt-3.5 ${
                        position === "oben" ? "top-0" : "bottom-0"
                      }`}
                      style={{ backgroundColor: bandCss }}
                    >
                      <span className="block h-[3px] w-8 rounded-full bg-primary" />
                      <p
                        className="font-display mt-2 text-sm font-bold leading-tight"
                        style={{ color: titleCss }}
                      >
                        {title}
                      </p>
                      {authorValue.trim() ? (
                        <p
                          className="mt-1 text-[11px]"
                          style={{ color: authorCss }}
                        >
                          {authorValue.trim()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Vorschau — im PDF exakt gesetzt. Die Balkenfarbe ist aus dem
                    Motiv abgeleitet (heller oder dunkler Ton).
                  </p>
                </>
              );
            })()}
          </div>
        ) : null}

        <div className="mt-4 max-w-sm space-y-1">
          <Label htmlFor="author">Autor (erscheint auf dem Cover)</Label>
          <div className="flex gap-2">
            <Input
              id="author"
              value={authorValue}
              onChange={(event) => setAuthorValue(event.target.value)}
              disabled={busy}
              placeholder="Dein Name"
              className="h-10"
            />
            <Button
              type="button"
              variant="outline"
              onClick={saveAuthor}
              disabled={busy}
            >
              Speichern
            </Button>
          </div>
        </div>

        <div className="mt-5 max-w-xl space-y-1">
          <Label htmlFor="blurb">Klappentext (Rückseite)</Label>
          <p className="text-xs text-muted-foreground">
            Der Text für die Buchrückseite. Er ist derselbe wie die
            KDP-Beschreibung — was du hier schreibst, steht später im Listing
            schon bereit.
          </p>
          <textarea
            id="blurb"
            value={blurbValue}
            onChange={(event) => setBlurbValue(event.target.value)}
            disabled={busy}
            rows={5}
            placeholder="Worum geht es im Buch? 3–6 Sätze, die neugierig machen."
            className={TEXTAREA_CLASS}
          />
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={saveBlurb}
              disabled={busy}
            >
              Klappentext speichern
            </Button>
          </div>
        </div>

        <div className="mt-5">
          {hasSelected ? (
            <Button
              type="button"
              size="lg"
              variant="ink"
              onClick={downloadCover}
              disabled={busy}
            >
              Cover-PDF herunterladen
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Wähle oben einen Entwurf als Cover, dann kannst du das PDF
              herunterladen.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
