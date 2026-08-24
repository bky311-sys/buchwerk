#!/bin/zsh
# Schreibt ALLE Kapitel strikt seriell über die Produktions-Route.
# usage: drive-chapters.sh <jar> <projectId> <logdir>
set -u
JAR="$1"; PID="$2"; LOG="$3"
DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$LOG"

ids=$("$DIR/rest.sh" "chapters?project_id=eq.$PID&select=id,position&order=position" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{JSON.parse(d).forEach(r=>console.log(r.id+' '+r.position))})")

echo "$ids" | while read -r id pos; do
  [ -z "$id" ] && continue
  attempts=0
  while true; do
    attempts=$((attempts+1))
    start=$(date +%s)
    code=$(curl -s -o "$LOG/ch${pos}_try${attempts}.json" -w "%{http_code}" \
      -b "$JAR" -c "$JAR" -X POST --max-time 330 \
      "https://buchwerk.info/api/chapters/$id/generate")
    dur=$(( $(date +%s) - start ))
    echo "$(date -u +%H:%M:%S) chapter $pos try $attempts -> $code (${dur}s)" | tee -a "$LOG/driver.log"
    if [ "$code" = "200" ]; then
      sleep 3
      break
    elif [ "$code" = "409" ]; then
      sleep 30
      [ $attempts -ge 15 ] && { echo "chapter $pos stuck busy" | tee -a "$LOG/driver.log"; break }
    elif [ $attempts -ge 2 ]; then
      echo "chapter $pos FAILED after retry" | tee -a "$LOG/driver.log"
      sleep 5
      break
    else
      sleep 60
    fi
  done
done
echo "ALL_CHAPTERS_DONE" | tee -a "$LOG/driver.log"
