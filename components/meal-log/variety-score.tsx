"use client"

interface VarietyScoreProps {
    score: number | null
}

export function VarietyScore({ score }: VarietyScoreProps) {
    if (score == null) return null

    const radius = 36
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    const color = score >= 70 ? "text-green-500" : score >= 40 ? "text-yellow-500" : "text-red-500"

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={color} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{score}</span>
                </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Variety Score</p>
        </div>
    )
}
