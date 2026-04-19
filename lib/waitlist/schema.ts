import { z } from "zod";

/**
 * Allowed entry points for waitlist signups. Keeps DB values controlled
 * so we can segment signups by placement later on.
 */
export const WAITLIST_SOURCES = ["landing_hero", "landing_footer"] as const;
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

export const waitlistPayloadSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Bitte gib deine Email-Adresse ein.")
    .max(254, "Diese Email ist zu lang.")
    .email("Das sieht nicht nach einer gültigen Email aus."),
  source: z.enum(WAITLIST_SOURCES),
});

export type WaitlistPayload = z.infer<typeof waitlistPayloadSchema>;
