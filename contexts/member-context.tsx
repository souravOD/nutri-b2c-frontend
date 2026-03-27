"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";

interface MemberContextValue {
  activeMemberId: string | null;
  setActiveMember: (id: string) => void;
  clearActiveMember: () => void;
  /** Call when user identity is known (login/app init) to scope storage per user */
  setUserId: (uid: string) => void;
}

const MemberContext = createContext<MemberContextValue>({
  activeMemberId: null,
  setActiveMember: () => {},
  clearActiveMember: () => {},
  setUserId: () => {},
});

function storageKey(uid: string | null) {
  return uid ? `activeMemberId_${uid}` : "activeMemberId";
}

export function MemberProvider({ children }: { children: ReactNode }) {
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey(userIdRef.current));
      if (stored) setActiveMemberId(stored);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setUserId = useCallback((uid: string) => {
    const prevKey = storageKey(userIdRef.current);
    userIdRef.current = uid;
    const newKey = storageKey(uid);
    // Migrate: if switching user, drop the old key's value from state
    if (prevKey !== newKey) {
      try {
        const stored = localStorage.getItem(newKey);
        setActiveMemberId(stored);
      } catch {
        setActiveMemberId(null);
      }
    }
  }, []);

  const setActiveMember = useCallback((id: string) => {
    setActiveMemberId(id);
    try { localStorage.setItem(storageKey(userIdRef.current), id); } catch {}
  }, []);

  const clearActiveMember = useCallback(() => {
    setActiveMemberId(null);
    try { localStorage.removeItem(storageKey(userIdRef.current)); } catch {}
  }, []);

  return (
    <MemberContext.Provider value={{ activeMemberId, setActiveMember, clearActiveMember, setUserId }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useActiveMember() {
  return useContext(MemberContext);
}

