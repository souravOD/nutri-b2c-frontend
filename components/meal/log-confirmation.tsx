"use client"

import { useEffect, useState } from "react"
import { X, Check } from "lucide-react"

interface LogConfirmationProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    calories: number
    protein: number
    carbs: number
    fats: number
    dailyConsumed: number
    dailyTarget: number
    onViewDailyLog?: () => void
    onBackToPlanning?: () => void
}

export function LogConfirmation({
    open,
    onOpenChange,
    calories,
    protein,
    carbs,
    fats,
    dailyConsumed,
    dailyTarget,
    onViewDailyLog,
    onBackToPlanning,
}: LogConfirmationProps) {
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        if (open) {
            const t = setTimeout(() => setAnimate(true), 100)
            return () => clearTimeout(t)
        }
        setAnimate(false)
    }, [open])

    if (!open) return null

    const progress = dailyTarget > 0 ? Math.min((dailyConsumed / dailyTarget) * 100, 100) : 0

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm animate-in fade-in-0"
                onClick={() => onOpenChange(false)}
            />

            {/* Panel */}
            <div
                className="
          fixed z-50
          inset-x-4 bottom-4 top-auto

          lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2
          lg:w-[380px]

          bg-white rounded-[24px] shadow-2xl overflow-hidden
          flex flex-col animate-in fade-in-0 zoom-in-95
        "
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4">
                    <span className="text-[14px] font-semibold text-[#0F172A]">
                        Success
                    </span>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-7 h-7 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>
                </div>

                <div className="px-6 py-6 flex flex-col items-center text-center">
                    {/* Animated checkmark */}
                    <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${animate
                                ? "bg-[#99CC33] scale-100 opacity-100"
                                : "bg-[#99CC33]/30 scale-75 opacity-0"
                            }`}
                        style={{
                            boxShadow: animate
                                ? "0 0 0 12px rgba(153, 204, 51, 0.15), 0 0 0 24px rgba(153, 204, 51, 0.07)"
                                : "none",
                        }}
                    >
                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                    </div>

                    <h2 className="text-[22px] font-bold text-[#0F172A] mb-1">
                        Meal Logged
                    </h2>
                    <h3 className="text-[22px] font-bold text-[#0F172A] mb-2">
                        Successfully!
                    </h3>
                    <p className="text-[14px] text-[#64748B] mb-6">
                        Your daily nutrition stats have been updated.
                    </p>

                    {/* Calorie card */}
                    <div className="w-full bg-[#F8FAFC] rounded-[16px] p-5 mb-6 border border-[#F1F5F9]">
                        <div className="text-[32px] font-bold text-[#538100] leading-tight">
                            +{Math.round(calories)} kcal
                        </div>
                        <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[1px] mt-1">
                            Calories added
                        </div>

                        {/* Macro breakdown */}
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="text-center">
                                <div className="text-[18px] font-bold text-[#0F172A]">{Math.round(protein)}g</div>
                                <div className="text-[11px] text-[#64748B]">Protein</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[18px] font-bold text-[#0F172A]">{Math.round(carbs)}g</div>
                                <div className="text-[11px] text-[#64748B]">Carbs</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[18px] font-bold text-[#0F172A]">{Math.round(fats)}g</div>
                                <div className="text-[11px] text-[#64748B]">Fats</div>
                            </div>
                        </div>
                    </div>

                    {/* Daily progress bar */}
                    <div className="w-full mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[13px] font-medium text-[#0F172A]">
                                Daily Goal Progress
                            </span>
                            <span className="text-[13px] font-semibold text-[#538100]">
                                {Math.round(dailyConsumed)} / {Math.round(dailyTarget)} kcal
                            </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div
                                className="h-full rounded-full bg-[#99CC33] transition-all duration-700"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* CTAs */}
                    <button
                        type="button"
                        onClick={onViewDailyLog}
                        className="w-full py-3.5 rounded-full bg-[#538100] text-white text-[16px] font-bold hover:bg-[#466D00] transition-colors"
                    >
                        View Daily Log
                    </button>
                    <button
                        type="button"
                        onClick={onBackToPlanning ?? (() => onOpenChange(false))}
                        className="w-full py-3 rounded-full border-2 border-[#538100] text-[#538100] text-[15px] font-bold mt-3 hover:bg-[#F0F7E6] transition-colors"
                    >
                        Back to Planning
                    </button>
                </div>
            </div>
        </>
    )
}
