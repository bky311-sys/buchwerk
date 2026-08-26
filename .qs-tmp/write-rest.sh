#!/bin/zsh
# Schreibt die offenen Kapitel des Hochbeet-Projekts seriell (wie BatchWrite).
cd "$(dirname "$0")/.."
JAR=/private/tmp/claude-501/-Users-benjaminkoch-Toolset/2d829ae3-88e3-4bf4-8910-90290396cecb/scratchpad/qs-durchlauf/jar-v5.txt
PID=254fcd72-fba4-4ba9-804d-1337e98dd814
# Warten, bis kein Kapitel mehr "schreiben" ist
while ./.qs-tmp/rest.sh "chapters?project_id=eq.$PID&status=eq.schreiben&select=id" | grep -q '"id"'; do sleep 10; done
while true; do
  NEXT=$(./.qs-tmp/rest.sh "chapters?project_id=eq.$PID&status=eq.offen&select=id,position&order=position&limit=1" | python3 -c "import json,sys; r=json.load(sys.stdin); print(r[0]['id'] if r else '')")
  [ -z "$NEXT" ] && break
  echo "$(date +%H:%M:%S) → Kapitel $NEXT"
  curl -s --max-time 290 -X POST -b "$JAR" "https://buchwerk.info/api/chapters/$NEXT/generate" -w " %{http_code}\n"
done
echo "FERTIG"
./.qs-tmp/rest.sh "chapters?project_id=eq.$PID&select=position,status&order=position" | python3 -c "import json,sys; [print(r['position'], r['status']) for r in json.load(sys.stdin)]"
