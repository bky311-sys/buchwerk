-- Nachtrag zu 20260825110000: Die Spaltenrechte der Security-Härtung wachsen
-- nicht automatisch mit — ohne UPDATE-Grant scheiterte JEDES Kapitel-Update
-- des User-Clients (42501, still verschluckt): Kapitel blieben "offen",
-- obwohl der Lauf ok meldete (Prod-Befund 26.08.).
grant update (generation_step) on public.chapters to authenticated;
