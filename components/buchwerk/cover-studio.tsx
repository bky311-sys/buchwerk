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
  updateSubtitleAction,
} from "@/lib/books/cover-actions";
import {
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
import {
  accentColorFromMain,
  pickAccentWordIndex,
  scrimColor,
  fitTitle,
  splitCoverTitle,
} from "@/lib/books/cover-layout";
import {
  COVER_TEMPLATES,
  getCoverTemplate,
  defaultTemplateForBookType,
  type CoverTemplateKey,
} from "@/lib/books/cover-directions";
import { CoverComposition } from "@/components/buchwerk/cover-composition";

const TEXTAREA_CLASS =
  "flex w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

// After this long without the new covers appearing we stop waiting and offer a
// retry — the generation almost certainly failed or was killed. Sized for a
// 3-variant run (~30–40 s each).
const COVER_TIMEOUT_MS = 240_000;

// Motiv-Varianten pro Klick (Cover 2.2): Ideogram/Flux variieren per Zufalls-
// Seed deutlich — drei Würfe geben echte Auswahl statt Einzelschuss.
const VARIANTS_PER_RUN = 3;

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
  subtitle,
  titleStyle,
  blurb,
  covers,
  bookType,
  hasMarketData,
}: {
  projectId: string;
  title: string;
  author: string;
  subtitle: string;
  titleStyle: string;
  blurb: string;
  covers: Cover[];
  bookType: string;
  hasMarketData: boolean;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [authorValue, setAuthorValue] = useState(author);
  const [subtitleValue, setSubtitleValue] = useState(subtitle);
  const [blurbValue, setBlurbValue] = useState(blurb);
  const [template, setTemplate] = useState<CoverTemplateKey>(
    defaultTemplateForBookType(bookType),
  );
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

  // Detect completion: all variants appeared (dropped responses included —
  // the poll refreshes the list; the generate loop's finally covers the rest).
  useEffect(() => {
    if (
      generating &&
      startCountRef.current !== null &&
      covers.length >= startCountRef.current + VARIANTS_PER_RUN
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

  function suggest(tpl: CoverTemplateKey = template) {
    setError(null);
    startTransition(async () => {
      const result = await suggestCoverPromptAction(projectId, tpl);
      if (result.ok && result.prompt) setPrompt(result.prompt);
      else setError(result.error ?? "Konnte keinen Vorschlag erstellen.");
    });
  }

  // Vorlagen-Wechsel = komplettes Design-System: setzt das Typo-Preset der
  // Vorlage (Fläche/Ausrichtung/Ton/Position) UND holt sofort einen frischen
  // Bild-Prompt in dieser Art-Direction.
  function chooseTemplate(key: CoverTemplateKey) {
    setTemplate(key);
    const preset = getCoverTemplate(key).style;
    chooseStyle(
      buildCoverStyle(
        preset.position,
        preset.tone,
        preset.surface,
        preset.align,
      ),
    );
    suggest(key);
  }

  // Beim allerersten Besuch (keine Motive, leeres Feld) den Vorschlag von
  // selbst holen: ein leeres Feld mit der Aufforderung, einen englischen
  // Bildprompt zu schreiben, war für die Zielgruppe die falsche erste Erfahrung
  // (UX-Review). Ein Ref verhindert Doppel-Calls durch Re-Renders.
  const autoSuggestedRef = useRef(false);
  useEffect(() => {
    if (autoSuggestedRef.current) return;
    if (covers.length > 0 || prompt.trim()) return;
    autoSuggestedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- einmaliger Auto-Start nach dem Mount, per Ref gegen Wiederholung gesichert
    suggest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Drei Motiv-Varianten nacheinander (sequenziell wegen des Replicate-
  // Rate-Limits bei niedrigem Guthaben). Fertig, sobald die Liste um die
  // Varianten gewachsen ist — der Poll übernimmt bei verworfenen Responses.
  function generate() {
    setError(null);
    startCountRef.current = covers.length;
    setGenerating(true);
    (async () => {
      try {
        for (let i = 0; i < VARIANTS_PER_RUN; i += 1) {
          const res = await fetch(`/api/projekte/${projectId}/cover`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            // Modell folgt der Vorlage: Illustration (Ideogram) für die
            // Design-Vorlagen, Flux Pro für Editorial Foto.
            body: JSON.stringify({
              prompt,
              model: getCoverTemplate(template).model,
            }),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as {
              error?: string;
            } | null;
            // Erste Variante fehlgeschlagen → echter Fehler; spätere → die
            // schon erzeugten Varianten stehen bereit, still aufhören.
            if (i === 0) {
              setError(
                data?.error ?? "Das Motiv konnte nicht erstellt werden.",
              );
              setGenerating(false);
              startCountRef.current = null;
            }
            break;
          }
          router.refresh();
        }
      } catch {
        // Dropped (long generation past the gateway limit). The poll + completion
        // effect / timeout take over from here.
      } finally {
        // Loop beendet (alle Requests beantwortet oder verworfen) — Spinner aus,
        // was da ist, ist da; der letzte Refresh holt den Endstand.
        setGenerating(false);
        startCountRef.current = null;
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

  function saveSubtitle() {
    setError(null);
    startTransition(async () => {
      const result = await updateSubtitleAction(projectId, subtitleValue);
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

        const { position, tone, surface, align } = parseCoverStyle(style);
        const main = motifColor ?? NEUTRAL_MAIN;
        const titleColor = rgbCss(bandTitleColor(tone));
        const authorColor = rgbCss(bandAuthorColor(tone));
        const accentCss = rgbCss(accentColorFromMain(main, tone));
        const centered = align === "mitte";

        const pad = 96;
        ctx.textBaseline = "top";

        // Doppelpunkt-Titel splitten (Haupttitel riesig, Rest Untertitel) —
        // identisch zu PDF und Web-Vorschau.
        const splitTitle = splitCoverTitle(title, subtitleValue);
        const displayTitle = splitTitle.title;

        // Adaptive Titelgröße — kurze Titel werden riesig (Amazon-Thumbnail-
        // Regel), lange dürfen 5 Zeilen nutzen, bevor sie schrumpfen.
        const titleFont = (s: number) =>
          `700 ${s}px "Bricolage Grotesque", sans-serif`;
        const fitted = fitTitle(
          displayTitle,
          W - 2 * pad,
          (text, s) => {
            ctx.font = titleFont(s);
            return ctx.measureText(text).width;
          },
          // baseSize 258 ≈ PDF 66 (Canvas 1600px ↔ Front ~405pt).
          { baseSize: 258, minSize: 78, maxLines: 5 },
        );

        const authorText = authorValue.trim();
        const subtitleText = splitTitle.subtitle;
        const authorSize = 46;
        const subtitleSize = 52;
        const subtitleLh = 66;
        ctx.font = `500 ${subtitleSize}px "Instrument Sans", sans-serif`;
        const subtitleLines = subtitleText
          ? (() => {
              const out: string[] = [];
              let l = "";
              for (const word of subtitleText.split(/\s+/).filter(Boolean)) {
                const cand = l ? `${l} ${word}` : word;
                if (ctx.measureText(cand).width > W - 2 * pad && l) {
                  out.push(l);
                  l = word;
                } else {
                  l = cand;
                }
              }
              if (l) out.push(l);
              return out.slice(0, 3);
            })()
          : [];

        // Vorlagen ohne Fläche mit Titel oben führen den Autor klassisch ganz
        // unten auf dem Cover (Zentrum-&-Symbol-/Premium-Konvention).
        const authorAtBottom = surface === "none" && position === "oben";
        // Ohne Fläche mehr Innenabstand (Motive tragen Randelemente).
        const topInset = surface === "none" ? 154 : 64;
        const contentH =
          topInset +
          fitted.lines.length * fitted.lineHeight +
          (subtitleLines.length ? 24 + subtitleLines.length * subtitleLh : 0) +
          48 +
          (authorText && !authorAtBottom ? authorSize + 40 : 0);
        const bandH = Math.min(H * 0.55, contentH);
        const bandY = position === "oben" ? 0 : H - bandH;

        if (surface === "none") {
          // Vorlagen-Motiv liefert die ruhige Fläche selbst — keine Zeichnung.
        } else if (surface === "scrim") {
          // Verlauf statt deckender Fläche: Motiv bleibt hinter dem Titel
          // sichtbar (moderner Bestseller-Look). Verlauf läuft zur Bildmitte
          // hin aus; +40% Anlauf über der Textzone für weiche Kante.
          const scrim = scrimColor(main, tone);
          const solid = rgbCss(scrim);
          const extra = Math.min(H - bandH, Math.round(bandH * 0.4));
          const g =
            position === "oben"
              ? ctx.createLinearGradient(0, 0, 0, bandH + extra)
              : ctx.createLinearGradient(0, H, 0, H - bandH - extra);
          g.addColorStop(0, solid);
          g.addColorStop(bandH / (bandH + extra), solid);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          if (position === "oben") ctx.fillRect(0, 0, W, bandH + extra);
          else ctx.fillRect(0, H - bandH - extra, W, bandH + extra);
        } else {
          ctx.fillStyle = rgbCss(bandColorFromMain(main, tone));
          ctx.fillRect(0, bandY, W, bandH);
          // Akzentstreifen in der Kontrastfarbe des Motivs (nicht mehr fix grün).
          ctx.fillStyle = accentCss;
          ctx.fillRect(0, position === "oben" ? bandY + bandH : bandY - 8, W, 8);
        }

        // Titel mit hervorgehobenem Schlüsselwort (Blickanker in Akzentfarbe);
        // zentrierte Layouts (Vorlagen) mittig, sonst linksbündig.
        ctx.font = titleFont(fitted.size);
        const lineStartX = (line: string) =>
          centered
            ? pad + Math.max(0, (W - 2 * pad - ctx.measureText(line).width) / 2)
            : pad;
        const accentIndex = pickAccentWordIndex(displayTitle);
        let wordCursor = 0;
        let ty = bandY + topInset;
        for (const l of fitted.lines) {
          const lineWords = l.split(" ");
          ctx.font = titleFont(fitted.size);
          let tx = lineStartX(l);
          for (const word of lineWords) {
            ctx.fillStyle =
              wordCursor === accentIndex ? accentCss : titleColor;
            ctx.fillText(word, tx, ty);
            tx += ctx.measureText(`${word} `).width;
            wordCursor += 1;
          }
          ty += fitted.lineHeight;
        }

        if (subtitleLines.length) {
          ty += 24;
          ctx.fillStyle = authorColor;
          ctx.font = `500 ${subtitleSize}px "Instrument Sans", sans-serif`;
          for (const l of subtitleLines) {
            ctx.fillText(l, lineStartX(l), ty);
            ty += subtitleLh;
          }
        }
        if (authorText) {
          // Zentrierte Layouts: Autor in Versalien (Premium-Konvention);
          // Vorlagen ohne Fläche mit Titel oben: Autor ganz unten.
          const drawnAuthor = centered ? authorText.toUpperCase() : authorText;
          const drawnSize = centered ? 40 : authorSize;
          ctx.fillStyle = authorColor;
          ctx.font = `500 ${drawnSize}px "Instrument Sans", sans-serif`;
          const ay = authorAtBottom
            ? H - drawnSize - 72
            : bandY + bandH - drawnSize - 44;
          ctx.fillText(drawnAuthor, lineStartX(drawnAuthor), ay);
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
      const [authorRes, blurbRes, subtitleRes] = await Promise.all([
        updateProjectAuthorAction(projectId, authorValue),
        updateBlurbAction(projectId, blurbValue),
        updateSubtitleAction(projectId, subtitleValue),
      ]);
      const result = !authorRes.ok
        ? authorRes
        : !blurbRes.ok
          ? blurbRes
          : subtitleRes;
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
        <div className="space-y-2">
          <Label>Vorlage wählen</Label>
          <p className="text-xs text-muted-foreground">
            Sechs Cover-Systeme nach aktuellen Bestseller-Mustern — die Vorlage
            steuert Motiv-Stil UND Titel-Layout.
            {hasMarketData
              ? " Der Vorschlag kennt deine Amazon-Konkurrenz aus dem Marktcheck und setzt sich farblich von ihr ab."
              : ""}
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COVER_TEMPLATES.map((t) => {
              const active = template === t.key;
              const centeredMock = t.style.align === "mitte";
              return (
                <li key={t.key}>
                  <button
                    type="button"
                    onClick={() => chooseTemplate(t.key)}
                    aria-pressed={active}
                    disabled={busy}
                    className={`block w-full overflow-hidden rounded-xl border text-left transition-colors disabled:opacity-50 ${
                      active
                        ? "border-primary ring-2 ring-primary"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    {/* Mini-Mock des Vorlagen-Looks — reine CSS-Andeutung. */}
                    <div
                      className={`flex aspect-[2/3] w-full flex-col justify-between p-2.5 ${
                        centeredMock ? "items-center text-center" : ""
                      }`}
                      style={{ backgroundColor: t.swatch.bg }}
                    >
                      <div>
                        <p
                          className="font-display text-[13px] font-bold leading-tight"
                          style={{ color: t.swatch.fg }}
                        >
                          Dein{" "}
                          <span style={{ color: t.swatch.accent }}>Titel</span>
                        </p>
                        <p
                          className="mt-0.5 text-[7px]"
                          style={{ color: t.swatch.fg, opacity: 0.75 }}
                        >
                          Untertitel mit Versprechen
                        </p>
                      </div>
                      <div
                        className={`h-6 w-6 rounded-full ${centeredMock ? "self-center" : ""}`}
                        style={{ backgroundColor: t.swatch.accent, opacity: 0.85 }}
                      />
                      <p
                        className="text-[6px] tracking-widest"
                        style={{ color: t.swatch.fg, opacity: 0.7 }}
                      >
                        AUTORNAME
                      </p>
                    </div>
                    <span className="block px-2.5 py-2">
                      <span className="block text-sm font-semibold">
                        {t.label}
                        {active ? " ✓" : ""}
                      </span>
                      <span className="block text-xs leading-snug text-muted-foreground">
                        {t.hint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="cover-prompt">Bildidee</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => suggest()}
              disabled={busy}
            >
              Neuen Vorschlag erstellen
            </Button>
          </div>
          <textarea
            id="cover-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={busy}
            rows={4}
            placeholder="Buchwerk erstellt gerade einen Vorschlag aus deinem Buch… Du kannst die Bildidee danach frei anpassen (Englisch funktioniert am besten)."
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
            Sag in Stichworten, was am Motiv anders soll — die KI überarbeitet die
            Prompt. Danach neu erzeugen.
          </p>
        </div>

        {generating ? (
          <div className="flex items-center gap-2 text-sm font-medium text-clay-strong">
            <Spinner className="size-4" />
            Motiv-Varianten werden erstellt… (~2 Min. für 3 Stück)
          </div>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={generate}
            disabled={busy || !prompt.trim()}
          >
            {covers.length > 0
              ? "3 neue Motiv-Varianten erzeugen"
              : "3 Motiv-Varianten erzeugen"}
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
            Das ist dein echtes Cover — genau so landet es im Export. Justiere
            Fläche, Position, Ton und Ausrichtung; das markierte Wort trägt
            automatisch die Kontrast-Akzentfarbe des Motivs.
          </p>

          <div className="mt-4 flex flex-col gap-6 sm:flex-row">
            {/* Große Live-Vorschau: exakt die Produktions-Komposition. */}
            <div className="w-full max-w-[280px] shrink-0">
              <CoverComposition
                imageUrl={selectedCover.image_url}
                title={title}
                author={authorValue}
                subtitle={subtitleValue}
                styleKey={style}
                main={motifColor}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              {(
                [
                  {
                    label: "Fläche",
                    options: [
                      { value: "none", text: "Pur (Vorlagen-Look)" },
                      { value: "band", text: "Farbband" },
                      { value: "scrim", text: "Verlauf" },
                    ],
                    current: parseCoverStyle(style).surface as string,
                    apply: (v: string) => {
                      const s = parseCoverStyle(style);
                      chooseStyle(
                        buildCoverStyle(
                          s.position,
                          s.tone,
                          v as "none" | "band" | "scrim",
                          s.align,
                        ),
                      );
                    },
                  },
                  {
                    label: "Titel-Position",
                    options: [
                      { value: "oben", text: "Oben" },
                      { value: "unten", text: "Unten" },
                    ],
                    current: parseCoverStyle(style).position as string,
                    apply: (v: string) => {
                      const s = parseCoverStyle(style);
                      chooseStyle(
                        buildCoverStyle(
                          v as "oben" | "unten",
                          s.tone,
                          s.surface,
                          s.align,
                        ),
                      );
                    },
                  },
                  {
                    label: "Ton",
                    options: [
                      { value: "hell", text: "Hell (dunkle Schrift)" },
                      { value: "dunkel", text: "Dunkel (helle Schrift)" },
                    ],
                    current: parseCoverStyle(style).tone as string,
                    apply: (v: string) => {
                      const s = parseCoverStyle(style);
                      chooseStyle(
                        buildCoverStyle(
                          s.position,
                          v as "hell" | "dunkel",
                          s.surface,
                          s.align,
                        ),
                      );
                    },
                  },
                  {
                    label: "Ausrichtung",
                    options: [
                      { value: "links", text: "Linksbündig" },
                      { value: "mitte", text: "Zentriert" },
                    ],
                    current: parseCoverStyle(style).align as string,
                    apply: (v: string) => {
                      const s = parseCoverStyle(style);
                      chooseStyle(
                        buildCoverStyle(
                          s.position,
                          s.tone,
                          s.surface,
                          v as "links" | "mitte",
                        ),
                      );
                    },
                  },
                ] as const
              ).map((axis) => (
                <div key={axis.label}>
                  <p className="text-sm font-medium">{axis.label}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {axis.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => axis.apply(opt.value)}
                        aria-pressed={axis.current === opt.value}
                        disabled={busy}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
                          axis.current === opt.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Thumbnail-Wahrheit: dieselbe Komposition in Amazon-Suchgröße. */}
              <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/40 p-4">
                <div className="w-[72px] shrink-0">
                  <CoverComposition
                    imageUrl={selectedCover.image_url}
                    title={title}
                    author={authorValue}
                    subtitle={subtitleValue}
                    styleKey={style}
                    main={motifColor}
                    rounded={false}
                    className="rounded-sm"
                  />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">
                    So klein sieht dein Cover in der Amazon-Suche aus.
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {(() => {
                      // Der Hinweis bewertet den tatsächlich gezeigten
                      // Haupttitel (nach dem automatischen Doppelpunkt-Split).
                      const len = splitCoverTitle(title, subtitleValue).title
                        .length;
                      return len > 60
                        ? "Dein Titel ist lang — in dieser Größe ist er kaum lesbar. Kürzere Titel (oder das Kernthema zuerst) gewinnen im Thumbnail."
                        : len > 35
                          ? "Ordentlich. Noch stärker wird es, wenn das wichtigste Wort vorn steht — es trägt die Akzentfarbe."
                          : "Stark: Ein kurzer Titel bleibt auch im Thumbnail groß und lesbar.";
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
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

        <div className="mt-4 max-w-xl space-y-1">
          <Label htmlFor="cover-subtitle">
            Untertitel (erscheint unter dem Titel)
          </Label>
          <p className="text-xs text-muted-foreground">
            Das Nutzenversprechen in einem Satz — bei Ratgebern kaufentscheidend.
            Er ist derselbe wie der KDP-Untertitel.
          </p>
          <div className="flex gap-2">
            <Input
              id="cover-subtitle"
              value={subtitleValue}
              onChange={(event) => setSubtitleValue(event.target.value)}
              disabled={busy}
              placeholder="z. B. Der 30-Tage-Plan für entspannte Familienabende"
              className="h-10"
            />
            <Button
              type="button"
              variant="outline"
              onClick={saveSubtitle}
              disabled={busy}
            >
              Speichern
            </Button>
          </div>
        </div>

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
                nimmt fürs eBook-Cover kein PDF. Die PDF ist das{" "}
                <span className="font-medium">Full-Wrap fürs Taschenbuch</span>{" "}
                (Rückseite + Rücken + Vorderseite, Beschnitt und Rückenbreite
                passend zur Seitenzahl).
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
