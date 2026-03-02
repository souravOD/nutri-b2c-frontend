"use client"

import { useState, useEffect, useCallback, useRef } from "react"

/**
 * Parse a time duration from step text, e.g. "Boil for 8 minutes", "cook 1 hour".
 * Returns seconds or null if no duration found.
 */
export function parseTimerDuration(text: string): number | null {
    const match = text.match(/(\d+)\s*(min(ute)?s?|hrs?|hours?|seconds?|secs?)/i)
    if (!match) return null
    const value = parseInt(match[1], 10)
    const unit = match[2].toLowerCase()
    if (unit.startsWith("h")) return value * 3600
    if (unit.startsWith("s")) return value
    return value * 60 // minutes
}

/** Format seconds → "MM:SS" */
export function formatTimer(seconds: number): string {
    const m = Math.floor(Math.max(0, seconds) / 60)
    const s = Math.max(0, seconds) % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

/** Play a short beep using Web Audio API */
function playBeep() {
    try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        osc.type = "sine"
        gain.gain.value = 0.3
        osc.start()
        osc.stop(ctx.currentTime + 0.4)
        // repeat beep
        setTimeout(() => {
            const osc2 = ctx.createOscillator()
            const gain2 = ctx.createGain()
            osc2.connect(gain2)
            gain2.connect(ctx.destination)
            osc2.frequency.value = 880
            osc2.type = "sine"
            gain2.gain.value = 0.3
            osc2.start()
            osc2.stop(ctx.currentTime + 0.4)
        }, 500)
    } catch {
        // Audio not supported
    }
}

export function useCookingTimer(durationSeconds: number) {
    const [remaining, setRemaining] = useState(durationSeconds)
    const [isRunning, setIsRunning] = useState(false)
    const hasBeepedRef = useRef(false)

    useEffect(() => {
        setRemaining(durationSeconds)
        setIsRunning(false)
        hasBeepedRef.current = false
    }, [durationSeconds])

    useEffect(() => {
        if (!isRunning || remaining <= 0) return
        const interval = setInterval(() => {
            setRemaining((r) => {
                const next = r - 1
                if (next <= 0 && !hasBeepedRef.current) {
                    hasBeepedRef.current = true
                    playBeep()
                }
                return Math.max(0, next)
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [isRunning, remaining])

    const start = useCallback(() => setIsRunning(true), [])
    const pause = useCallback(() => setIsRunning(false), [])
    const reset = useCallback(() => {
        setIsRunning(false)
        setRemaining(durationSeconds)
        hasBeepedRef.current = false
    }, [durationSeconds])

    return {
        remaining,
        isRunning,
        isComplete: remaining <= 0,
        progress: durationSeconds > 0 ? ((durationSeconds - remaining) / durationSeconds) * 100 : 0,
        start,
        pause,
        reset,
        formattedTime: formatTimer(remaining),
    }
}
