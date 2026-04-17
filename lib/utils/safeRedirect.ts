// lib/utils/safeRedirect.ts
// SEC-2: Validates that a redirect URL is a safe relative path.
// Prevents open redirect attacks via ?next= or ?redirect= params.

/**
 * Returns the redirect URL if it's a safe relative path,
 * otherwise returns the fallback.
 */
export function safeRedirect(url: string | null, fallback: string): string {
  if (!url) return fallback

  // Must start with / and NOT start with // (protocol-relative URL)
  if (!url.startsWith("/") || url.startsWith("//")) return fallback

  // Block protocol schemes embedded anywhere
  if (url.includes("://")) return fallback

  // Block path traversal sequences
  if (url.includes("..")) return fallback

  // Block encoded variants
  try {
    const decoded = decodeURIComponent(url)
    if (decoded.includes("://") || decoded.startsWith("//") || decoded.includes("..")) return fallback
  } catch {
    return fallback
  }

  return url
}
