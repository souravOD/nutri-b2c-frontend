// components/InactivityGuard.tsx
// HIPAA §164.312(a)(2)(iii) — Automatic logoff after period of inactivity
// ────────────────────────────────────────────────────────────────────────
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";

const TIMEOUT_MINUTES = Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES) || 30;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

export function InactivityGuard() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {
      // Safe to ignore — HttpOnly cookie clear failed (network issue),
      // we still want to delete the Appwrite session.
    }
    try {
      await account.deleteSession("current");
    } catch {
      // Session may already be expired — proceed to login
    }
    router.replace("/login?reason=timeout");
  }, [router]);

  useEffect(() => {
    const reset = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [logout]);

  return null;
}
