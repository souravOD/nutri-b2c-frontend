"use client"

import { cn } from "@/lib/utils"

interface ChatBubbleProps {
    role: "user" | "bot"
    content: string
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
    return (
        <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                )}
            >
                {content}
            </div>
        </div>
    )
}
