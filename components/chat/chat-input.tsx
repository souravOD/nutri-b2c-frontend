"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

    return (
        <div className="flex gap-2 p-3 border-t">
            <Input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value.slice(0, 500))}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything about food..."
                disabled={disabled}
                className="text-sm"
            />
            <Button size="icon" onClick={handleSend} disabled={!text.trim() || disabled}>
                <Send className="w-4 h-4" />
            </Button>
        </div>
    )
}
