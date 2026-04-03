// middleware.ts — Server-side auth gating (B2C-032)
// Checks for `b2c_authed` cookie set by the app on login.
// Appwrite session cookies are scoped to appwrite.io domain and invisible
// to Next.js middleware, so we use a same-origin signal cookie instead.
// ──────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";

// Must match the cookie name in lib/auth-cookie.ts
const AUTH_COOKIE_NAME = "b2c_authed";

// Routes that are always public (no auth required)
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/welcome",
  "/onboarding",
]);

// Route prefixes that require authentication
const PROTECTED_PREFIXES = [
  "/meal-plan",
  "/grocery-list",
  "/profile",
  "/nutrition",
  "/recipes",
  "/my-recipes",
  "/recipe-analyzer",
  "/create",
  "/search",
  "/favorites",
  "/saved",
  "/budget",
  "/history",
  "/meal-log",
  "/notifications",
  "/settings",
  "/scan",
  "/admin",
];

function isProtectedRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return false;
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip non-page routes: Next.js internals, API routes, static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/mock-api") ||
    pathname.startsWith("/_mock") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for auth signal cookie set by the app on login
  const hasAuth = request.cookies.has(AUTH_COOKIE_NAME);

  if (!hasAuth) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
