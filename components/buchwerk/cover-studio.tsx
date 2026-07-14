"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/buchwerk/spinner";
import {
  suggestCoverPromptAction,
  refineCoverPromptAction,
  suggestBlurbAction,
  selectCoverAction,
  deleteCoverAction,
  updateProjectAuthorAction,
  updateCoverTitleStyleAction,
  updateBlurbAction,
} from "@/lib/books/cover-actions";
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
  const [feedbackValue, setFeedbackValue] = useState("");
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
  // the list has grown (the new row was inserted).
  const startCountRef = useRef<number | null>(null);

  const busy = isPending || generating;
  const selectedCover = covers.find((c) => c.is_selected);
  const hasSelected = Boolean(selectedCover);

  // Detect completion: the new motif appeared.
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

  function refinePrompt() {
    if (!prompt.trim() || !feedbackValue.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await refineCoverPromptAction(prompt, feedbackValue);
      if (result.ok && result.prompt) {
        setPrompt(result.prompt);
        setFeedbackValue("");
      } else {
        setError(result.error ?? "Konnte den Prompt nicht anpassen.");
      }
    });
  }

  function suggestBlurb() {
    setError(null);
    startTransition(async () => {
      const result = await suggestBlurbAction(projectId);
      if (result.ok && result.blurb) setBlurbValue(result.blurb);
      else setError(result.error ?? "Konnte keinen Klappentext erstellen.");
    });
  }

  // Generate one motif in final quality. Same prompt yields near-identical Flux
  // images, so a batch of 4 adds no variety — instead the author iterates: tweak
  // the prompt (or use "Motiv anpassen"), then generate again.
  function generate() {
    setError(null);
    startCountRef.current = covers.length;
    setGenerating(true);
    (async () => {
      try {
        const res = await fetch(`/api/projekte/${projectId}/cover`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt, model: "pro" }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(data?.error ?? "Das Motiv konnte nicht erstellt werden.");
          setGenerating(false);
          startCountRef.current = null;
        }
      } catch {
        // Dropped (long generation past the gateway limit). The poll + completion
        // effect / timeout take over from here.
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

  // Render the front cover (motif + title band) to a JPG and download it. KDP
  // wants the cover as a JPG image (never a PDF) — this composites the same way
  // the preview does, client-side on a canvas (no server rasteriser needed).
  function downloadCoverImage() {
    if (!selectedCover) return;
    setError(null);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
        const W = 1600;
        const H = Math.round((W * 3) / 2); // 2:3, matches the Flux motif
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no ctx");

        // Motif fills the whole canvas (object-cover).
        const scale = Math.max(W / img.width, H / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

        const { position, tone } = parseCoverStyle(style);
        const main = motifColor ?? NEUTRAL_MAIN;
        const bandColor = rgbCss(bandColorFromMain(main, tone));
        const titleColor = rgbCss(bandTitleColor(tone));
        const authorColor = rgbCss(bandAuthorColor(tone));

        const pad = 96;
        const titleSize = 84;
        const titleLh = 104;
        ctx.textBaseline = "top";

        // Wrap the title to the band width.
        ctx.font = `700 ${titleSize}px "Bricolage Grotesque", sans-serif`;
        const lines: string[] = [];
        let line = "";
        for (const word of title.split(/\s+/).filter(Boolean)) {
          const cand = line ? `${line} ${word}` : word;
          if (ctx.measureText(cand).width > W - 2 * pad && line) {
            lines.push(line);
            line = word;
          } else {
            line = cand;
          }
        }
        if (line) lines.push(line);

        const authorText = authorValue.trim();
        const authorSize = 46;
        const bandH = Math.min(
          H * 0.5,
          64 + lines.length * titleLh + 48 + (authorText ? authorSize + 40 : 0),
        );
        const bandY = position === "oben" ? 0 : H - bandH;

        ctx.fillStyle = bandColor;
        ctx.fillRect(0, bandY, W, bandH);
        ctx.fillStyle = "rgb(28, 107, 67)"; // accent strip on the inner edge
        ctx.fillRect(0, position === "oben" ? bandY + bandH : bandY - 8, W, 8);

        ctx.fillStyle = titleColor;
        ctx.font = `700 ${titleSize}px "Bricolage Grotesque", sans-serif`;
        let ty = bandY + 64;
        for (const l of lines) {
          ctx.fillText(l, pad, ty);
          ty += titleLh;
        }
        if (authorText) {
          ctx.fillStyle = authorColor;
          ctx.font = `500 ${authorSize}px "Instrument Sans", sans-serif`;
          ctx.fillText(authorText, pad, bandY + bandH - authorSize - 44);
        }

        const slug =
          (title.trim() || "buch")
            .toLowerCase()
            .replace(/[äöü]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue" })[c] ?? c)
            .replace(/ß/g, "ss")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "cover";
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/jpeg", 0.92);
        a.download = `${slug}-cover.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        setError(
          "Cover-Bild konnte nicht erstellt werden. Lad die Seite neu und versuch es nochmal.",
        );
      }
    };
    img.onerror = () =>
      setError("Cover-Bild nicht erreichbar. Versuch es gleich nochmal.");
    img.src = selectedCover.image_url;
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

        <div className="space-y-1.5">
          <Label htmlFor="cover-feedback">Motiv anpassen (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="cover-feedback"
              value={feedbackValue}
              onChange={(event) => setFeedbackValue(event.target.value)}
              disabled={busy || !prompt.trim()}
              placeholder="z. B. weniger Gold, echte Goldwaschpfanne mit Riffeln"
              className="h-10"
            />
            <Button
              type="button"
              variant="outline"
              onClick={refinePrompt}
              disabled={busy || !prompt.trim() || !feedbackValue.trim()}
            >
              Prompt anpassen
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Sag in Stichworten, was am Motiv anders soll — die KI überarbeitet den
            Prompt. Danach neu erzeugen.
          </p>
        </div>

        {generating ? (
          <div className="flex items-center gap-2 text-sm font-medium text-clay-strong">
            <Spinner className="size-4" />
            Motiv wird erstellt… (~30 Sek.)
          </div>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={generate}
            disabled={busy || !prompt.trim()}
          >
            {covers.length > 0 ? "Neues Motiv erzeugen" : "Motiv erzeugen"}
          </Button>
        )}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">
          1 · Motiv wählen
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Erzeuge Motive, passe den Prompt zwischendurch an und wähle das beste.
          Den Titel-Look legst du danach fest — Bild und Text bleiben getrennt.
        </p>
        {covers.length === 0 && !generating ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Noch kein Motiv. Erzeuge oben dein erstes.
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
                    Motiv gewählt ✓
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => select(cover.id)}
                  >
                    Dieses Motiv wählen
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

      {selectedCover ? (
        <section className="border-t border-border pt-6">
          <h2 className="font-display text-lg font-semibold">2 · Look wählen</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dasselbe Motiv mit vier Titel-Varianten — Position (oben/unten) und
            Farbe (hell/dunkel, aus dem Motiv abgeleitet). Wähle deinen Favoriten.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {COVER_POSITIONS.flatMap((p) =>
              COVER_TONES.map((t) => {
                const value = buildCoverStyle(p.value, t.value);
                const active = style === value;
                const main = motifColor ?? NEUTRAL_MAIN;
                const bandCss = rgbCss(bandColorFromMain(main, t.value));
                const titleCss = rgbCss(bandTitleColor(t.value));
                return (
                  <li key={value}>
                    <button
                      type="button"
                      onClick={() => chooseStyle(value)}
                      aria-pressed={active}
                      className={`block w-full overflow-hidden rounded-lg border text-left transition-colors ${
                        active
                          ? "border-primary ring-2 ring-primary"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedCover.image_url}
                          alt=""
                          className="aspect-[2/3] w-full object-cover"
                        />
                        <div
                          className={`absolute inset-x-0 px-2 pb-2 pt-2 ${
                            p.value === "oben" ? "top-0" : "bottom-0"
                          }`}
                          style={{ backgroundColor: bandCss }}
                        >
                          <p
                            className="font-display text-[11px] font-bold leading-tight"
                            style={{ color: titleCss }}
                          >
                            {title}
                          </p>
                        </div>
                      </div>
                      <span className="block px-2 py-1.5 text-xs text-muted-foreground">
                        {p.label} · {t.label}
                        {active ? " ✓" : ""}
                      </span>
                    </button>
                  </li>
                );
              }),
            )}
          </ul>
        </section>
      ) : null}

      <section className="border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">
          3 · Feinschliff &amp; Download
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Autor und Klappentext (Rückseite), dann das fertige Cover-PDF mit
          Vorder- und Rückseite. Unten rechts bleibt der Bereich für den
          Amazon-Barcode frei.
        </p>

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
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="blurb">Klappentext (Rückseite)</Label>
            <button
              type="button"
              onClick={suggestBlurb}
              disabled={busy}
              className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 disabled:opacity-50"
            >
              {busy ? "…" : "Vorschlag von der KI"}
            </button>
          </div>
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
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="lg"
                  variant="ink"
                  onClick={downloadCoverImage}
                  disabled={busy}
                >
                  Cover-Bild (JPG) herunterladen
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={downloadCover}
                  disabled={busy}
                >
                  Cover-PDF (nur Taschenbuch)
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Fürs eBook bei Amazon KDP lädst du das{" "}
                <span className="font-medium">Cover-Bild als JPG</span> hoch — KDP
                nimmt für Cover kein PDF. Die PDF-Variante ist nur fürs Taschenbuch
                (Print, mit Rückseite).
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Wähle oben ein Motiv, dann kannst du das Cover-Bild herunterladen.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
