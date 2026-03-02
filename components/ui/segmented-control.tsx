"use client"

import { cn } from "@/lib/utils"

interface SegmentedControlOption {
    value: string
    label: string
    disabled?: boolean
}

interface SegmentedControlProps {
    options: SegmentedControlOption[]
    value: string
    onChange: (value: string) => void
    size?: "sm" | "md"
    className?: string
}

export function SegmentedControl({
    options,
    value,
    onChange,
    size = "md",
    className,
}: SegmentedControlProps) {
    return (
        <div
            className={cn(
                "inline-flex flex-wrap gap-2",
                className,
            )}
        >
            {options.map((opt) => {
                const active = opt.value === value
                return (
                    <button
                        key={opt.value}
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "rounded-full border transition-all font-semibold",
                            size === "sm"
                                ? "px-4 py-1.5 text-[12px]"
                                : "px-5 py-2 text-[14px]",
                            active
                                ? "border-[#538100] bg-[#F0F7E6] text-[#538100]"
                                : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]",
                            opt.disabled && "opacity-40 cursor-not-allowed",
                        )}
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        {opt.label}
                    </button>
                )
            })}
        </div>
    )
}
