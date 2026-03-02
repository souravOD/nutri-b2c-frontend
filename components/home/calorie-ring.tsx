"use client";

interface CalorieRingProps {
    consumed: number;
    target: number;
    /** Ring diameter in px (default 80) */
    size?: number;
}

export function CalorieRing({ consumed, target, size = 80 }: CalorieRingProps) {
    const pct = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;
    const remaining = Math.max(Math.round(target - consumed), 0);
    const strokeW = size >= 150 ? 14 : 10;
    const radius = (size - strokeW) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    const isDesktop = size >= 150;

    return (
        <div className="flex flex-col items-center">
            <div
                className="relative flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="-rotate-90"
                >
                    {/* Track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#F1F5F9"
                        strokeWidth={strokeW}
                    />
                    {/* Progress */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#99CC33"
                        strokeWidth={strokeW}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                </svg>
                {/* Center label */}
                {isDesktop ? (
                    <div className="absolute flex flex-col items-center">
                        <span
                            className="font-bold text-[30px] leading-9 text-[#0F172A]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {remaining.toLocaleString()}
                        </span>
                        <span
                            className="font-bold text-[12px] tracking-[1.2px] uppercase text-[#64748B] leading-4"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            kcal left
                        </span>
                    </div>
                ) : (
                    <span
                        className="absolute font-bold text-[12px] leading-[16px] text-[#0F172A]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        {pct}%
                    </span>
                )}
            </div>
            {/* Desktop: Daily Goal below ring */}
            {isDesktop && (
                <div className="flex flex-col items-center pt-4">
                    <span
                        className="text-[18px] font-bold text-[#0F172A] leading-7"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        Daily Goal
                    </span>
                    <span
                        className="text-[14px] font-normal text-[#64748B] leading-5"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        {target.toLocaleString()} kcal targeted
                    </span>
                </div>
            )}
        </div>
    );
}
