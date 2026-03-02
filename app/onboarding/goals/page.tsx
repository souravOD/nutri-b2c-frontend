"use client"

import { ChevronLeft, ArrowRight, TrendingDown, Scale, Dumbbell, Info } from "lucide-react"
import { useOnboarding, TOTAL_STEPS, type GoalValue } from "../onboarding-context"

const GOAL_OPTIONS: { value: GoalValue; label: string; desc: string; Icon: typeof Scale }[] = [
    { value: "lose_weight", label: "Lose Weight", desc: "Burn fat and improve your health.", Icon: TrendingDown },
    { value: "maintain_weight", label: "Maintain Weight", desc: "Optimize your nutrition and stay fit.", Icon: Scale },
    { value: "gain_muscle", label: "Gain Muscle", desc: "Build strength and increase mass.", Icon: Dumbbell },
]

export default function GoalsPage() {
    const { data, setData, goNext, goBack, stepLabel, stepNumber, progress } = useOnboarding()

    return (
        <div className="min-h-screen flex flex-col" style={{ background: "var(--nutri-bg)" }}>
            {/* Header */}
            <div className="px-4 pt-4">
                <div className="flex items-center justify-between">
                    <button onClick={goBack} className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: "rgba(226,232,240,0.5)" }}>
                        <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
                    </button>
                    <span className="text-[18px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Onboarding</span>
                    <div className="w-10" />
                </div>
                <div className="mt-6 space-y-3 px-2">
                    <div className="flex items-end justify-between">
                        <span className="text-[16px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>{stepLabel}</span>
                        <span className="text-[14px] font-medium" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>Step {stepNumber} of {TOTAL_STEPS}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "var(--nutri-green-20)" }}>
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--nutri-green)" }} />
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 px-6 pt-6 pb-[200px] space-y-8 max-w-[480px] mx-auto w-full">
                <div className="space-y-3">
                    <h1 className="text-[28px] font-bold leading-[37.5px] tracking-[-0.6px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
                        What is your main goal?
                    </h1>
                    <p className="text-[16px] leading-[24px]" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>
                        Select the primary objective you want to achieve with NutriFind.
                    </p>
                </div>

                <div className="space-y-4">
                    {GOAL_OPTIONS.map(({ value, label, desc, Icon }) => {
                        const selected = data.goal === value
                        return (
                            <button
                                key={value} onClick={() => setData((d) => ({ ...d, goal: value }))}
                                className="w-full flex items-center p-[22px] rounded-[48px] border-2 transition-all"
                                style={{
                                    background: selected ? "var(--nutri-green-5)" : "white",
                                    borderColor: selected ? "var(--nutri-green)" : "var(--nutri-border)",
                                }}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: selected ? "var(--nutri-green-dark)" : "#f1f5f9" }}>
                                    <Icon className="w-5 h-5" style={{ color: selected ? "white" : "var(--nutri-body-light)" }} />
                                </div>
                                <div className="flex-1 text-left pl-4">
                                    <p className="text-[16px] font-bold" style={{ color: selected ? "black" : "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>{label}</p>
                                    <p className="text-[14px] leading-[20px]" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>{desc}</p>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2" style={{ borderColor: selected ? "var(--nutri-green)" : "#cbd5e1", background: selected ? "var(--nutri-green)" : "transparent" }}>
                                    {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Info callout */}
                <div className="flex items-start gap-2 p-4 rounded-2xl" style={{ background: "var(--nutri-green-5)" }}>
                    <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--nutri-green-dark)" }} />
                    <p className="text-[14px] leading-[20px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>
                        <strong>Why we ask:</strong> This helps us calculate your daily calorie and macro targets specifically for your body.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 px-6 py-6 max-w-[480px] mx-auto" style={{ background: "var(--nutri-bg)", backdropFilter: "blur(6px)" }}>
                <button
                    onClick={goNext}
                    className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[16px] font-bold text-black transition-opacity hover:opacity-90"
                    style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.25), 0px 4px 6px -4px rgba(153,204,51,0.25)" }}
                >
                    Continue <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
