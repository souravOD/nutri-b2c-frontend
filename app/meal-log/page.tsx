"use client";

import { useEffect, useMemo } from "react";
import { DailyView } from "@/components/meal-log/daily-view";
import { useHouseholdMembers } from "@/hooks/use-household";
import { useSelectedMember } from "@/hooks/use-selected-member";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MealLogPage() {
  const { members } = useHouseholdMembers();
  const defaultMember = useMemo(
    () => members.find((m) => m.isProfileOwner) ?? members[0] ?? null,
    [members]
  );
  const { memberId: selectedMemberId, setMemberId: setSelectedMemberId } = useSelectedMember(
    defaultMember?.id
  );

  useEffect(() => {
    if (!selectedMemberId && defaultMember?.id) {
      setSelectedMemberId(defaultMember.id);
    }
  }, [selectedMemberId, defaultMember?.id, setSelectedMemberId]);

  return (
    <main className="container mx-auto max-w-2xl px-4 py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Meal Log</h1>
        {members.length > 1 ? (
          <Select value={selectedMemberId} onValueChange={(v) => setSelectedMemberId(v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.firstName || m.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
      <DailyView memberId={selectedMemberId} />
    </main>
  );
}
