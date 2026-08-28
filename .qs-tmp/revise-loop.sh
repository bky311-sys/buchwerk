#!/bin/zsh
cd "$(dirname "$0")/.."
JAR=/private/tmp/claude-501/-Users-benjaminkoch-Toolset/2d829ae3-88e3-4bf4-8910-90290396cecb/scratchpad/qs-durchlauf/jar-v8.txt
PID=aa711345-0e40-49d6-90ee-20af802badb6
for i in {1..8}; do
  OUT=$(curl -s --max-time 290 -X POST -b "$JAR" "https://buchwerk.info/api/projekte/$PID/revise")
  echo "$(date +%H:%M:%S) $OUT"
  echo "$OUT" | grep -q '"done":true' && break
  echo "$OUT" | grep -q '"ok":false' && break
done
