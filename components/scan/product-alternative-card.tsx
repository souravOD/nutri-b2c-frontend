"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, TrendingDown } from "lucide-react"

interface ProductAlternative {
    productId: string
    name: string
    brand: string | null
    price: number | null
    imageUrl: string | null
    reason: string | null
    savings: number | null
    allergenSafe: boolean
}

export function ProductAlternativeCard({ alt }: { alt: ProductAlternative }) {
    return (
        <Card className="p-3">
            <div className="flex items-center gap-3">
                {alt.imageUrl ? (
                    <img src={alt.imageUrl} alt={alt.name} className="w-10 h-10 rounded object-cover" />
                ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                        No img
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{alt.name}</p>
                    {alt.brand && <p className="text-xs text-muted-foreground">{alt.brand}</p>}
                    <div className="flex flex-wrap gap-1 mt-1">
                        {alt.allergenSafe && (
                            <Badge variant="outline" className="text-[10px] text-green-700 dark:text-green-400">
                                <ShieldCheck className="w-3 h-3 mr-0.5" />
                                Allergen-safe
                            </Badge>
                        )}
                        {alt.reason && !alt.reason.toLowerCase().includes("allergen") && (
                            <Badge variant="outline" className="text-[10px]">
                                {alt.reason}
                            </Badge>
                        )}
                        {alt.savings != null && alt.savings > 0 && (
                            <Badge variant="secondary" className="text-[10px] text-green-700 dark:text-green-400">
                                <TrendingDown className="w-3 h-3 mr-0.5" />
                                Save ${alt.savings.toFixed(2)}
                            </Badge>
                        )}
                    </div>
                </div>
                {alt.price != null && (
                    <span className="text-sm font-medium shrink-0">${alt.price.toFixed(2)}</span>
                )}
            </div>
        </Card>
    )
}
