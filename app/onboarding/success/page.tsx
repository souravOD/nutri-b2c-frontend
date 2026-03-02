"use client"

import Link from "next/link"
import { Check, Zap, Target, CalendarCheck, ArrowRight } from "lucide-react"

export default function OnboardingSuccessPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6" style={{ background: "var(--nutri-bg)" }}>
            {/* Decorative blurred circles */}
            <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full" style={{ background: "var(--nutri-green-5)", filter: "blur(32px)" }} />
            <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full" style={{ background: "var(--nutri-green-5)", filter: "blur(32px)" }} />

            {/* Success icon */}
            <div className="relative mb-8">
                <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center" style={{ background: "var(--nutri-green-20)" }}>
                    <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center" style={{ background: "var(--nutri-green)" }}>
                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* Text */}
            <h1 className="text-[32px] font-bold leading-[40px] text-center mb-4" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
                You&apos;re all set!
            </h1>
            <p className="text-[16px] leading-[24px] text-center max-w-[280px] mb-10" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>
                We&apos;ve prepared your personalized dashboard based on your goals.
            </p>

            {/* Feature icons */}
            <div className="flex items-center gap-6 mb-12">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border" style={{ borderColor: "var(--nutri-border)", background: "white" }}>
                        <Zap className="w-6 h-6" style={{ color: "var(--nutri-green-dark)" }} />
                    </div>
                    <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>Energy</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border" style={{ borderColor: "var(--nutri-border)", background: "white" }}>
                        <Target className="w-6 h-6" style={{ color: "var(--nutri-green-dark)" }} />
                    </div>
                    <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>Goals</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border" style={{ borderColor: "var(--nutri-border)", background: "white" }}>
                        <CalendarCheck className="w-6 h-6" style={{ color: "var(--nutri-green-dark)" }} />
                    </div>
                    <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>Plan</span>
                </div>
            </div>

            {/* CTA */}
            <Link
                href="/"
                className="w-full max-w-md h-14 rounded-full flex items-center justify-center gap-2 text-[18px] font-bold text-black no-underline transition-opacity hover:opacity-90"
                style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.25), 0px 4px 6px -4px rgba(153,204,51,0.25)" }}
            >
                Go to Home <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Step complete label */}
            <p className="mt-4 text-[14px] font-medium" style={{ color: "var(--nutri-green-dark)", fontFamily: "Inter, sans-serif" }}>
                Step 5 of 5 Complete
            </p>
        </div>
    )
}
