import { renderBrandedEmail } from "../lib/email/template";
const { html, text } = renderBrandedEmail({
  preheader: "Kapitel, Cover, KDP-Listing und Export sind jetzt frei.",
  heading: "Danke für deinen Kauf!",
  paragraphs: [
    "Dein Buchprojekt ist jetzt vollständig freigeschaltet: Kapitel schreiben, Cover gestalten, KDP-Listing erstellen und dein fertiges Buch als PDF und EPUB exportieren.",
    "Leg direkt los — dein Projekt wartet auf dich.",
  ],
  cta: { label: "Zu deinem Buchprojekt", url: "https://buchwerk.info/projekte" },
  footnote: "Mit dem Kauf hast du bestätigt, dass die Leistung sofort bereitgestellt wird und dein Widerrufsrecht damit erlischt (§ 356 Abs. 5 BGB).",
});
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: "Buchwerk <welcome@buchwerk.info>", to: "bky311@gmail.com", subject: "Dein Buch ist freigeschaltet – Buchwerk", html, text }),
});
console.log(res.status, await res.text());
