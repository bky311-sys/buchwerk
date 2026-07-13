import "server-only";

import JSZip from "jszip";
import type { BookSource } from "@/lib/books/sources";

type Chapter = { heading: string; content: string | null };
type Imprint = { name: string; street: string; zip: string; city: string };

export type EpubInput = {
  title: string;
  author: string;
  imprint: Imprint;
  chapters: Chapter[];
  // Sources from the research dossier; rendered as a Quellenverzeichnis in the
  // back matter. Empty → the section is omitted.
  sources: BookSource[];
  // ISO timestamp (YYYY-MM-DDThh:mm:ssZ) and a stable id, provided by the route.
  modified: string;
  uuid: string;
  year: number;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Inline markdown → xhtml (escape first, then re-introduce bold markup only).
function inline(s: string): string {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// Chapter markdown (## heading, ### sub, - list, paragraphs) → xhtml body.
// The leading "## <heading>" is dropped because we render the heading as <h1>.
function chapterBody(content: string): string {
  const out: string[] = [];
  let inList = false;
  let firstHeadingSkipped = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const raw of content.split("\n")) {
    const t = raw.trim();
    if (!t) {
      closeList();
      continue;
    }
    if (t.startsWith("### ")) {
      closeList();
      out.push(`<h2>${inline(t.slice(4))}</h2>`);
    } else if (t.startsWith("## ")) {
      if (!firstHeadingSkipped) {
        firstHeadingSkipped = true;
        continue;
      }
      closeList();
      out.push(`<h2>${inline(t.slice(3))}</h2>`);
    } else if (/^[-*]\s+/.test(t)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(t.replace(/^[-*]\s+/, ""))}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(t)}</p>`);
    }
  }
  closeList();
  return out.join("\n");
}

function xhtml(titleText: string, bodyInner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="de">
<head><meta charset="utf-8"/><title>${esc(titleText)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
${bodyInner}
</body>
</html>`;
}

// Builds a valid EPUB 3 as bytes. Reflowable — the right format for Kindle,
// unlike a fixed-layout PDF.
export async function buildEpub(input: EpubInput): Promise<Uint8Array> {
  const { title, author, imprint, chapters, sources, modified, uuid, year } =
    input;
  const written = chapters.filter((c) => c.content?.trim());
  const hasSources = sources.length > 0;

  const zip = new JSZip();

  // mimetype MUST be the first entry and stored uncompressed.
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  zip.file(
    "OEBPS/style.css",
    `body{font-family:Georgia,'Times New Roman',serif;line-height:1.5;margin:5%;}
h1{font-size:1.6em;margin:1em 0 .6em;line-height:1.2;}
h2{font-size:1.2em;margin:1.4em 0 .5em;}
p{margin:0 0 .8em;text-align:justify;}
.title-page{text-align:center;margin-top:30%;}
.title-page h1{font-size:2em;}
.imprint{font-size:.9em;color:#333;}
.sources li{margin:0 0 .7em;word-wrap:break-word;overflow-wrap:break-word;}
.sources a{color:#1c6b43;}`,
  );

  // Content documents.
  zip.file(
    "OEBPS/title.xhtml",
    xhtml(
      title,
      `<div class="title-page"><h1>${esc(title)}</h1>${
        author ? `<p>${esc(author)}</p>` : ""
      }</div>`,
    ),
  );

  zip.file(
    "OEBPS/imprint.xhtml",
    xhtml(
      "Impressum",
      `<div class="imprint"><h1>Impressum</h1>
<p>&#169; ${year} ${esc(imprint.name)}</p>
<p>${esc(imprint.name)}<br/>${esc(imprint.street)}<br/>${esc(imprint.zip)} ${esc(imprint.city)}</p>
<p>Alle Rechte vorbehalten. Nachdruck oder Vervielf&#228;ltigung, auch auszugsweise, nur mit ausdr&#252;cklicher Genehmigung des Autors.</p></div>`,
    ),
  );

  written.forEach((chapter, index) => {
    zip.file(
      `OEBPS/chap${index + 1}.xhtml`,
      xhtml(
        chapter.heading,
        `<h1>${esc(chapter.heading)}</h1>\n${chapterBody(chapter.content ?? "")}`,
      ),
    );
  });

  // Quellenverzeichnis (back matter) — only when the book was researched.
  if (hasSources) {
    const items = sources
      .map(
        (s) =>
          `<li><a href="${esc(s.url)}">${esc(s.title)}</a><br/>${esc(s.url)}</li>`,
      )
      .join("\n");
    zip.file(
      "OEBPS/sources.xhtml",
      xhtml("Quellen", `<h1>Quellen</h1>\n<ul class="sources">\n${items}\n</ul>`),
    );
  }

  // Navigation (EPUB 3 nav document).
  const navItems = [
    ...written.map(
      (c, i) => `<li><a href="chap${i + 1}.xhtml">${esc(c.heading)}</a></li>`,
    ),
    ...(hasSources ? [`<li><a href="sources.xhtml">Quellen</a></li>`] : []),
    `<li><a href="imprint.xhtml">Impressum</a></li>`,
  ].join("\n");
  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="de">
<head><meta charset="utf-8"/><title>Inhalt</title></head>
<body>
<nav epub:type="toc" id="toc"><h1>Inhalt</h1>
<ol>
${navItems}
</ol></nav>
</body>
</html>`,
  );

  // Package document.
  const manifestChapters = written
    .map(
      (_c, i) =>
        `    <item id="chap${i + 1}" href="chap${i + 1}.xhtml" media-type="application/xhtml+xml"/>`,
    )
    .join("\n");
  const spineChapters = written
    .map((_c, i) => `    <itemref idref="chap${i + 1}"/>`)
    .join("\n");

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="de">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${esc(title)}</dc:title>
    <dc:creator>${esc(author || imprint.name)}</dc:creator>
    <dc:language>de</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="style.css" media-type="text/css"/>
    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
    <item id="imprint" href="imprint.xhtml" media-type="application/xhtml+xml"/>
${hasSources ? '    <item id="sources" href="sources.xhtml" media-type="application/xhtml+xml"/>\n' : ""}${manifestChapters}
  </manifest>
  <spine>
    <itemref idref="title"/>
${spineChapters}
${hasSources ? '    <itemref idref="sources"/>\n' : ""}    <itemref idref="imprint"/>
  </spine>
</package>`,
  );

  // DEFLATE by default (smaller file); the per-file STORE on mimetype above wins.
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
