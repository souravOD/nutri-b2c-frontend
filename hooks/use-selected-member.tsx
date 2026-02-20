"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "selectedMemberId";

export function useSelectedMember(defaultMemberId?: string) {
  const [memberId, setMemberId] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) || undefined;
      if (stored) {
        setMemberId(stored);
        return;
      }
    } catch {}

    if (defaultMemberId) setMemberId(defaultMemberId);
  }, [defaultMemberId]);

  useEffect(() => {
    if (!memberId) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, memberId);
    } catch {}
  }, [memberId]);

  return { memberId, setMemberId };
}

