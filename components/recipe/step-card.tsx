"use client"

import { useState, useEffect, useCallback } from "react"
import { parseTimerDuration } from "@/hooks/use-cooking-timer"
import { InlineTimer } from "./cooking-timer"

interface StepCardProps {
    stepNumber: number
    title?: string
    description: string
    showKeepScreenOn?: boolean
}

/** Strip leading step numbers and extract a short title from step text */
function cleanStepText(text: string): string {
    // Remove leading "3. " or "3) " style numbering
    return text.replace(/^\d+[\.\)]\s*/, "").trim()
}

function extractTitle(text: string): string {
    const clean = cleanStepText(text)
    // If text has a colon, use the part before
    const colonIdx = clean.indexOf(":")
    if (colonIdx > 0 && colonIdx < 50) return clean.slice(0, colonIdx)
    // Otherwise first ~5 words
    const words = clean.split(/\s+/).slice(0, 5)
    return words.join(" ") + (clean.split(/\s+/).length > 5 ? "…" : "")
}

export function StepCard({ stepNumber, title, description, showKeepScreenOn }: StepCardProps) {
    const [wakeLock, setWakeLock] = useState(false)
    const [lockRef, setLockRef] = useState<WakeLockSentinel | null>(null)

    const timerDuration = parseTimerDuration(description)
    const displayTitle = title || extractTitle(description)

    // Derive a timer label from the step text
    const timerLabel = (() => {
        const match = description.match(/(boil|cook|bake|simmer|roast|fry|steam|heat|rest|marinate)\s/i)
        return match ? `${match[1].toUpperCase()} TIMER` : "STEP TIMER"
    })()

    const toggleWakeLock = useCallback(async () => {
        if (wakeLock && lockRef) {
            await lockRef.release()
            setLockRef(null)
            setWakeLock(false)
        } else {
            try {
                const sentinel = await navigator.wakeLock.request("screen")
                setLockRef(sentinel)
                setWakeLock(true)
            } catch {
                // Wake Lock not supported
            }
        }
    }, [wakeLock, lockRef])

    useEffect(() => {
        return () => {
            lockRef?.release()
        }
    }, [lockRef])

    return (
        <div className="relative bg-[#FAFCF7] border border-[#E2E8F0] rounded-[20px] p-5">
            {/* Step badge */}
            <div className="flex items-center justify-between mb-3">
                <span className="bg-[#99CC33] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    STEP {stepNumber}
                </span>

                {/* Keep screen on toggle */}
                {showKeepScreenOn && (
                    <button
                        type="button"
                        onClick={toggleWakeLock}
                        className={`
              flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors
              ${wakeLock
                                ? "bg-[#99CC33]/10 border-[#99CC33] text-[#538100]"
                                : "bg-white border-[#E2E8F0] text-[#94A3B8]"
                            }
            `}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${wakeLock ? "bg-[#99CC33]" : "bg-[#CBD5E1]"}`} />
                        Keep screen on
                    </button>
                )}
            </div>

            {/* Title */}
            <h4 className="text-[16px] font-bold text-[#0F172A] mb-2">
                {displayTitle}
            </h4>

            {/* Description */}
            <p className="text-[14px] text-[#475569] leading-6">
                {cleanStepText(description)}
            </p>

            {/* Inline timer */}
            {timerDuration && (
                <InlineTimer durationSeconds={timerDuration} label={timerLabel} />
            )}
        </div>
    )
}
