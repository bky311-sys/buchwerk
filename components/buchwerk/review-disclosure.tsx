// Transparency block for shop reviews. Two obligations meet here:
//
// 1) § 5b Abs. 3 UWG — we must state whether and how we make sure reviews come
//    from people who actually used the product. The norm does not force us to
//    verify; it forces us to tell the truth about verifying. "We don't check" is
//    a lawful answer — claiming otherwise without adequate measures would hit
//    Anhang Nr. 23b (per-se prohibition). So this text says plainly that the
//    reading is self-declared. It must be rewritten the day the reader lands and
//    reading becomes measurable — see docs/LESEN-UND-BEWERTEN.md §5.1.
//
// 2) OLG Frankfurt 6 U 232/21 — incentivised reviews must be marked, and the
//    marking has to reach the AGGREGATE, not just the single review. Hence
//    <ReviewAggregateNote> next to the star average.
//
// Wording is deliberately plain and unflattering. A disclosure that reads like
// marketing is not a disclosure.

import { POINTS_PER_REVIEW } from "@/lib/shop/points";

// Sits directly under the star average.
export function ReviewAggregateNote() {
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      Enthält Bewertungen, für die Leser Punkte erhalten haben.
    </p>
  );
}

// Sits at the top of the review section.
export function ReviewDisclosure() {
  return (
    <div className="rounded-2xl border border-border bg-muted p-5">
      <h3 className="text-sm font-medium">So entstehen diese Bewertungen</h3>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        <li>
          Bewerten kann jede angemeldete Person, die angibt, das Buch zu lesen —
          frühestens zwei Stunden nach dieser Angabe.{" "}
          <strong className="font-medium text-foreground">
            Ob das Buch wirklich gelesen wurde, prüfen wir nicht nach.
          </strong>{" "}
          Die Angabe ist eine Selbstauskunft.
        </li>
        <li>
          Für eine Bewertung gibt es {POINTS_PER_REVIEW} Punkte — immer gleich
          viele, unabhängig von der Sternezahl. Punkte gelten nur innerhalb von
          Buchwerk (Sichtbarkeit im Buchshop). Sie sind nicht käuflich, nicht in
          Geld umwandelbar und nicht an Bewertungen außerhalb von Buchwerk
          gekoppelt.
        </li>
        <li>
          Der Autor des Buches entscheidet, ob eine Bewertung hier öffentlich
          erscheint, und muss eine Ablehnung begründen. Auf die Punkte des Lesers
          hat das keinen Einfluss.
        </li>
        <li>Eine Bewertung pro Person und Buch. Niemand bewertet sein eigenes Buch.</li>
      </ul>
    </div>
  );
}
