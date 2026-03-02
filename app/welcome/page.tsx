// app/welcome/page.tsx
"use client"

import Link from "next/link"

export default function WelcomePage() {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden"
            style={{ background: "linear-gradient(180deg, #98CA32 0%, #98CA32 100%)" }}
        >
            {/* Header — brand logo */}
            <div className="w-full flex items-center justify-center pt-10 pb-2 px-6">
                <span
                    className="text-[64px] font-bold tracking-tight"
                    style={{ color: "var(--nutri-green-text)", fontFamily: "Inter, sans-serif" }}
                >
                    Nutri
                </span>
            </div>

            {/* Hero section — food bowl */}
            <div className="flex-1 flex flex-col items-center justify-center w-full px-6 max-w-md mx-auto">
                {/* Bowl with circular frame */}
                <div className="relative w-[280px] h-[280px] md:w-[340px] md:h-[340px] mx-auto mb-8">
                    {/* Outer glow ring */}
                    <div
                        className="absolute inset-[-12px] rounded-full"
                        style={{ background: "rgba(153,204,51,0.05)" }}
                    />
                    {/* Middle ring */}
                    <div
                        className="absolute inset-[-6px] rounded-full"
                        style={{ background: "rgba(153,204,51,0.1)" }}
                    />
                    {/* Bowl with white border */}
                    <div className="relative w-full h-full rounded-full border-[8px] border-white shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-hidden">
                        <img
                            src="/images/welcome-bowl.png"
                            alt="Fresh healthy food bowl"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Content below bowl */}
                <div className="text-center space-y-4">
                    <h1
                        className="text-[32px] md:text-[36px] font-bold leading-[1.1] tracking-[-0.9px]"
                        style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
                    >
                        Eat Smarter,<br />Live Better
                    </h1>
                    <p
                        className="text-[16px] md:text-[18px] leading-[1.6]"
                        style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}
                    >
                        Personalized nutrition and meal<br />planning for you and your family.
                    </p>

                    {/* Dot pagination */}
                    <div className="flex items-center justify-center gap-2 pt-4">
                        <div className="w-6 h-2 rounded-full" style={{ background: "var(--nutri-green)" }} />
                        <div className="w-2 h-2 rounded-full" style={{ background: "var(--nutri-green-20)" }} />
                        <div className="w-2 h-2 rounded-full" style={{ background: "var(--nutri-green-20)" }} />
                    </div>
                </div>
            </div>

            {/* Footer — CTA buttons */}
            <div className="w-full max-w-md mx-auto px-6 pb-8 pt-6 space-y-4">
                <Link
                    href="/register"
                    className="flex items-center justify-center w-full h-14 rounded-full text-[18px] font-bold text-white no-underline transition-opacity hover:opacity-90"
                    style={{
                        background: "var(--nutri-cta-dark)",
                        fontFamily: "Inter, sans-serif",
                        boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)",
                    }}
                >
                    Get Started
                </Link>
                <Link
                    href="/login"
                    className="flex items-center justify-center w-full h-14 rounded-full text-[18px] font-bold text-white no-underline border-2 border-white transition-opacity hover:opacity-80"
                    style={{ background: "transparent", fontFamily: "Inter, sans-serif" }}
                >
                    Log In
                </Link>
            </div>
        </div>
    )
}
