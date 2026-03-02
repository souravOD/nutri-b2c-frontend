"use client"

import { useState } from "react"
import { ChevronLeft, ArrowRight, Calendar } from "lucide-react"
import { useOnboarding, TOTAL_STEPS, type Sex } from "../onboarding-context"

export default function PersonalInfoPage() {
    const { data, setData, goNext, goBack, stepLabel, stepNumber, progress } = useOnboarding()
    const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric")

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
                {/* Progress */}
                <div className="mt-6 space-y-3">
                    <div className="flex items-end justify-between">
                        <span className="text-[16px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>{stepLabel}</span>
                        <span className="text-[14px] font-medium" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>Step {stepNumber} of {TOTAL_STEPS}</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--nutri-border)" }}>
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--nutri-green)" }} />
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 px-4 pt-10 pb-6 space-y-8 max-w-[480px] mx-auto w-full">
                <div className="space-y-3">
                    <h1 className="text-[28px] font-bold tracking-[-0.6px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Tell us about yourself</h1>
                    <p className="text-[14px]" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>This helps us calculate your daily needs.</p>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                    <label className="block px-1 text-[16px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Date of Birth</label>
                    <div className="relative">
                        <input
                            type="date" value={data.dob} onChange={(e) => setData((d) => ({ ...d, dob: e.target.value }))}
                            className="w-full h-14 px-6 pr-12 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)]"
                            style={{ background: "white", borderColor: "var(--nutri-border)", color: data.dob ? "var(--nutri-heading)" : "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}
                        />
                        <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: "var(--nutri-placeholder)" }} />
                    </div>
                </div>

                {/* Biological Sex */}
                <div className="space-y-3">
                    <label className="block px-1 text-[16px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Biological Sex</label>
                    <div className="flex gap-3">
                        {(["male", "female", "other"] as Sex[]).map((s) => (
                            <button
                                key={s} onClick={() => setData((d) => ({ ...d, sex: s }))}
                                className="flex-1 h-12 rounded-full text-[16px] font-semibold border-2 transition-all capitalize"
                                style={{
                                    background: data.sex === s ? "var(--nutri-green-10)" : "white",
                                    borderColor: data.sex === s ? "var(--nutri-green)" : "var(--nutri-border)",
                                    color: data.sex === s ? "black" : "var(--nutri-body)",
                                    fontFamily: "Inter, sans-serif",
                                    fontWeight: data.sex === s ? 700 : 600,
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Height & Weight */}
                <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="block px-1 text-[16px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Height</label>
                        <div className="relative">
                            <input
                                type="number" value={data.heightValue} onChange={(e) => setData((d) => ({ ...d, heightValue: e.target.value }))}
                                placeholder={unitSystem === "metric" ? "175" : "5'9"}
                                className="w-full h-14 px-5 pr-14 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)]"
                                style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
                            />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[14px] font-bold" style={{ color: "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}>
                                {unitSystem === "metric" ? "cm" : "ft"}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="block px-1 text-[16px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Weight</label>
                        <div className="relative">
                            <input
                                type="number" value={data.weightValue} onChange={(e) => setData((d) => ({ ...d, weightValue: e.target.value }))}
                                placeholder={unitSystem === "metric" ? "70" : "154"}
                                className="w-full h-14 px-5 pr-14 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)]"
                                style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
                            />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[14px] font-bold" style={{ color: "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}>
                                {unitSystem === "metric" ? "kg" : "lbs"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Metric / Imperial toggle */}
                <div className="flex justify-center">
                    <div className="inline-flex p-1 rounded-full" style={{ background: "rgba(226,232,240,0.5)" }}>
                        <button
                            onClick={() => { setUnitSystem("metric"); setData((d) => ({ ...d, heightUnit: "cm", weightUnit: "kg" })) }}
                            className="px-4 py-1.5 rounded-full text-[12px] font-bold transition-all"
                            style={{
                                background: unitSystem === "metric" ? "white" : "transparent",
                                color: unitSystem === "metric" ? "var(--nutri-heading)" : "var(--nutri-body-light)",
                                boxShadow: unitSystem === "metric" ? "0px 1px 2px rgba(0,0,0,0.05)" : "none",
                                fontFamily: "Inter, sans-serif",
                            }}
                        >
                            Metric
                        </button>
                        <button
                            onClick={() => { setUnitSystem("imperial"); setData((d) => ({ ...d, heightUnit: "ft", weightUnit: "lbs" })) }}
                            className="px-4 py-1.5 rounded-full text-[12px] font-bold transition-all"
                            style={{
                                background: unitSystem === "imperial" ? "white" : "transparent",
                                color: unitSystem === "imperial" ? "var(--nutri-heading)" : "var(--nutri-body-light)",
                                boxShadow: unitSystem === "imperial" ? "0px 1px 2px rgba(0,0,0,0.05)" : "none",
                                fontFamily: "Inter, sans-serif",
                            }}
                        >
                            Imperial
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer CTA */}
            <div className="px-4 pb-6 pt-2 max-w-[480px] mx-auto w-full space-y-6">
                <button
                    onClick={goNext}
                    className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[18px] font-bold text-black transition-opacity hover:opacity-90"
                    style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.25), 0px 4px 6px -4px rgba(153,204,51,0.25)" }}
                >
                    Continue <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-[12px] leading-[16px]" style={{ color: "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}>
                    By continuing, you agree to our <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.
                </p>
            </div>
        </div>
    )
}
