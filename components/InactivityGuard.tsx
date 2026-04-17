// components/InactivityGuard.tsx
// HIPAA §164.312(a)(2)(iii) — Automatic logoff after period of inactivity
// ────────────────────────────────────────────────────────────────────────
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useUser } from "@/hooks/use-user";
import { clearJwtCache } from "@/lib/api/core";

const TIMEOUT_MINUTES = Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES) || 30;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

export function InactivityGuard() {
  const { signOut } = useUser();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const logout = useCallback(async () => {
    // Clear cached JWT immediately to prevent stale token reuse after re-login
    clearJwtCache();
    try {
      await signOut();
    } catch {
      // signOut() does window.location.href = "/login" internally.
      // If it throws before the redirect, force a hard navigation here.
    }
    // Fallback: if signOut didn't redirect (e.g., error before window.location),
    // force a hard page load to fully reset React state.
    if (typeof window !== "undefined") {
      window.location.href = "/login?reason=timeout";
    }
  }, [signOut]);

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
