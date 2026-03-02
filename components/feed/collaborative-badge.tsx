"use client"

import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

export function CollaborativeBadge() {
    return (
        <Badge variant="outline" className="text-xs gap-1">
            <Users className="w-3 h-3" />
            Users like you enjoyed this
        </Badge>
    )
}
