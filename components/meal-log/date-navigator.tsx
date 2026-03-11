"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateNavigatorProps {
  date: string;
  onChange: (date: string) => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DateNavigator({ date, onChange }: DateNavigatorProps) {
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={() => onChange(addDays(date, -1))}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="flex flex-col items-center">
        <button
          className="text-lg font-semibold hover:underline"
          onClick={() => onChange(today)}
        >
          {formatDate(date)}
        </button>
        {!isToday && (
          <span className="text-xs text-muted-foreground">
            {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(addDays(date, 1))}
        disabled={date >= today}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
