# Buchwerk.info

Deutschsprachige KI-gestützte Self-Publishing-Plattform.
Vom Thema bis zum KDP-fertigen Buch — Manuskript, Cover, KDP-Listing in einem Workflow.

## Dokumentation

- [`KONZEPT.md`](./KONZEPT.md) — Produktkonzept, User Journey, Preismodell, Roadmap
- [`CLAUDE.md`](./CLAUDE.md) — Arbeitsweise, Tech-Stack-Entscheidungen, Code-Konventionen
- [`docs/DESIGN.md`](./docs/DESIGN.md) — Farbpalette, Typografie, WCAG-Kontraste

## Setup lokal

Voraussetzungen: Node.js ≥ 20, pnpm.

```bash
pnpm install
pnpm dev
```

Dann `http://localhost:3000` im Browser öffnen.

## Tech-Stack (Kurzfassung)

- Next.js 16 mit App Router
- TypeScript
- Tailwind CSS 4 + shadcn/ui
- Inter Variable, self-hosted via `@fontsource-variable/inter` (keine Google Fonts CDN)
- Supabase (geplant), Stripe (geplant), Claude API (geplant), Flux via Replicate (geplant)

Details und Begründungen in `CLAUDE.md`.

## Status

Landing-Page-Setup (Woche 1). Supabase, Auth, KI-Pipelines und Stripe kommen ab Woche 2.
