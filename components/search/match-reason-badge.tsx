"use client"

import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

export function MatchReasonBadge({ reason }: { reason: string }) {
    return (
        <Badge variant="outline" className="text-xs gap-1 bg-primary/5 border-primary/20">
            <Sparkles className="w-3 h-3 text-primary" />
            {reason}
        </Badge>
    )
}
