"use client";

import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WaterTrackerProps {
  currentMl: number;
  goalMl: number;
  onAdd: (ml: number) => void;
}

const GLASS_ML = 250;

export function WaterTracker({ currentMl, goalMl, onAdd }: WaterTrackerProps) {
  const glasses = Math.floor(currentMl / GLASS_ML);
  const goalGlasses = Math.ceil(goalMl / GLASS_ML);
  const displayGlasses = Math.max(goalGlasses, 8);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Water</span>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {currentMl} / {goalMl} ml
        </span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {Array.from({ length: displayGlasses }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (i >= glasses) onAdd(GLASS_ML);
            }}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
              i < glasses
                ? "bg-blue-500 border-blue-500 text-white"
                : "border-muted-foreground/30 text-muted-foreground hover:border-blue-400"
            }`}
            title={`${(i + 1) * GLASS_ML} ml`}
          >
            <Droplets className="h-3 w-3" />
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onAdd(GLASS_ML)}>
          +{GLASS_ML}ml
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAdd(500)}>
          +500ml
        </Button>
      </div>
    </div>
  );
}
