"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, CheckCircle, Pencil } from "lucide-react"
import { useOnboarding } from "../onboarding-context"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { apiPatchSettings } from "@/lib/api"
import type { TaxonomyOption } from "@/lib/api"

function resolveCodes(selected: string[], options: TaxonomyOption[]): string[] {
    return selected.map((name) => {
        const match = options.find((o) => o.name === name || o.code === name)
        return match ? match.code : name
    })
}

export default function ReviewPage() {
    const router = useRouter()
    const { data, allergenOptions, healthConditionOptions } = useOnboarding()
    const { updateUser, refresh } = useUser()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleFinish() {
        setIsSubmitting(true)
        try {
            const allergenCodes = resolveCodes(data.allergens, allergenOptions)
            const conditionCodes = resolveCodes(data.healthConditions, healthConditionOptions)

            await updateUser({
                dateOfBirth: data.dob || undefined,
                sex: data.sex,
                activityLevel: data.activityLevel,
                goal: data.goal,
                height: data.heightValue ? `${data.heightValue} ${data.heightUnit}` : undefined,
                weight: data.weightValue ? `${data.weightValue} ${data.weightUnit}` : undefined,
                allergen_codes: allergenCodes,
                condition_codes: conditionCodes,
            })

            // PRD-33: Save location to backend via settings endpoint
            if (data.country) {
                try {
                    await apiPatchSettings({
                        locationCountry: data.country,
                        locationState: data.state || null,
                        locationZipCode: data.zipCode || null,
                    })
                } catch (e) {
                    console.error("[onboarding] Location save failed:", e)
                }
            }

            await refresh()
            router.replace("/onboarding/success")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save profile."
            toast({ title: "Save failed", description: message, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const activityLabel = {
        sedentary: "Sedentary",
        lightly_active: "Lightly Active",
        moderately_active: "Moderately Active",
        very_active: "Very Active",
        extra_active: "Extra Active",
    }[data.activityLevel] || data.activityLevel

    return (
        <div className="rv-page min-h-screen flex flex-col" style={{ background: "var(--nutri-bg)" }}>
            {/* Header */}
            <div className="rv-header flex items-center justify-between px-4 pt-4 pb-2">
                <button onClick={() => router.back()} className="rv-back flex items-center justify-center w-10 h-10 rounded-full" style={{ background: "rgba(226,232,240,0.5)" }}>
                    <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
                </button>
                <span className="rv-title text-[18px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Review Your Profile</span>
                <div className="rv-spacer w-10" />
            </div>

            {/* Dot pagination */}
            <div className="flex items-center justify-center gap-2 py-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full" style={{ background: "var(--nutri-green-20)" }} />
                ))}
                <div className="w-6 h-2 rounded-full" style={{ background: "var(--nutri-green)" }} />
            </div>

            {/* Heading + CTA (desktop: side-by-side) */}
            <div className="rv-heading-row text-center px-6 pb-4">
                <div className="rv-heading-text">
                    <h1 className="text-[28px] font-bold leading-[35px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
                        Does everything look correct?
                    </h1>
                    <p className="mt-2 text-[14px] leading-[20px]" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>
                        Check your details before we personalize your nutrition plan.
                    </p>
                </div>
                {/* Desktop-only inline Confirm button */}
                <div className="rv-desktop-cta">
                    <button
                        onClick={handleFinish} disabled={isSubmitting}
                        className="rv-confirm-btn h-14 rounded-full flex items-center justify-center gap-2 text-[16px] font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.25), 0px 4px 6px -4px rgba(153,204,51,0.25)", padding: "0 40px" }}
                    >
                        {isSubmitting ? "Saving..." : "Confirm & Finish"} <CheckCircle className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Cards */}
            <div className="rv-cards flex-1 px-6 pb-[140px] space-y-4 max-w-[480px] mx-auto w-full overflow-y-auto">
                {/* Personal Info */}
                <div className="p-6 rounded-3xl border" style={{ background: "white", borderColor: "var(--nutri-border)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[16px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Personal Info</h3>
                        <button onClick={() => router.push("/onboarding/personal-info")} className="flex items-center gap-1 text-[14px] font-medium" style={{ color: "var(--nutri-green-dark)", fontFamily: "Inter, sans-serif" }}>
                            <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--nutri-body-light)" }}>Age</p>
                            <p className="text-[16px] font-medium" style={{ color: "var(--nutri-heading)" }}>{data.dob ? `${Math.floor((Date.now() - new Date(data.dob).getTime()) / 31557600000)} years` : "—"}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--nutri-body-light)" }}>Gender</p>
                            <p className="text-[16px] font-medium capitalize" style={{ color: "var(--nutri-heading)" }}>{data.sex}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--nutri-body-light)" }}>Height</p>
                            <p className="text-[16px] font-medium" style={{ color: "var(--nutri-heading)" }}>{data.heightValue || "—"} {data.heightUnit}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--nutri-body-light)" }}>Current Weight</p>
                            <p className="text-[16px] font-medium" style={{ color: "var(--nutri-heading)" }}>{data.weightValue || "—"} {data.weightUnit}</p>
                        </div>
                    </div>
                </div>

                {/* Health Goals */}
                <div className="p-6 rounded-3xl border" style={{ background: "white", borderColor: "var(--nutri-border)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[16px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Health Goals</h3>
                        <button onClick={() => router.push("/onboarding/goals")} className="flex items-center gap-1 text-[14px] font-medium" style={{ color: "var(--nutri-green-dark)", fontFamily: "Inter, sans-serif" }}>
                            <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--nutri-body-light)" }}>Activity Level</p>
                            <p className="text-[16px] font-medium" style={{ color: "var(--nutri-heading)" }}>{activityLabel}</p>
                        </div>
                    </div>
                </div>

                {/* Dietary Preferences */}
                {(data.allergens.length > 0 || data.healthConditions.length > 0) && (
                    <div className="p-6 rounded-3xl border" style={{ background: "white", borderColor: "var(--nutri-border)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[16px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Dietary Preferences</h3>
                            <button onClick={() => router.push("/onboarding/health")} className="flex items-center gap-1 text-[14px] font-medium" style={{ color: "var(--nutri-green-dark)", fontFamily: "Inter, sans-serif" }}>
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[...data.allergens, ...data.healthConditions].map((tag) => (
                                <span key={tag} className="px-3 py-1 rounded-full text-[13px] font-medium border" style={{ background: "var(--nutri-green-5)", borderColor: "var(--nutri-green-10)", color: "var(--nutri-green-dark)" }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Location (PRD-33) */}
                {data.country && (
                    <div className="p-6 rounded-3xl border" style={{ background: "white", borderColor: "var(--nutri-border)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[16px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Location</h3>
                            <button onClick={() => router.push("/onboarding/location")} className="flex items-center gap-1 text-[14px] font-medium" style={{ color: "var(--nutri-green-dark)", fontFamily: "Inter, sans-serif" }}>
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--nutri-body-light)" }}>Country</p>
                                <p className="text-[16px] font-medium" style={{ color: "var(--nutri-heading)" }}>{data.country}</p>
                            </div>
                            {data.state && (
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--nutri-body-light)" }}>State / Region</p>
                                    <p className="text-[16px] font-medium" style={{ color: "var(--nutri-heading)" }}>{data.state}</p>
                                </div>
                            )}
                            {data.zipCode && (
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--nutri-body-light)" }}>ZIP / Postal</p>
                                    <p className="text-[16px] font-medium" style={{ color: "var(--nutri-heading)" }}>{data.zipCode}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Footer (hidden on desktop) */}
            <div className="rv-mobile-footer fixed bottom-0 left-0 right-0 px-6 py-6 max-w-[480px] mx-auto" style={{ background: "var(--nutri-bg)", backdropFilter: "blur(6px)" }}>
                <button
                    onClick={handleFinish} disabled={isSubmitting}
                    className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[16px] font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.25), 0px 4px 6px -4px rgba(153,204,51,0.25)" }}
                >
                    {isSubmitting ? "Saving..." : "Confirm & Finish"} <CheckCircle className="w-4 h-4" />
                </button>
            </div>

            <style jsx>{`
                .rv-desktop-cta { display: none; }

                @media (min-width: 1024px) {
                    .rv-header {
                        max-width: 1160px; margin: 0 auto; width: 100%;
                        padding: 16px 60px 8px; box-sizing: border-box;
                        justify-content: flex-start; gap: 12px;
                    }
                    .rv-spacer { display: none; }
                    .rv-title { font-size: 22px; font-weight: 700; }
                    .rv-heading-row {
                        display: flex; align-items: center; justify-content: space-between;
                        max-width: 1160px; margin: 0 auto; width: 100%;
                        padding: 0 84px 16px; box-sizing: border-box;
                        text-align: left;
                    }
                    .rv-heading-text { flex: 1; }
                    .rv-desktop-cta { display: block; flex-shrink: 0; margin-left: 24px; }
                    .rv-confirm-btn { white-space: nowrap; min-width: 240px; }
                    .rv-cards {
                        max-width: 1160px; padding: 0 84px 40px;
                        box-sizing: border-box;
                    }
                    .rv-mobile-footer { display: none; }
                }
            `}</style>
        </div>
    )
}
