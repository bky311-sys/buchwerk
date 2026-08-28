#!/bin/zsh
cd "$(dirname "$0")/.."
JAR=/private/tmp/claude-501/-Users-benjaminkoch-Toolset/2d829ae3-88e3-4bf4-8910-90290396cecb/scratchpad/qs-durchlauf/jar-v9.txt
PID=8bb2c31c-adf8-4257-a712-c9fa7cad8ab3
# Recherche zuerst (3 Etappen), damit die Kapitel eine Faktenbasis haben
for s in 0 1 2; do
  curl -s --max-time 290 -X POST -b "$JAR" -H "content-type: application/json" -d "{\"stage\":$s}" "https://buchwerk.info/api/projekte/$PID/research" > /dev/null
  echo "$(date +%H:%M:%S) Recherche-Etappe $s fertig"
done
while true; do
  NEXT=$(./.qs-tmp/rest.sh "chapters?project_id=eq.$PID&status=eq.offen&select=id,position&order=position&limit=1" | python3 -c "import json,sys; r=json.load(sys.stdin); print(r[0]['id'] if r else '')")
  [ -z "$NEXT" ] && break
  curl -s --max-time 290 -X POST -b "$JAR" "https://buchwerk.info/api/chapters/$NEXT/generate" > /dev/null
  echo "$(date +%H:%M:%S) Kapitel geschrieben"
done
echo "ALLE KAPITEL FERTIG"
