"use client"

import { Badge } from "@/components/ui/badge"
import { Sparkles, Shield, TrendingUp, Utensils } from "lucide-react"

const ICONS: Record<string, typeof Sparkles> = {
    diet: Utensils,
    allergen: Shield,
    nutritional: TrendingUp,
    default: Sparkles,
}

export function RecommendationReason({ reason }: { reason: string }) {
    const lc = reason.toLowerCase()
    const type = lc.includes("diet") ? "diet"
        : lc.includes("allergen") ? "allergen"
            : lc.includes("protein") || lc.includes("gap") || lc.includes("calori") ? "nutritional"
                : "default"
    const Icon = ICONS[type]

    return (
        <Badge variant="secondary" className="text-xs gap-1">
            <Icon className="w-3 h-3" />
            {reason}
        </Badge>
    )
}
