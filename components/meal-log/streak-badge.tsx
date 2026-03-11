"use client";

import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StreakInfo } from "@/lib/types";

interface StreakBadgeProps {
  streak: StreakInfo | null;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const current = streak?.currentStreak ?? 0;
  if (current <= 0) return null;

  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-1 px-3 py-1 text-sm font-medium"
    >
      <Flame className="h-4 w-4 text-orange-500" />
      <span className="tabular-nums">{current}</span>
      <span className="text-muted-foreground">day streak</span>
    </Badge>
  );
}
