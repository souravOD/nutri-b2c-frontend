"use client"

import { X } from "lucide-react"

interface FilterChipProps {
    label: string
    onRemove: () => void
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#99CC33] bg-[#F0F7E6] text-[13px] font-semibold text-[#538100] whitespace-nowrap">
            {label}
            <button
                type="button"
                onClick={onRemove}
                className="ml-0.5 rounded-full hover:bg-[#99CC33]/20 transition-colors p-0.5"
                aria-label={`Remove ${label} filter`}
            >
                <X className="w-3 h-3" />
            </button>
        </span>
    )
}
