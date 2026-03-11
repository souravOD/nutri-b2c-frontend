"use client";

import { Leaf, Wheat, Flame, Droplets, CircleDot } from "lucide-react";
import type { ReactNode } from "react";

interface DietBadgesProps {
    tags: string[];
}

const BADGE_CONFIG: Record<string, { icon: ReactNode; bg: string; text: string }> = {
    Vegan: { icon: <Leaf className="w-3.5 h-3.5" />, bg: "bg-[#ECFDF5]", text: "text-[#065F46]" },
    Vegetarian: { icon: <Leaf className="w-3.5 h-3.5" />, bg: "bg-[#ECFDF5]", text: "text-[#065F46]" },
    "Gluten-Free": { icon: <Wheat className="w-3.5 h-3.5" />, bg: "bg-[#FFF7ED]", text: "text-[#9A3412]" },
    Keto: { icon: <Flame className="w-3.5 h-3.5" />, bg: "bg-[#FEF2F2]", text: "text-[#991B1B]" },
    "Low Sodium": { icon: <Droplets className="w-3.5 h-3.5" />, bg: "bg-[#EFF6FF]", text: "text-[#1E40AF]" },
    "Lactose-Free": { icon: <CircleDot className="w-3.5 h-3.5" />, bg: "bg-[#F5F3FF]", text: "text-[#5B21B6]" },
    Organic: { icon: <Leaf className="w-3.5 h-3.5" />, bg: "bg-[#ECFDF5]", text: "text-[#065F46]" },
    "Palm Oil Free": { icon: <Leaf className="w-3.5 h-3.5" />, bg: "bg-[#ECFDF5]", text: "text-[#065F46]" },
    "No Added Sugar": { icon: <CircleDot className="w-3.5 h-3.5" />, bg: "bg-[#FFF7ED]", text: "text-[#9A3412]" },
};

/**
 * Diet compatibility badges row for scan result page.
 * Each badge shows an icon + label with color-coded background.
 */
export function DietBadges({ tags }: DietBadgesProps) {
    if (!tags.length) return null;

    return (
        <section>
            <h3
                className="text-[14px] font-bold text-[#0F172A] mb-2.5"
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                Diet Compatibility
            </h3>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                    const config = BADGE_CONFIG[tag] ?? {
                        icon: <CircleDot className="w-3.5 h-3.5" />,
                        bg: "bg-[#F1F5F9]",
                        text: "text-[#334155]",
                    };
                    return (
                        <span
                            key={tag}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${config.bg} ${config.text}`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {config.icon}
                            {tag}
                        </span>
                    );
                })}
            </div>
        </section>
    );
}
