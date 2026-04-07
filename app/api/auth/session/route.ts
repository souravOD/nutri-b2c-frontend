// app/api/auth/session/route.ts — Server-side HttpOnly auth cookie management
// B2C-COMPLIANCE: Replaces client-side document.cookie for XSS protection
import { NextResponse } from "next/server";

const COOKIE_NAME = "b2c_authed";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** POST — Set the auth signal cookie after login */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

/** DELETE — Clear the auth signal cookie on logout */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
