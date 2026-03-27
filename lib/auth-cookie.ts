// lib/auth-cookie.ts — B2C-032: Same-origin auth signal cookie for Next.js middleware
// Appwrite session cookies are scoped to appwrite.io domain and invisible to
// Next.js middleware on localhost/our domain. This lightweight cookie signals
// "user is logged in" so middleware can gate protected routes.

const COOKIE_NAME = "b2c_authed";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days (matches Appwrite session TTL)

/**
 * Set the auth signal cookie after successful login.
 * Call this on the client after `account.createEmailPasswordSession()` succeeds.
 */
export function setAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

/**
 * Clear the auth signal cookie on logout.
 * Call this on the client before/after `account.deleteSession("current")`.
 */
export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

/** Cookie name — exported for middleware to reference */
export const AUTH_COOKIE_NAME = COOKIE_NAME;
