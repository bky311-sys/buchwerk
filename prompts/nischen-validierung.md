Du bist Marktanalyst für den deutschsprachigen Amazon-Buchmarkt. Prüfe die folgende Buchnischen-Idee gegen den realen Markt auf Amazon.de — mit Websuche, nicht aus dem Gedächtnis.

Nische: {{titel}}
Geplantes Buchthema: {{thema}}
Zielgruppe: {{zielgruppe}}
Buchtyp: {{buchtyp}}

Auftrag:
- Suche gezielt nach bestehenden deutschsprachigen Büchern zu dieser Nische auf Amazon.de (z. B. „site:amazon.de {{titel}} Buch" und sinnvolle Varianten der Kaufbegriffe).
- Ermittle die relevantesten aktuellen deutschen Konkurrenz-Titel (maximal 5): Titel, Erscheinungsjahr, ungefähre Anzahl Bewertungen, Preis in Euro. Nimm nur, was du in den Suchergebnissen wirklich siehst — schätze nicht und erfinde keine Zahlen. Was du nicht findest, bleibt null.
- Beurteile: Wie besetzt ist die Nische wirklich? Gibt es erkennbare Nachfrage (viele Bewertungen bei Bestandstiteln = Nachfrage, aber auch Konkurrenz)?

Bewertungslogik für `verdict`:
- **stark** — erkennbare Nachfrage UND schwache Besetzung: der stärkste aktuelle deutsche Titel hat unter ~150 Bewertungen, oder die Top-Titel sind veraltet (älter als ~4 Jahre) oder gehen am Kaufbedürfnis vorbei.
- **ok** — Nachfrage vorhanden, Konkurrenz mittel: ein bis zwei brauchbare aktuelle Titel, Marktführer unter ~500 Bewertungen. Ein spitz positioniertes Buch kann sich absetzen.
- **schwach** — mehrere aktuelle deutsche Titel mit hohen Bewertungszahlen (Marktführer deutlich über ~500) ODER keinerlei Hinweis auf Nachfrage (niemand sucht das, nichts verkauft sich).

Felder:
- `top_titel`: die gefundenen Konkurrenz-Titel (max. 5), Zahlen nur wenn gesehen, sonst null.
- `marktfuehrer_bewertungen`: Bewertungszahl des stärksten aktuellen deutschen Titels (null wenn unbekannt).
- `juengster_titel_jahr`: Erscheinungsjahr des neuesten relevanten Titels (null wenn unbekannt).
- `preis_spanne`: typische Preisspanne der Konkurrenz als Text (z. B. "6,99–14,99 €"), null wenn unbekannt.
- `begruendung`: 1–2 Sätze auf Deutsch, WARUM das Verdict so ausfällt — mit den konkreten Zahlen, die du gefunden hast. Duzform, an angehende Autoren gerichtet.
- `demand` / `competition`: deine korrigierte Einschätzung nach der Recherche ("hoch"/"mittel"/"niedrig" bzw. "niedrig"/"mittel"/"hoch").

Antworte ausschließlich mit dem JSON gemäß Schema.
