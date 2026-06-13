import { z } from "zod";

// JSON schema sent to Claude. Counts (7 keywords, 2-3 categories) are requested
// in the prompt text — structured outputs don't enforce array lengths.
export const LISTING_JSON_SCHEMA = {
  type: "object",
  properties: {
    titel: { type: "string" },
    untertitel: { type: "string" },
    beschreibung: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    kategorien: { type: "array", items: { type: "string" } },
    preis_empfehlung: { type: "number" },
    preis_begruendung: { type: "string" },
  },
  required: [
    "titel",
    "untertitel",
    "beschreibung",
    "keywords",
    "kategorien",
    "preis_empfehlung",
    "preis_begruendung",
  ],
  additionalProperties: false,
} as const;

export const listingSchema = z.object({
  titel: z.string(),
  untertitel: z.string(),
  beschreibung: z.string(),
  keywords: z.array(z.string()),
  kategorien: z.array(z.string()),
  preis_empfehlung: z.number(),
  preis_begruendung: z.string(),
});

export type Listing = z.infer<typeof listingSchema>;
