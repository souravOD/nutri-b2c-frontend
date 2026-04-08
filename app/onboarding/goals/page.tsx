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
        <div className="ob-page min-h-screen flex flex-col" style={{ background: "var(--nutri-bg)" }}>
            {/* Header */}
            <div className="ob-header px-4 pt-4">
                <div className="ob-nav flex items-center justify-between">
                    <button onClick={goBack} className="ob-back flex items-center justify-center w-10 h-10 rounded-full" style={{ background: "rgba(226,232,240,0.5)" }}>
                        <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
                    </button>
                    <span className="ob-title text-[18px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Onboarding</span>
                    <div className="ob-spacer w-10" />
                </div>
                <div className="ob-progress mt-6 space-y-3 px-2">
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
            <div className="ob-main flex-1 px-6 pt-6 pb-[200px] space-y-8 max-w-[480px] mx-auto w-full">
                <div className="ob-heading space-y-3">
                    <h1 className="text-[28px] font-bold leading-[37.5px] tracking-[-0.6px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
                        What is your main goal?
                    </h1>
                    <p className="text-[16px] leading-[24px]" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>
                        Select the primary objective you want to achieve with Nutri
                    </p>
                </div>

                <div className="ob-cards space-y-4">
                    {GOAL_OPTIONS.map(({ value, label, desc, Icon }) => {
                        const selected = data.goal === value
                        return (
                            <button
                                key={value} onClick={() => setData((d) => ({ ...d, goal: value }))}
                                className="ob-card w-full flex items-center p-[22px] rounded-[48px] border-2 transition-all"
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
                <div className="ob-info flex items-start gap-2 p-4 rounded-2xl" style={{ background: "var(--nutri-green-5)" }}>
                    <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--nutri-green-dark)" }} />
                    <p className="text-[14px] leading-[20px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>
                        <strong>Why we ask:</strong> This helps us calculate your daily calorie and macro targets specifically for your body.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="ob-footer fixed bottom-0 left-0 right-0 px-6 py-6 max-w-[480px] mx-auto" style={{ background: "var(--nutri-bg)", backdropFilter: "blur(6px)" }}>
                <button
                    onClick={goNext}
                    className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[16px] font-bold text-black transition-opacity hover:opacity-90"
                    style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.25), 0px 4px 6px -4px rgba(153,204,51,0.25)" }}
                >
                    Continue <ArrowRight className="w-4 h-4" />
                </button>
                <p className="ob-terms text-center text-[12px] leading-[16px] mt-4" style={{ color: "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}>
                    By continuing, you agree to our{" "}
                    <a href={`${process.env.NEXT_PUBLIC_MARKETING_URL || ""}/terms`} target="_blank" rel="noopener noreferrer" className="underline">Terms of Service</a>{" "}and{" "}
                    <a href={`${process.env.NEXT_PUBLIC_MARKETING_URL || ""}/privacy`} target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>.
                </p>
            </div>

            <style jsx>{`
                @media (min-width: 1024px) {
                    .ob-header { max-width: 1160px; margin: 0 auto; padding: 16px 60px 0; width: 100%; box-sizing: border-box; }
                    .ob-nav { justify-content: flex-start; gap: 12px; }
                    .ob-spacer { display: none; }
                    .ob-title { font-size: 22px; font-weight: 700; }
                    .ob-main { max-width: 1160px; padding: 24px 60px 40px; box-sizing: border-box; }
                    .ob-heading { text-align: left; }
                    .ob-cards {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                    }
                    .ob-card { border-radius: 9999px; }
                    .ob-info { max-width: 100%; }
                    .ob-footer {
                        position: static; max-width: 480px; margin: 0 auto;
                        padding: 0 60px 32px;
                    }
                }
            `}</style>
        </div>
    )
}
