// Chat API client for PRD-16

import { authFetch } from "./api"

export interface NutritionData {
    name?: string
    calories?: number
    proteinG?: number
    carbsG?: number
    fatG?: number
    [key: string]: unknown
}

export interface ChatMessage {
    id: string
    role: "user" | "bot"
    content: string
    intent?: string
    actionRequired?: boolean
    confirmationPrompt?: string
    recipes?: { id: string; title: string; score?: number }[]
    nutritionData?: NutritionData
    timestamp: number
}

export interface ChatApiResponse {
    message: string
    intent: string
    sessionId: string | null
    actionRequired: boolean
    confirmationPrompt?: string
    recipes?: { id: string; title: string; score?: number }[]
    nutritionData?: NutritionData
}

export async function sendChatMessage(
    message: string,
    sessionId?: string | null,
    memberId?: string | null
): Promise<ChatApiResponse> {
    const res = await authFetch("/api/v1/chat", {
        method: "POST",
        body: JSON.stringify({
            message,
            sessionId: sessionId || undefined,
            memberId: memberId || undefined,
        }),
    })
    return res.json()
}

export async function getChatHistory() {
    const res = await authFetch("/api/v1/chat/history")
    return res.json()
}
