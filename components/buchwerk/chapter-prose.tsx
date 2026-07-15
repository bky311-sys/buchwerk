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

export function ChapterProse({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let firstHeadingSkipped = false;

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-4 list-disc space-y-1 pl-6">
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of content.split("\n")) {
    const t = raw.trim();
    if (!t) {
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
    } else if (/^[-*]\s+/.test(t)) {
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
