"use client"

import { ChevronLeft, ArrowRight, Sofa, PersonStanding, Bike, Zap } from "lucide-react"
import { useOnboarding, TOTAL_STEPS, type ActivityValue } from "../onboarding-context"

const ACTIVITY_OPTIONS: { value: ActivityValue; label: string; desc: string; Icon: typeof Sofa }[] = [
    { value: "sedentary", label: "Sedentary", desc: "Little to no exercise; desk job.", Icon: Sofa },
    { value: "lightly_active", label: "Lightly Active", desc: "Light exercise or sports 1-3 days/week.", Icon: PersonStanding },
    { value: "moderately_active", label: "Moderately Active", desc: "Moderate exercise or sports 3-5 days/week.", Icon: Bike },
    { value: "very_active", label: "Very Active", desc: "Hard exercise or sports 6-7 days/week.", Icon: Zap },
]

export default function LifestylePage() {
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
            <div className="flex-1 px-6 pt-6 pb-[160px] space-y-8 max-w-[480px] mx-auto w-full">
                <div className="space-y-3 text-center">
                    <h1 className="text-[28px] font-bold leading-[37.5px] tracking-[-0.6px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
                        What&apos;s your activity<br />level?
                    </h1>
                    <p className="text-[16px] leading-[24px]" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>
                        This helps us calculate your daily calorie<br />needs and personalize your meal plans.
                    </p>
                </div>

                <div className="space-y-4">
                    {ACTIVITY_OPTIONS.map(({ value, label, desc, Icon }) => {
                        const selected = data.activityLevel === value
                        return (
                            <button
                                key={value} onClick={() => setData((d) => ({ ...d, activityLevel: value }))}
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
                                {/* Radio indicator */}
                                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2" style={{ borderColor: selected ? "var(--nutri-green)" : "#cbd5e1", background: selected ? "var(--nutri-green)" : "transparent" }}>
                                    {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                            </button>
                        )
                    })}
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
