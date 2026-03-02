"use client"

import { useState, useCallback } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Loader2 } from "lucide-react"
import { SubstitutionCard } from "./substitution-card"

interface Substitution {
    productId: string
    name: string
    brand: string | null
    price: number | null
    imageUrl: string | null
    substitutionReason: string | null
    savingsVsCurrent: number | null
}

interface SubstitutionDrawerProps {
    listId: string
    itemId: string
    itemName: string
    onAccept: (productId: string) => void
}

export function SubstitutionDrawer({ listId, itemId, itemName, onAccept }: SubstitutionDrawerProps) {
    const [open, setOpen] = useState(false)
    const [subs, setSubs] = useState<Substitution[]>([])
    const [loading, setLoading] = useState(false)

    const fetchSubs = useCallback(async () => {
        if (subs.length > 0) return
        setLoading(true)
        try {
            const res = await fetch(`/api/v1/grocery-lists/${listId}/items/${itemId}/substitutions`, {
                credentials: "include",
            })
            if (res.ok) {
                const data = await res.json()
                setSubs(data.substitutions ?? [])
            }
        } catch {
            // silently fail — no substitutions
        } finally {
            setLoading(false)
        }
    }, [listId, itemId, subs.length])

    return (
        <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchSubs() }}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5">
                    <ArrowLeftRight className="h-3 w-3 mr-0.5" />
                    Alternatives
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[50vh]">
                <SheetHeader>
                    <SheetTitle className="text-sm">Alternatives for {itemName}</SheetTitle>
                </SheetHeader>
                <div className="mt-3 space-y-2 overflow-y-auto max-h-[35vh] pr-1">
                    {loading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : subs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No substitution suggestions available.
                        </p>
                    ) : (
                        subs.map((sub) => (
                            <SubstitutionCard
                                key={sub.productId}
                                {...sub}
                                onAccept={(pid) => {
                                    onAccept(pid)
                                    setOpen(false)
                                }}
                            />
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
