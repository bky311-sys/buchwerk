import { Fragment, type ReactNode } from "react";

// Renders the chapter markdown subset our own prompts produce (## heading,
// ### sub, - list, **bold**, paragraphs) as React.
//
// Hand-rolled on purpose: no markdown dependency may be added (see the note in
// lib/ai/anthropic.ts — the project is partly edited through the GitHub API, so
// pnpm-lock.yaml cannot be regenerated). The accepted subset is deliberately the
// same one lib/books/epub.ts already parses, so the reader and the EPUB export
// cannot drift apart.
//
// The input is our own model output, never third-party HTML, and it is rendered
// as React text nodes — no dangerouslySetInnerHTML anywhere.

// **bold** → <strong>, everything else stays literal text.
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-medium">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function ChapterProse({
  content,
  // Kapitel beginnen mit ihrer eigenen ## Überschrift, die die Seite selbst
  // rendert — Ratgeber-Artikel nicht (dort ist jedes ## eine echte Zwischenüberschrift).
  skipFirstHeading = true,
}: {
  content: string;
  skipFirstHeading?: boolean;
}) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  // "check" = Workbook-Checkliste (- [ ] …) ohne Bullet-Punkte vor den Kästchen.
  let listMode: "plain" | "check" = "plain";
  let firstHeadingSkipped = !skipFirstHeading;

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className={
          listMode === "check"
            ? "my-4 list-none space-y-1.5"
            : "my-4 list-disc space-y-1 pl-6"
        }
      >
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
    listMode = "plain";
  };

  for (const raw of content.split("\n")) {
    const t = raw.trim();
    if (!t) {
      flushList();
      continue;
    }
    // Trennlinien (---, ***, ___) schluckt der Renderer: als Text geleakt lasen
    // sie sich wie kaputte Formatierung; der Absatzabstand trennt ohnehin.
    if (/^([-*_])\1{2,}$/.test(t)) {
      flushList();
      continue;
    }
    if (t.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3
          key={`h3-${blocks.length}`}
          className="font-display mt-8 mb-3 text-xl font-semibold"
        >
          {inline(t.slice(4))}
        </h3>,
      );
    } else if (t.startsWith("## ")) {
      // The chapter heading is rendered by the page itself.
      if (!firstHeadingSkipped) {
        firstHeadingSkipped = true;
        continue;
      }
      flushList();
      blocks.push(
        <h3
          key={`h2-${blocks.length}`}
          className="font-display mt-8 mb-3 text-xl font-semibold"
        >
          {inline(t.slice(3))}
        </h3>,
      );
    } else if (/^\[UEBUNG\]\s*/i.test(t)) {
      // Workbook-Syntax (lib/books/book-type.ts) — im Reader als abgesetzte
      // Übungs-Überschrift, damit keine Rohmarker sichtbar werden.
      flushList();
      blocks.push(
        <p
          key={`ue-${blocks.length}`}
          className="mt-8 mb-3 border-t-2 border-primary pt-3 font-semibold"
        >
          Übung: {inline(t.replace(/^\[UEBUNG\]\s*/i, ""))}
        </p>,
      );
    } else if (/^\[NOTIZFELD(\s+\d+)?\]$/i.test(t)) {
      // Schreiblinien gehören ins gedruckte Buch; am Bildschirm reicht der
      // Hinweis, dass hier Platz zum Eintragen ist.
      flushList();
      blocks.push(
        <p
          key={`nf-${blocks.length}`}
          className="my-4 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground"
        >
          ✎ Platz für deine Notizen (im gedruckten Buch: Schreiblinien)
        </p>,
      );
    } else if (/^[-*]\s+\[( |x|X)?\]\s+/.test(t)) {
      if (listMode !== "check") flushList();
      listMode = "check";
      list.push(
        `${/^[-*]\s+\[(x|X)\]/.test(t) ? "☑" : "☐"} ${t.replace(/^[-*]\s+\[( |x|X)?\]\s+/, "")}`,
      );
    } else if (/^[-*]\s+/.test(t)) {
      if (listMode !== "plain") flushList();
      list.push(t.replace(/^[-*]\s+/, ""));
    } else {
      flushList();
      blocks.push(
        <p key={`p-${blocks.length}`} className="my-4">
          {inline(t)}
        </p>,
      );
    }
  }
  flushList();

  // max-w-[62ch]: Dyson & Haselgrove (2001) measured highest comprehension around
  // 55 characters per line; Bringhurst's 45–75 brackets it. Wider lines cost
  // comprehension, narrower ones cost speed.
  return (
    <div className="max-w-[62ch] text-lg leading-[1.7] text-foreground">
      {blocks}
    </div>
  );
}
