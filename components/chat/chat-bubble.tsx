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
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-[1.5]",
                    role === "user"
                        ? "bg-[#538100] text-white rounded-br-sm shadow-sm"
                        : "bg-white text-[#0F172A] rounded-bl-sm border border-[#E2E8F0] shadow-sm"
                )}
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                {content}
            </div>
        </div>
    )
}
