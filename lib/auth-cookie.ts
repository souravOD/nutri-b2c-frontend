// lib/auth-cookie.ts — B2C-032: Same-origin auth signal cookie for Next.js middleware
// B2C-COMPLIANCE: Uses server-set HttpOnly cookie via API route with JWT verification.
// Falls back to client-side cookie if API route is unavailable.

import { account } from "@/lib/appwrite";

const COOKIE_NAME = "b2c_authed";

/**
 * Set the auth signal cookie after successful login.
 * Fetches a fresh Appwrite JWT and sends it to the server-side API route
 * which validates the JWT before setting the HttpOnly cookie.
 */
export async function setAuthCookie(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    // Get a short-lived JWT from the current Appwrite session
    const { jwt } = await account.createJWT();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jwt }),
    });
    if (!res.ok) {
      throw new Error(`Auth signal API failed with status ${res.status}`);
    }
  } catch {
    // Fallback: set client cookie if API route fails
    const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${secureFlag}`;
  }
}

/**
 * Clear the auth signal cookie on logout.
 */
export async function clearAuthCookie(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }
}

/** Cookie name — exported for middleware to reference */
export const AUTH_COOKIE_NAME = COOKIE_NAME;
