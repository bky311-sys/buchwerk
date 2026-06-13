"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  resetRequestSchema,
  newPasswordSchema,
} from "@/lib/auth/schema";

export type AuthState = {
  error: string | null;
  success?: boolean;
};

// Only allow same-site relative redirect targets — guards against an attacker
// crafting /anmelden?weiter=https://evil.example to bounce users off-site.
function sanitizeNext(value: FormDataEntryValue | null): string {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }
  return "/dashboard";
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingabe.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
  });
  if (error) {
    // Deliberately vague so we don't reveal whether the email exists.
    return { error: "E-Mail-Adresse oder Passwort ist nicht korrekt." };
  }

  redirect(sanitizeNext(formData.get("weiter")));
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    passwortWiederholen: formData.get("passwortWiederholen"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingabe.",
    };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    return {
      error:
        "Die Registrierung ist fehlgeschlagen. Versuch es in einem Moment noch einmal.",
    };
  }

  // If email confirmation is disabled in Supabase, signUp returns a session
  // immediately and the user is logged in right away.
  if (data.session) {
    redirect("/dashboard");
  }

  // Email confirmation enabled: no session yet, user must click the link.
  return { error: null, success: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/anmelden");
}

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingabe.",
    };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  // We ignore the error on purpose and always report success, so the form
  // cannot be used to probe which addresses have an account.
  await supabase.auth.resetPasswordForEmail(parsed.data.email.toLowerCase(), {
    redirectTo: `${origin}/auth/callback?next=/passwort-neu`,
  });

  return { error: null, success: true };
}

export async function updatePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    passwortWiederholen: formData.get("passwortWiederholen"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingabe.",
    };
  }

  const supabase = await createClient();
  // Requires the recovery session set by /auth/callback after the email link.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error:
        "Dein Link ist abgelaufen. Fordere einen neuen Link zum Zurücksetzen an.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      error:
        "Das Passwort konnte nicht gesetzt werden. Versuch es in einem Moment noch einmal.",
    };
  }

  redirect("/dashboard");
}
