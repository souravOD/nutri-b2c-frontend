"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface MethodCardProps {
    icon: ReactNode;
    title: string;
    subtitle: string;
    badge?: string;
    onClick: () => void;
}

/**
 * Analysis method card for the mobile recipe analyzer selector.
 * Shows an icon in a green circle, title with subtitle, optional badge, and chevron.
 */
export function MethodCard({ icon, title, subtitle, badge, onClick }: MethodCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center gap-4 rounded-[20px] bg-white border border-[#F1F5F9] p-4 text-left transition-colors active:bg-[#F8FAFC]"
            style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.04)" }}
        >
            {/* Icon circle */}
            <div className="w-12 h-12 rounded-2xl bg-[#F0F7E0] flex items-center justify-center shrink-0">
                <div className="text-[#538100]">{icon}</div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className="text-[15px] font-semibold text-[#0F172A] leading-5"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        {title}
                    </span>
                    {badge && (
                        <span
                            className="px-2 py-0.5 rounded-full bg-[#F0F7E0] text-[10px] font-bold text-[#538100] uppercase tracking-wider"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {badge}
                        </span>
                    )}
                </div>
                <p
                    className="text-[13px] font-normal text-[#64748B] leading-5 mt-0.5"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {subtitle}
                </p>
            </div>

            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-[#94A3B8] shrink-0" />
        </button>
    );
}
