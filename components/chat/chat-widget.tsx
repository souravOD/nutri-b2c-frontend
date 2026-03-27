"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Loader2, Sparkles } from "lucide-react"
import { ChatBubble } from "./chat-bubble"
import { ChatInput } from "./chat-input"
import { ActionConfirmation } from "./action-confirmation"
import { RecipeResultCard } from "./recipe-result-card"
import { NutritionMiniCard } from "./nutrition-mini-card"
import { sendChatMessage, type ChatMessage } from "@/lib/chat-api"
import { useActiveMember } from "@/contexts/member-context"
import { useHouseholdMembers } from "@/hooks/use-household"

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const { activeMemberId } = useActiveMember()
    const { members: householdMembers = [] } = useHouseholdMembers()

    // Resolve active member name for header
    const activeMember = householdMembers.find((m: any) => m.id === activeMemberId)
    const chatTitle = activeMember
        ? `Nutri for ${activeMember.firstName || activeMember.fullName?.split(" ")[0]}`
        : "Nutri Assistant"

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, [messages])

    // Lock body scroll on mobile when chat is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => { document.body.style.overflow = "" }
    }, [isOpen])

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
            const res = await sendChatMessage(text, sessionId, activeMemberId)
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
    }, [sessionId, activeMemberId])

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
            {/* ─── Floating Action Button ─── */}
            {!isOpen && (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-[88px] lg:bottom-6 right-4 lg:right-6 z-50 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#538100] text-white shadow-lg hover:bg-[#466e00] active:scale-95 transition-all flex items-center justify-center"
                    aria-label="Open chat"
                    style={{ boxShadow: "0 4px 14px rgba(83,129,0,0.35)" }}
                >
                    <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
            )}

            {/* ─── Chat Panel ─── */}
            {isOpen && (
                <div
                    className={[
                        "fixed z-50 flex flex-col",
                        // Mobile: full screen above bottom nav
                        "inset-0 bottom-[72px]",
                        // Tablet/Desktop: floating overlay
                        "md:inset-auto md:bottom-24 md:right-6 md:w-[400px] md:h-[540px] md:max-h-[75vh] md:rounded-2xl md:border md:border-[#E2E8F0]",
                        "bg-[#F7F8F6]",
                    ].join(" ")}
                    style={{
                        fontFamily: "Inter, sans-serif",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    }}
                >
                    {/* ─── Header ─── */}
                    <div className="shrink-0 bg-white border-b border-[#E2E8F0] px-4 py-3.5 flex items-center gap-3 md:rounded-t-2xl">
                        {/* Green accent dot */}
                        <div className="w-10 h-10 rounded-full bg-[#99CC33]/15 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-[#538100]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3
                                className="text-[15px] font-bold text-[#0F172A] leading-tight"
                            >
                                {chatTitle}
                            </h3>
                            <p className="text-[11px] text-[#94A3B8] leading-tight mt-0.5">
                                Ask about recipes, nutrition, meals…
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center transition-colors shrink-0"
                            aria-label="Close chat"
                        >
                            <X className="w-4 h-4 text-[#64748B]" />
                        </button>
                    </div>

                    {/* ─── Messages ─── */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-[#99CC33]/10 flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 text-[#99CC33]" />
                                </div>
                                <p className="text-[15px] font-semibold text-[#0F172A] mb-1">
                                    Hi! I&apos;m your Nutri Assistant
                                </p>
                                <p className="text-[13px] text-[#94A3B8] max-w-[240px] leading-5">
                                    Ask me anything about food, recipes, nutrition, or meal planning.
                                </p>

                                {/* Quick action chips */}
                                <div className="flex flex-wrap justify-center gap-2 mt-6">
                                    {["What can I eat today?", "Low calorie snacks", "Meal prep ideas"].map(q => (
                                        <button
                                            key={q}
                                            type="button"
                                            onClick={() => handleSend(q)}
                                            className="px-3.5 py-2 rounded-full bg-white border border-[#E2E8F0] text-[12px] font-medium text-[#538100] hover:bg-[#F1F8E6] hover:border-[#99CC33]/40 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map(msg => (
                            <div key={msg.id} className="space-y-2">
                                <ChatBubble role={msg.role} content={msg.content} />

                                {msg.recipes && msg.recipes.length > 0 && (
                                    <div className="space-y-1.5 ml-1">
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
                                <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                                    <div className="flex gap-1.5 items-center">
                                        <span className="w-2 h-2 rounded-full bg-[#99CC33] animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-[#99CC33] animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-[#99CC33] animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Input ─── */}
                    <ChatInput onSend={handleSend} disabled={loading} />
                </div>
            )}
        </>
    )
}
