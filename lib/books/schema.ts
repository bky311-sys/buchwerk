import { z } from "zod";

export const newProjectSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, "Bitte beschreibe das Thema in ein paar Worten.")
    .max(500, "Das Thema ist zu lang."),
  audience: z
    .string()
    .trim()
    .max(300, "Die Zielgruppe ist zu lang.")
    .optional()
    .or(z.literal("")),
});

export type NewProjectInput = z.infer<typeof newProjectSchema>;

// JSON schema sent to Claude to constrain the outline response.
// Structured outputs don't support array min/max — the count is requested in
// the prompt text instead.
export const OUTLINE_JSON_SCHEMA = {
  type: "object",
  properties: {
    titel: { type: "string" },
    kapitel: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ueberschrift: { type: "string" },
          zusammenfassung: { type: "string" },
        },
        required: ["ueberschrift", "zusammenfassung"],
        additionalProperties: false,
      },
    },
  },
  required: ["titel", "kapitel"],
  additionalProperties: false,
} as const;

// Validates Claude's outline response before we persist it.
export const outlineSchema = z.object({
  titel: z.string().min(1),
  kapitel: z
    .array(
      z.object({
        ueberschrift: z.string().min(1),
        zusammenfassung: z.string(),
      }),
    )
    .min(1),
});

export type Outline = z.infer<typeof outlineSchema>;
