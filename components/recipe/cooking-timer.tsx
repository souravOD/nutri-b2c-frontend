"use client"

import { Play, Pause, RotateCcw, Volume2 } from "lucide-react"
import { useCookingTimer, formatTimer } from "@/hooks/use-cooking-timer"

/* ─── Inline Timer (Recipe Detail step cards) ─── */

interface InlineTimerProps {
    durationSeconds: number
    label?: string
}

export function InlineTimer({ durationSeconds, label }: InlineTimerProps) {
    const timer = useCookingTimer(durationSeconds)

    return (
        <div className="mt-3 bg-[#F0F7E6] rounded-[16px] px-4 py-3 flex items-center gap-3">
            {/* Timer icon ring */}
            <div className="w-10 h-10 rounded-full bg-[#0F172A] flex items-center justify-center">
                <span className="text-white text-[13px] font-bold font-mono">{timer.formattedTime}</span>
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase text-[#538100] tracking-wider">
                    {label || "BOIL TIMER"}
                </p>
            </div>

            {/* Controls */}
            <button
                type="button"
                onClick={timer.isRunning ? timer.pause : timer.start}
                className={`
          px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors
          ${timer.isComplete
                        ? "bg-[#99CC33]/20 text-[#538100]"
                        : timer.isRunning
                            ? "bg-[#FFA500] text-white"
                            : "bg-[#99CC33] text-white"
                    }
        `}
            >
                {timer.isComplete ? "Done!" : timer.isRunning ? "Pause" : "Start Timer"}
            </button>

            <button
                type="button"
                onClick={timer.reset}
                className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors"
                aria-label="Reset timer"
            >
                <RotateCcw className="w-3.5 h-3.5 text-[#475569]" />
            </button>
        </div>
    )
}

/* ─── Full Circular Timer (Cooking Mode) ─── */

interface CircularTimerProps {
    durationSeconds: number
}

export function CircularTimer({ durationSeconds }: CircularTimerProps) {
    const timer = useCookingTimer(durationSeconds)

    // SVG circle params
    const size = 220
    const stroke = 8
    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference * (1 - timer.progress / 100)

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Circular ring */}
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    {/* Background ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth={stroke}
                    />
                    {/* Progress ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#99CC33"
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                    />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[48px] font-bold text-[#0F172A] font-mono tabular-nums leading-none">
                        {timer.formattedTime}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mt-1">
                        REMAINING
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={timer.reset}
                    className="w-12 h-12 rounded-full border-2 border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
                    aria-label="Reset"
                >
                    <RotateCcw className="w-5 h-5 text-[#64748B]" />
                </button>

                <button
                    type="button"
                    onClick={timer.isRunning ? timer.pause : timer.start}
                    className="w-14 h-14 rounded-full bg-[#99CC33] flex items-center justify-center shadow-lg hover:bg-[#8ABB2A] transition-colors"
                    aria-label={timer.isRunning ? "Pause" : "Play"}
                >
                    {timer.isRunning ? (
                        <Pause className="w-6 h-6 text-white" fill="white" />
                    ) : (
                        <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                    )}
                </button>

                <button
                    type="button"
                    className="w-12 h-12 rounded-full border-2 border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
                    aria-label="Sound"
                >
                    <Volume2 className="w-5 h-5 text-[#64748B]" />
                </button>
            </div>
        </div>
    )
}

/* ─── No Timer Display (for steps without timers) ─── */

export function NoTimerPlaceholder() {
    return (
        <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative" style={{ width: 180, height: 180 }}>
                <svg width={180} height={180} className="-rotate-90">
                    <circle cx={90} cy={90} r={82} fill="none" stroke="#F1F5F9" strokeWidth={8} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-medium text-[#CBD5E1]">No timer</span>
                    <span className="text-[12px] text-[#CBD5E1]">for this step</span>
                </div>
            </div>
        </div>
    )
}
