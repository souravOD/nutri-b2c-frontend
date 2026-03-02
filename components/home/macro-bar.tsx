"use client";

interface MacroBarProps {
    label: string;
    value: number;
    target: number;
    /** Hex color for the filled bar, e.g. "#99CC33" */
    color: string;
}

export function MacroBar({ label, value, target, color }: MacroBarProps) {
    const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;

    return (
        <div className="flex flex-col gap-1 lg:gap-2 w-full">
            <div className="flex items-center justify-between h-5">
                <span
                    className="text-[14px] font-medium lg:font-bold text-[#0F172A] leading-5"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {label}
                </span>
                <span
                    className="text-[14px] font-normal lg:font-bold text-[#0F172A] leading-5"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {Math.round(value)}g / {Math.round(target)}g
                </span>
            </div>
            <div className="w-full h-2 lg:h-3 rounded-full bg-[#F1F5F9] overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}
