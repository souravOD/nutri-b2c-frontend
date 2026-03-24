"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface MemberContextValue {
  activeMemberId: string | null;
  setActiveMember: (id: string) => void;
  clearActiveMember: () => void;
}

const MemberContext = createContext<MemberContextValue>({
  activeMemberId: null,
  setActiveMember: () => {},
  clearActiveMember: () => {},
});

export function MemberProvider({ children }: { children: ReactNode }) {
  const [activeMemberId, setActiveMemberId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem("activeMemberId"); } catch { return null; }
  });

  const setActiveMember = useCallback((id: string) => {
    setActiveMemberId(id);
    try { localStorage.setItem("activeMemberId", id); } catch {}
  }, []);

  const clearActiveMember = useCallback(() => {
    setActiveMemberId(null);
    try { localStorage.removeItem("activeMemberId"); } catch {}
  }, []);

  return (
    <MemberContext.Provider value={{ activeMemberId, setActiveMember, clearActiveMember }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useActiveMember() {
  return useContext(MemberContext);
}
