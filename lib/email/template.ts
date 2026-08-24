import "server-only";

// Buchwerk-Transaktionsmail im Studio-Design (docs/DESIGN.md): Paper-Grund,
// weiße Karte, Flaschengrün als CTA. E-Mail-tauglich gebaut: Tabellen-Layout,
// alle Styles inline, keine externen Bilder/Fonts (Bilder drücken bei jungen
// Domains den Spam-Score, Webfonts laden in Mail-Clients ohnehin nicht).
// Jede Mail bekommt zusätzlich eine Text-Version — Multipart ohne Text-Teil
// ist ein klassisches Spam-Signal.

const PAPER = "#EFEDE7";
const INK = "#17140F";
const CARD = "#FFFFFF";
const MUTED = "#6B6459";
const GREEN = "#1C6B43";
const BORDER = "#E4E0D6";

// Muss zum Impressum der Website passen (app/impressum/page.tsx).
const IMPRINT_LINE = "Buchwerk · Benjamin Koch · Friedrichstraße 33 · 58791 Werdohl";
const SITE = "https://buchwerk.info";

export type EmailContent = {
  /** Vorschautext im Posteingang (unsichtbar in der Mail selbst). */
  preheader?: string;
  heading: string;
  /** Absätze als einfacher Text; Zeilen werden zu <p>-Absätzen. */
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Kleingedrucktes unter dem CTA (z. B. Widerrufshinweis). */
  footnote?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderBrandedEmail(content: EmailContent): {
  html: string;
  text: string;
} {
  const paragraphsHtml = content.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(p)}</p>`,
    )
    .join("\n");

  const ctaHtml = content.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px 0;"><tr><td style="border-radius:8px;background:${GREEN};">
<a href="${content.cta.url}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:8px;">${escapeHtml(content.cta.label)}</a>
</td></tr></table>`
    : "";

  const footnoteHtml = content.footnote
    ? `<p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:${MUTED};">${escapeHtml(content.footnote)}</p>`
    : "";

  const preheaderHtml = content.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(content.preheader)}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PAPER};">
${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 4px 16px 4px;">
  <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:${INK};">Buch<span style="color:${GREEN};">werk</span></span>
</td></tr>
<tr><td style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:28px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
  <h1 style="margin:0 0 16px 0;font-size:20px;line-height:1.35;color:${INK};">${escapeHtml(content.heading)}</h1>
  ${paragraphsHtml}
  ${ctaHtml}
  ${footnoteHtml}
</td></tr>
<tr><td style="padding:18px 4px 0 4px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
  <p style="margin:0 0 4px 0;font-size:12px;line-height:1.6;color:${MUTED};">${escapeHtml(IMPRINT_LINE)}</p>
  <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
    <a href="${SITE}/impressum" style="color:${MUTED};">Impressum</a> ·
    <a href="${SITE}/datenschutz" style="color:${MUTED};">Datenschutz</a> ·
    <a href="${SITE}" style="color:${MUTED};">buchwerk.info</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    content.heading,
    "",
    ...content.paragraphs,
    ...(content.cta ? ["", `${content.cta.label}: ${content.cta.url}`] : []),
    ...(content.footnote ? ["", content.footnote] : []),
    "",
    "—",
    IMPRINT_LINE,
    `Impressum: ${SITE}/impressum · Datenschutz: ${SITE}/datenschutz`,
  ].join("\n");

  return { html, text };
}
