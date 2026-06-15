# WORKTREES.md — Parallele Arbeit mit git worktrees

Setup für parallele Feature-Entwicklung: jedes Feature läuft in einem eigenen
git worktree auf eigenem Branch, mit einer eigenen Claude-Code-Session. Die
Worktrees teilen sich dasselbe Repo (eine `.git`), arbeiten aber in getrennten
Verzeichnissen — keine Konflikte, kein Branch-Wechsel-Hin-und-Her.

## Konvention

- Worktrees liegen **neben** dem Repo: `../buchwerk-<name>`
- Branch-Schema: `feature/<name>`
- Haupt-Repo bleibt auf `main`.

## Helper-Script

```bash
# Neuen Worktree + Branch anlegen (kopiert .env.local, installiert Dependencies)
scripts/worktree.sh new posteingang

# Danach in eigener Session weiterarbeiten:
cd ../buchwerk-posteingang && claude

# Übersicht aller Worktrees
scripts/worktree.sh list

# Worktree wieder entfernen (fragt, ob der Branch mit weg soll)
scripts/worktree.sh rm posteingang
```

Flags: `new <name> --no-install` überspringt `pnpm install`; `rm <name> --force`
entfernt auch bei ungespeicherten Änderungen.

## Was das Script erledigt

1. Branch `feature/<name>` vom aktuellen Stand anlegen (oder vorhandenen nutzen).
2. Worktree unter `../buchwerk-<name>` auschecken.
3. `.env.local` aus dem Haupt-Repo kopieren — sie ist gitignored und fehlt im
   Worktree sonst (kein Dev/Build ohne Env-Variablen).
4. `pnpm install` im Worktree.

## Workflow für parallele Sessions

1. Pro unabhängigem Feature einen Worktree: `scripts/worktree.sh new <feature>`.
2. In jedem Worktree eine eigene Claude-Code-Session (`claude`) starten — sie
   laufen echt parallel, jede auf ihrem Branch.
3. Fertig → committen, pushen, PR. Danach `scripts/worktree.sh rm <feature>`.

**Wichtig:** Migrations und geteilte Dateien (z. B. `types/supabase.ts`,
`vercel.json`) in parallelen Branches im Blick behalten — sie sind die typischen
Merge-Konfliktstellen. Worktrees isolieren das Arbeitsverzeichnis, nicht die
Logik dahinter.
