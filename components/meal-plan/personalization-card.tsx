"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface PersonalizationCardProps {
    dietaryPreference?: string | null;
    calorieTarget?: number | null;
}

export function PersonalizationCard({ dietaryPreference, calorieTarget }: PersonalizationCardProps) {
    const pref = dietaryPreference || "your dietary";
    const kcal = calorieTarget || 2000;

    return (
        <div className="p-4 bg-[#f0f7e6] border border-[#99CC33]/30 rounded-2xl">
            <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-[#538100] mt-0.5 shrink-0" />
                <div className="flex-1">
                    <h4 className="text-base font-bold text-slate-900">Personalized for you</h4>
                    <p className="text-sm text-slate-600 mt-1">
                        Generating plans using your{" "}
                        <span className="font-bold">{pref}</span> preference and{" "}
                        <span className="font-bold">{kcal.toLocaleString()} kcal</span> daily target.
                    </p>
                    <Link
                        href="/profile"
                        className="inline-block mt-2 text-sm font-medium text-[#538100] hover:underline"
                    >
                        Adjust Profile
                    </Link>
                </div>
            </div>
        </div>
    );
}
