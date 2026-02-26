"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SubstitutionProps {
    productId: string
    name: string
    brand: string | null
    price: number | null
    imageUrl: string | null
    substitutionReason: string | null
    savingsVsCurrent: number | null
    onAccept: (productId: string) => void
}

export function SubstitutionCard({ productId, name, brand, price, imageUrl, substitutionReason, savingsVsCurrent, onAccept }: SubstitutionProps) {
    return (
        <Card className="p-3">
            <div className="flex items-center gap-3">
                {imageUrl ? (
                    <img src={imageUrl} alt={name} className="w-12 h-12 rounded object-cover" />
                ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No img
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{name}</p>
                    {brand && <p className="text-xs text-muted-foreground">{brand}</p>}
                    <div className="flex flex-wrap gap-1 mt-1">
                        {substitutionReason && (
                            <Badge variant="outline" className="text-xs">
                                {substitutionReason}
                            </Badge>
                        )}
                        {savingsVsCurrent != null && savingsVsCurrent > 0 && (
                            <Badge variant="secondary" className="text-xs text-green-700 dark:text-green-400">
                                Save ${savingsVsCurrent.toFixed(2)}
                            </Badge>
                        )}
                    </div>
                    {price != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">${price.toFixed(2)}</p>
                    )}
                </div>
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => onAccept(productId)}>
                    Swap
                </Button>
            </div>
        </Card>
    )
}
