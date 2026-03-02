"use client";

import { useState } from "react";
import { Mic, Sparkles } from "lucide-react";

interface AiPromptInputProps {
    onSubmit: (prompt: string) => void;
    isLoading?: boolean;
}

export function AiPromptInput({ onSubmit, isLoading }: AiPromptInputProps) {
    const [prompt, setPrompt] = useState("");

    const handleSubmit = () => {
        if (!prompt.trim() || isLoading) return;
        onSubmit(prompt.trim());
    };

    return (
        <div className="relative">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={'Try: "I want a high-protein plan for under $100 this week"'}
                rows={3}
                className="w-full p-4 pr-24 text-base text-slate-800 bg-white border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#538100]/30 focus:border-[#538100]/50 placeholder:text-slate-400"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                    }
                }}
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                    type="button"
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    aria-label="Voice input"
                >
                    <Mic className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || !prompt.trim()}
                    className="p-2 rounded-full bg-[#538100] text-white hover:bg-[#446d00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Generate with AI"
                >
                    <Sparkles className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
