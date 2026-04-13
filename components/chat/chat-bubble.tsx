"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { isFeedbackEnabled } from "@/lib/feedback-config"
import { submitBetaFeedback } from "@/lib/feedback-api"

interface ChatBubbleProps {
    role: "user" | "bot"
    content: string
    messageId?: string
}

const THUMBS_DOWN_CHIPS = [
    "Wrong info",
    "Irrelevant",
    "Felt unsafe",
    "Hard to understand",
    "Other",
]

export function ChatBubble({ role, content, messageId }: ChatBubbleProps) {
    const [thumbState, setThumbState] = useState<"up" | "down" | null>(null)
    const [showChips, setShowChips] = useState(false)
    const [selectedChips, setSelectedChips] = useState<string[]>([])
    const [chipsDone, setChipsDone] = useState(false)
    const showFeedback = isFeedbackEnabled() && role === "bot"

    const handleThumb = useCallback(async (type: "up" | "down") => {
        setThumbState(type)
        if (type === "down") {
            setShowChips(true)
            return
        }
        // Thumbs up — submit immediately
        try {
            await submitBetaFeedback({
                flow: "ai_chat",
                questionKey: "message_thumbs",
                responseValue: "up",
                contextMetadata: { messageId },
            })
        } catch {
            // Best-effort
        }
    }, [messageId])

    const handleChipToggle = (chip: string) => {
        setSelectedChips((prev) =>
            prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
        )
    }

    const handleChipsSubmit = useCallback(async () => {
        setChipsDone(true)
        setShowChips(false)
        const isSafety = selectedChips.includes("Felt unsafe")
        try {
            await submitBetaFeedback({
                flow: "ai_chat",
                questionKey: "message_thumbs",
                responseValue: "down",
                followUpTags: selectedChips,
                isSafetyFlag: isSafety,
                contextMetadata: { messageId },
            })
        } catch {
            // Best-effort
        }
    }, [selectedChips, messageId])

    return (
        <div>
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

            {/* Thumbs feedback — inline below bot messages */}
            {showFeedback && !thumbState && (
                <div className="flex gap-1.5 mt-1 ml-1">
                    <button
                        type="button"
                        onClick={() => handleThumb("up")}
                        className="h-6 w-6 rounded-full hover:bg-[#ECFCCB] flex items-center justify-center transition-colors text-[13px]"
                        aria-label="Helpful"
                    >
                        👍
                    </button>
                    <button
                        type="button"
                        onClick={() => handleThumb("down")}
                        className="h-6 w-6 rounded-full hover:bg-[#FEF2F2] flex items-center justify-center transition-colors text-[13px]"
                        aria-label="Not helpful"
                    >
                        👎
                    </button>
                </div>
            )}

            {/* Thumbs up confirmation */}
            {thumbState === "up" && (
                <p className="text-[11px] text-[#538100] ml-1 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                    Thanks! 🎉
                </p>
            )}

            {/* Thumbs down — inline chip picker */}
            {showChips && (
                <div className="ml-1 mt-1.5 p-2.5 rounded-xl bg-[#FFF8F0] border border-[#FDE68A]">
                    <p className="text-[12px] font-medium text-[#0F172A] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                        What went wrong?
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {THUMBS_DOWN_CHIPS.map((chip) => (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => handleChipToggle(chip)}
                                className={cn(
                                    "h-6 px-2.5 rounded-full border text-[11px] font-medium transition-colors",
                                    selectedChips.includes(chip)
                                        ? "border-[#99CC33] bg-[#ECFCCB] text-[#538100]"
                                        : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#99CC33]"
                                )}
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleChipsSubmit}
                        disabled={selectedChips.length === 0}
                        className="mt-2 h-7 w-full rounded-lg bg-[#99CC33] text-white text-[11px] font-semibold hover:bg-[#88BB22] disabled:opacity-50 transition-colors"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        Submit
                    </button>
                </div>
            )}

            {/* Thumbs down done */}
            {thumbState === "down" && chipsDone && (
                <p className="text-[11px] text-[#538100] ml-1 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                    Thanks for the feedback! 🙏
                </p>
            )}
        </div>
    )
}
