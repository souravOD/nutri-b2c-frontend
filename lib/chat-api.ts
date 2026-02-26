// Chat API client for PRD-16

export interface ChatMessage {
    id: string
    role: "user" | "bot"
    content: string
    intent?: string
    actionRequired?: boolean
    confirmationPrompt?: string
    recipes?: { id: string; title: string; score?: number }[]
    nutritionData?: any
    timestamp: number
}

export interface ChatApiResponse {
    message: string
    intent: string
    sessionId: string | null
    actionRequired: boolean
    confirmationPrompt?: string
    recipes?: { id: string; title: string; score?: number }[]
    nutritionData?: any
}

export async function sendChatMessage(
    message: string,
    sessionId?: string | null
): Promise<ChatApiResponse> {
    const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message, sessionId: sessionId || undefined }),
    })
    if (!res.ok) throw new Error("Chat request failed")
    return res.json()
}

export async function getChatHistory() {
    const res = await fetch("/api/v1/chat/history", { credentials: "include" })
    if (!res.ok) throw new Error("Failed to load chat history")
    return res.json()
}
