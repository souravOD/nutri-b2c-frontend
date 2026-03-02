"use client"

import { Badge } from "@/components/ui/badge"

interface RecipeResultCardProps {
    id: string
    title: string
    score?: number
}

export function RecipeResultCard({ title, score }: RecipeResultCardProps) {
    return (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-sm font-medium truncate">{title}</span>
            {score != null && (
                <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                    {Math.round(score * 100)}%
                </Badge>
            )}
        </div>
    )
}
