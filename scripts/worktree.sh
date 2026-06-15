#!/usr/bin/env bash
#
# Worktree-Helper für parallele Feature-Arbeit an buchwerk.
# Jedes Feature bekommt einen eigenen git worktree + Branch, in dem eine
# separate Claude-Code-Session laufen kann — isoliert, ohne Konflikte.
#
# Nutzung:
#   scripts/worktree.sh new <name> [--no-install]   # Worktree ../buchwerk-<name> auf feature/<name>
#   scripts/worktree.sh list                         # alle Worktrees zeigen
#   scripts/worktree.sh rm  <name> [--force]         # Worktree (und Branch) entfernen
#
# Konvention: Worktrees liegen neben dem Repo als ../buchwerk-<name>.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
PARENT="$(dirname "$ROOT")"
PREFIX="buchwerk"

cmd="${1:-}"
name="${2:-}"
flag="${3:-}"

usage() {
  echo "Nutzung:"
  echo "  scripts/worktree.sh new <name> [--no-install]"
  echo "  scripts/worktree.sh list"
  echo "  scripts/worktree.sh rm  <name> [--force]"
  exit 1
}

case "$cmd" in
  new)
    [ -n "$name" ] || usage
    branch="feature/$name"
    dir="$PARENT/$PREFIX-$name"
    [ -e "$dir" ] && { echo "Existiert schon: $dir"; exit 1; }

    # Branch vom aktuellen Stand anlegen, oder vorhandenen Branch nutzen.
    if git show-ref --verify --quiet "refs/heads/$branch"; then
      git worktree add "$dir" "$branch"
    else
      git worktree add -b "$branch" "$dir"
    fi

    # .env.local ist gitignored -> in den Worktree kopieren, sonst kein Dev/Build.
    if [ -f "$ROOT/.env.local" ]; then
      cp "$ROOT/.env.local" "$dir/.env.local"
      echo "→ .env.local kopiert"
    fi

    # Dependencies installieren (außer --no-install).
    if [ "$flag" != "--no-install" ]; then
      ( cd "$dir" && pnpm install --silent )
      echo "→ pnpm install fertig"
    fi

    echo
    echo "Bereit. Neue Session starten mit:"
    echo "  cd \"$dir\" && claude"
    ;;

  list)
    git worktree list
    ;;

  rm)
    [ -n "$name" ] || usage
    branch="feature/$name"
    dir="$PARENT/$PREFIX-$name"
    git worktree remove ${flag:+--force} "$dir"
    echo "→ Worktree entfernt: $dir"
    if git show-ref --verify --quiet "refs/heads/$branch"; then
      read -r -p "Branch $branch auch löschen? [y/N] " yn
      if [ "$yn" = "y" ] || [ "$yn" = "Y" ]; then
        git branch -D "$branch"
        echo "→ Branch gelöscht"
      fi
    fi
    ;;

  *)
    usage
    ;;
esac
