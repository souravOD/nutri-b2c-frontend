"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X, Loader2 } from "lucide-react"
import { ChatBubble } from "./chat-bubble"
import { ChatInput } from "./chat-input"
import { ActionConfirmation } from "./action-confirmation"
import { RecipeResultCard } from "./recipe-result-card"
import { NutritionMiniCard } from "./nutrition-mini-card"
import { sendChatMessage, type ChatMessage } from "@/lib/chat-api"

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, [messages])

    const handleSend = useCallback(async (text: string) => {
        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
            timestamp: Date.now(),
        }
        setMessages(prev => [...prev, userMsg])
        setLoading(true)

        try {
            const res = await sendChatMessage(text, sessionId)
            if (res.sessionId) setSessionId(res.sessionId)

            const botMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: "bot",
                content: res.message,
                intent: res.intent,
                actionRequired: res.actionRequired,
                confirmationPrompt: res.confirmationPrompt,
                recipes: res.recipes,
                nutritionData: res.nutritionData,
                timestamp: Date.now(),
            }
            setMessages(prev => [...prev, botMsg])
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "bot",
                    content: "Sorry, something went wrong. Please try again.",
                    timestamp: Date.now(),
                },
            ])
        } finally {
            setLoading(false)
        }
    }, [sessionId])

    const handleConfirm = useCallback((msgId: string) => {
        handleSend("yes")
        setMessages(prev =>
            prev.map(m => m.id === msgId ? { ...m, actionRequired: false } : m)
        )
    }, [handleSend])

    const handleCancel = useCallback((msgId: string) => {
        setMessages(prev =>
            prev.map(m => m.id === msgId ? { ...m, actionRequired: false } : m)
        )
        setMessages(prev => [
            ...prev,
            { id: crypto.randomUUID(), role: "bot", content: "No problem! What else can I help with?", timestamp: Date.now() },
        ])
    }, [])

    return (
        <>
            {/* Floating Action Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
                size="icon"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </Button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[360px] h-[500px] bg-background border rounded-2xl shadow-xl flex flex-col z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div>
                            <h3 className="font-semibold text-sm">Nutri Assistant</h3>
                            <p className="text-[10px] text-muted-foreground">Ask about recipes, nutrition, meals…</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p>Hi! Ask me anything about food, recipes, or nutrition.</p>
                            </div>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id} className="space-y-2">
                                <ChatBubble role={msg.role} content={msg.content} />

                                {msg.recipes && msg.recipes.length > 0 && (
                                    <div className="space-y-1 ml-1">
                                        {msg.recipes.map(r => (
                                            <RecipeResultCard key={r.id} {...r} />
                                        ))}
                                    </div>
                                )}

                                {msg.nutritionData && (
                                    <div className="ml-1">
                                        <NutritionMiniCard data={msg.nutritionData} />
                                    </div>
                                )}

                                {msg.actionRequired && msg.confirmationPrompt && (
                                    <div className="ml-1">
                                        <ActionConfirmation
                                            prompt={msg.confirmationPrompt}
                                            onConfirm={() => handleConfirm(msg.id)}
                                            onCancel={() => handleCancel(msg.id)}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <ChatInput onSend={handleSend} disabled={loading} />
                </div>
            )}
        </>
    )
}
