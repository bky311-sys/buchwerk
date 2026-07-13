"use server";

import { z } from "zod";
import { sendWithdrawalEmails } from "@/lib/email/resend";

// EU 2023/2673 limits the mandatory fields to name, contract identification and
// an electronic contact for the receipt confirmation.
const schema = z.object({
  name: z.string().trim().min(1, "Bitte gib deinen Namen an.").max(200),
  contract: z
    .string()
    .trim()
    .min(1, "Bitte identifiziere den Vertrag (z. B. Bestellnummer, Kauf-E-Mail + Datum).")
    .max(500),
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse an."),
});

export type WiderrufState = { ok: boolean; error?: string };

export async function submitWithdrawalAction(fields: {
  name: string;
  contract: string;
  email: string;
}): Promise<WiderrufState> {
  const parsed = schema.safeParse(fields);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Angaben.",
    };
  }

  const when = new Date().toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
  });
  const result = await sendWithdrawalEmails({ ...parsed.data, when });
  if (!result.ok) {
    return {
      ok: false,
      error:
        "Die Eingangsbestätigung konnte nicht versendet werden. Bitte versuch es erneut oder schreib direkt an welcome@buchwerk.info.",
    };
  }
  return { ok: true };
}
