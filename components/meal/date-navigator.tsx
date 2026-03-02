"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface DateNavigatorProps {
    date: Date
    onChange: (date: Date) => void
}

function formatDate(d: Date): string {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
}

function isToday(d: Date): boolean {
    const now = new Date()
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    )
}

export function DateNavigator({ date, onChange }: DateNavigatorProps) {
    const today = isToday(date)

    const shift = (days: number) => {
        const next = new Date(date)
        next.setDate(next.getDate() + days)
        onChange(next)
    }

    return (
        <div className="flex flex-col items-center gap-1 py-2">
            {today && (
                <span
                    className="text-[12px] font-bold text-[#538100] uppercase tracking-[1px]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    Today
                </span>
            )}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => shift(-1)}
                    className="p-1.5 rounded-full hover:bg-[#F1F5F9] transition-colors"
                    aria-label="Previous day"
                >
                    <ChevronLeft className="w-5 h-5 text-[#64748B]" />
                </button>
                <span
                    className="text-[16px] font-semibold text-[#0F172A] min-w-[200px] text-center"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {formatDate(date)}
                </span>
                <button
                    type="button"
                    onClick={() => shift(1)}
                    className="p-1.5 rounded-full hover:bg-[#F1F5F9] transition-colors"
                    aria-label="Next day"
                >
                    <ChevronRight className="w-5 h-5 text-[#64748B]" />
                </button>
            </div>
        </div>
    )
}
