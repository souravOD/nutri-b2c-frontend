"use client";

interface NutritionRingProps {
  current: number;
  goal: number | null;
}

export function NutritionRing({ current, goal }: NutritionRingProps) {
  const effective = goal && goal > 0 ? goal : 2000;
  const pct = Math.min((current / effective) * 100, 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const overGoal = goal != null && current > goal * 1.1;
  const strokeColor = overGoal
    ? "stroke-destructive"
    : pct >= 80
      ? "stroke-green-500"
      : "stroke-primary";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            className={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">
            {current.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            / {(goal ?? effective).toLocaleString()} cal
          </span>
        </div>
      </div>
    </div>
  );
}
