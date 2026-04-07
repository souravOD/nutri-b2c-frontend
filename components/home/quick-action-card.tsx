"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    variant: "green" | "white";
}

export function QuickActionCard({
    title,
    description,
    href,
    icon: Icon,
    variant,
}: QuickActionCardProps) {
    const isGreen = variant === "green";

    return (
        <Link
            href={href}
            className={`flex flex-col justify-between p-6 rounded-[16px] flex-1 min-h-[200px] transition-shadow hover:shadow-md ${isGreen
                    ? "bg-[#538100] text-white"
                    : "bg-white border border-[#E2E8F0] text-[#0F172A]"
                }`}
        >
            {/* Icon */}
            <div>
                <div
                    className={`w-12 h-12 rounded-[12px] flex items-center justify-center mb-4 ${isGreen
                            ? "bg-white/20"
                            : "bg-accent/20"
                        }`}
                >
                    <Icon className={`w-6 h-6 ${isGreen ? "text-white" : "text-primary"}`} />
                </div>

                {/* Title */}
                <h3
                    className="text-[20px] font-bold leading-7"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {title}
                </h3>

                {/* Description */}
                <p
                    className={`text-[14px] leading-5 mt-1 ${isGreen ? "text-[#99CC33]/70" : "text-[#64748B]"
                        }`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {description}
                </p>
            </div>

            {/* Arrow */}
            <div className="flex justify-end pt-4">
                <ArrowRight
                    className={`w-4 h-4 ${isGreen ? "text-white" : "text-primary"}`}
                />
            </div>
        </Link>
    );
}
