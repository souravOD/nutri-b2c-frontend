"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"

interface ActionConfirmationProps {
    prompt: string
    onConfirm: () => void
    onCancel: () => void
}

export function ActionConfirmation({ prompt, onConfirm, onCancel }: ActionConfirmationProps) {
    return (
        <Card className="p-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <p className="text-sm mb-2">{prompt}</p>
            <div className="flex gap-2">
                <Button size="sm" onClick={onConfirm} className="text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Yes
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} className="text-xs">
                    <X className="w-3 h-3 mr-1" />
                    No
                </Button>
            </div>
        </Card>
    )
}
