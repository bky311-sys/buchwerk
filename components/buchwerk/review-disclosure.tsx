// Transparency block for shop reviews. Two obligations meet here:
//
// 1) § 5b Abs. 3 UWG — we must state whether and how we make sure reviews come
//    from people who actually used the product. The norm does not force us to
//    verify; it forces us to tell the truth about verifying.
//    Since the reader shipped (15.07.2026) that answer changed: reading now
//    happens in our own reader and is measured, so this text describes the real
//    mechanism instead of admitting a self-declaration. Two limits stay in the
//    wording on purpose — we say "measured", never "proven", and we say what the
//    author can and cannot do. Overclaiming here would be Anhang Nr. 23b.
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
          <strong className="font-medium text-foreground">
            Bewerten kann nur, wer das Buch hier gelesen hat.
          </strong>{" "}
          Gelesen wird im Buchwerk-Reader; wir messen dabei je Kapitel, wie weit
          gelesen wurde und wie lange aktiv — und geben das Bewerten erst frei,
          wenn der größte Teil des Buches so gelesen wurde. Das ist eine
          Messung, kein Beweis: Wer sie umgehen will, kann das mit Aufwand. Sie
          macht Schummeln unattraktiver als Lesen, mehr behaupten wir nicht.
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
