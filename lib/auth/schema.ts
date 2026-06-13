import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Bitte gib deine E-Mail-Adresse ein.")
  .max(254, "Diese E-Mail-Adresse ist zu lang.")
  .email("Das sieht nicht nach einer gültigen E-Mail aus.");

// 72 bytes is bcrypt's hard limit — characters beyond it are silently ignored,
// so we reject longer passwords instead of letting them be truncated.
const password = z
  .string()
  .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein.")
  .max(72, "Das Passwort darf höchstens 72 Zeichen lang sein.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Bitte gib dein Passwort ein."),
});

export const registerSchema = z
  .object({
    email,
    password,
    passwortWiederholen: z.string().min(1, "Bitte wiederhole dein Passwort."),
  })
  .refine((data) => data.password === data.passwortWiederholen, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwortWiederholen"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
