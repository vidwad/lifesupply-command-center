"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/server/auth";

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");
  // Phase 11C hardening: accept only same-origin path redirects. Auth.js's
  // default redirect callback already rejects cross-origin URLs; this makes
  // the constraint explicit and blocks protocol-relative ("//host") values.
  const rawRedirect = String(formData.get("redirectTo") ?? "/dashboard");
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/dashboard";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
    return undefined;
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    // Next.js redirect throws a special error that must be re-thrown.
    throw err;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
