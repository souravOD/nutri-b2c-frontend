"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowRightLeft, Loader2 } from "lucide-react"
import { SubstitutionCard } from "@/components/shared/substitution-card"
import { fetchIngredientSubstitutions, type SubstitutionItem } from "@/lib/substitution-api"

interface IngredientSubstitutionProps {
    ingredientId: string
    memberId?: string
}

export function IngredientSubstitution({ ingredientId, memberId }: IngredientSubstitutionProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [subs, setSubs] = useState<SubstitutionItem[]>([])

    useEffect(() => {
        if (!open) return
        setLoading(true)
        fetchIngredientSubstitutions(ingredientId, memberId)
            .then(data => setSubs(data.substitutions))
            .catch(() => setSubs([]))
            .finally(() => setLoading(false))
    }, [open, ingredientId, memberId])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Substitutions">
                    <ArrowRightLeft className="w-3 h-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <h4 className="font-medium text-sm mb-2">Substitutions</h4>
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                ) : subs.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No substitutions available</p>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {subs.map((sub, i) => (
                            <SubstitutionCard key={sub.ingredient_id ?? i} sub={sub} />
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
