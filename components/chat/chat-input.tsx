"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

interface ChatInputProps {
    onSend: (message: string) => void
    disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [text, setText] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => { inputRef.current?.focus() }, [])

    const handleSend = () => {
        const trimmed = text.trim()
        if (!trimmed || disabled) return
        onSend(trimmed)
        setText("")
    }

    const hasText = text.trim().length > 0

    return (
        <div className="shrink-0 bg-white border-t border-[#E2E8F0] px-3 py-3 md:rounded-b-2xl safe-bottom">
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    value={text}
                    onChange={e => setText(e.target.value.slice(0, 500))}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Ask me anything about food..."
                    disabled={disabled}
                    className="flex-1 h-[44px] rounded-full bg-[#F7F8F6] border border-[#E2E8F0] px-4 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#99CC33] focus:ring-2 focus:ring-[#99CC33]/20 disabled:opacity-50"
                    style={{ fontFamily: "Inter, sans-serif" }}
                />
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!hasText || disabled}
                    className={[
                        "w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all",
                        hasText && !disabled
                            ? "bg-[#538100] text-white hover:bg-[#466e00] active:scale-95"
                            : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed",
                    ].join(" ")}
                    aria-label="Send message"
                >
                    <Send className="w-[18px] h-[18px]" />
                </button>
            </div>
        </div>
    )
}
