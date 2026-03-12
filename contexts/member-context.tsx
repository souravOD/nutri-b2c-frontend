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
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  const setActiveMember = useCallback((id: string) => {
    setActiveMemberId(id);
  }, []);

  const clearActiveMember = useCallback(() => {
    setActiveMemberId(null);
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
