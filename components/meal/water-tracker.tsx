"use client"

import { cn } from "@/lib/utils"

interface WaterTrackerProps {
    current: number      // glasses filled
    target?: number      // total glasses (default 8)
    onToggle: (glasses: number) => void
}

function GlassIcon({ filled, className }: { filled: boolean; className?: string }) {
    return (
        <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M7 4h14l-2 20H9L7 4z"
                fill={filled ? "#99CC33" : "none"}
                stroke={filled ? "#538100" : "#CBD5E1"}
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                d="M6 4h16"
                stroke={filled ? "#538100" : "#CBD5E1"}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    )
}

export function WaterTracker({ current, target = 8, onToggle }: WaterTrackerProps) {
    const mlPerGlass = 250
    const totalMl = current * mlPerGlass / 1000

    const handleClick = (index: number) => {
        // Toggle: if clicking the last filled glass, decrement; otherwise set to index+1
        const newCount = index + 1 === current ? current - 1 : index + 1
        onToggle(newCount)
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span
                    className="text-[14px] font-semibold text-[#0F172A]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    Water Intake
                </span>
                <span
                    className="text-[13px] font-medium text-[#64748B]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {current}/{target} glasses ({totalMl.toFixed(1)}L)
                </span>
            </div>
            <div className="flex gap-1.5">
                {Array.from({ length: target }).map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => handleClick(i)}
                        className={cn(
                            "rounded-md p-0.5 transition-transform hover:scale-110",
                            i < current ? "opacity-100" : "opacity-60",
                        )}
                        aria-label={`Glass ${i + 1}${i < current ? " (filled)" : " (empty)"}`}
                    >
                        <GlassIcon filled={i < current} />
                    </button>
                ))}
            </div>
        </div>
    )
}
