// lib/auth-cookie.ts — B2C-032: Same-origin auth signal cookie for Next.js middleware
// B2C-COMPLIANCE: Now uses server-set HttpOnly cookie via API route for XSS protection.
// Falls back to client-side cookie if API route is unavailable.

const COOKIE_NAME = "b2c_authed";

/**
 * Set the auth signal cookie after successful login.
 * Makes a request to the server-side API route which sets an HttpOnly cookie.
 */
export async function setAuthCookie(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/auth/session", { method: "POST" });
  } catch {
    // Fallback: set non-HttpOnly cookie if API route fails
    document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
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
