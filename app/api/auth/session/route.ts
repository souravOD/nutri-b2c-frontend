// app/api/auth/session/route.ts — Server-side HttpOnly auth cookie management
// B2C-COMPLIANCE: Validates Appwrite JWT before setting cookie (defense-in-depth)
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "b2c_authed";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const AW_ENDPOINT = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "").replace(/\/+$/, "");
const AW_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT ?? "";

/**
 * POST — Set the auth signal cookie after login.
 * Requires a valid Appwrite JWT in the request body for verification.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const jwt = body?.jwt;

    if (!jwt || typeof jwt !== "string") {
      return NextResponse.json(
        { ok: false, error: "JWT required" },
        { status: 401 }
      );
    }

    // Verify JWT against Appwrite — if account.get() succeeds, the JWT is valid
    const verifyRes = await fetch(`${AW_ENDPOINT}/account`, {
      headers: {
        "X-Appwrite-Project": AW_PROJECT,
        "X-Appwrite-JWT": jwt,
        "Content-Type": "application/json",
      },
    });

    if (!verifyRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired JWT" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}

/** DELETE — Clear the auth signal cookie on logout (safe for anyone) */
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
