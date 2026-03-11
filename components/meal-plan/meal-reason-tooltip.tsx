"use client"

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"

export function MealReasonTooltip({ reasons }: { reasons: string[] }) {
    if (!reasons.length) return null

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button className="inline-flex" aria-label="Why this recipe?">
                    <Info className="w-3 h-3 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
                <p className="text-sm font-medium">Why this recipe?</p>
                <ul className="text-xs mt-1 space-y-0.5">
                    {reasons.map(r => <li key={r}>• {r}</li>)}
                </ul>
            </TooltipContent>
        </Tooltip>
    )
}
