"use client"

import { useCallback, useState, useMemo } from "react"
import { ArrowLeft, Sparkles, CalendarDays, UtensilsCrossed } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { apiGetProfile, apiGetMyHealth } from "@/lib/api"
import { useMealPlans, useActivatePlan, useDeletePlan } from "@/hooks/use-meal-plan"
import { PlanRecommendationCard } from "@/components/meal-plan/plan-recommendation-card"
import { PersonalizationCard } from "@/components/meal-plan/personalization-card"
import { useToast } from "@/hooks/use-toast"
import { useHouseholdMembers } from "@/hooks/use-household"

export default function MealPlanPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Household members
  const { members } = useHouseholdMembers()
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined)

  // Fetch existing plans via hook (filtered by member when selected)
  const { plans } = useMealPlans(undefined, selectedMemberId)
  const activatePlan = useActivatePlan()
  const deletePlan = useDeletePlan()

  // Fetch user profile for personalization
  const { data: profile } = useQuery({
    queryKey: ["me-profile"],
    queryFn: () => apiGetProfile(),
    staleTime: 120_000,
  })

  // Fetch health targets for personalization
  const { data: health } = useQuery({
    queryKey: ["me-health"],
    queryFn: () => apiGetMyHealth(),
    staleTime: 120_000,
  })

  const hasActivePlan = plans.some((p) => p.status === "active")

  // Build a lookup: memberId -> displayName
  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of members) {
      map.set(m.id, m.fullName?.split(" ")[0] || "Member")
    }
    return map
  }, [members])

  const getMemberLabel = useCallback(
    (plan: { memberIds: string[] | null }) => {
      if (!plan.memberIds || plan.memberIds.length === 0) return null
      const names = plan.memberIds
        .map((id) => memberNameMap.get(id) || "Unknown")
        .join(", ")
      return names
    },
    [memberNameMap]
  )



  const handleActivatePlan = useCallback(
    (planId: string) => {
      activatePlan.mutate(planId, {
        onSuccess: () => {
          toast({ title: "Plan activated!", description: "Navigate to the weekly view to see your plan." })
          router.push("/meal-plan/weekly")
        },
        onError: () => {
          toast({ title: "Failed to activate plan", variant: "destructive" })
        },
      })
    },
    [activatePlan, toast, router],
  )

  const handleDeletePlan = useCallback(
    (planId: string) => {
      deletePlan.mutate(planId, {
        onSuccess: () => {
          toast({ title: "Plan deleted", description: "The meal plan has been removed." })
        },
        onError: () => {
          toast({ title: "Failed to delete plan", variant: "destructive" })
        },
      })
    },
    [deletePlan, toast],
  )

  return (
    <div className="min-h-screen bg-[#F7F8F6] pb-[100px] lg:pb-8">
      <div className="w-full max-w-[600px] mx-auto px-4 md:px-6">

        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="flex items-center justify-between pt-6 pb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1.5 rounded-full hover:bg-[#F1F5F9] transition-colors lg:hidden"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
            </button>
            <h1
              className="text-[20px] font-bold text-[#0F172A]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Meal Planning
            </h1>
          </div>
          <Sparkles className="w-5 h-5 text-[#538100]" />
        </header>

        {/* ── View Quick Links ────────────────────────────────────── */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          <Link
            href="/meal-log"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#E2E8F0] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors whitespace-nowrap"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Daily Log
          </Link>
          <Link
            href="/meal-plan/weekly"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#E2E8F0] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors whitespace-nowrap"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <CalendarDays className="w-4 h-4" />
            Weekly Plan
          </Link>
          <Link
            href="/meal-plan/monthly"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#E2E8F0] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors whitespace-nowrap"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <CalendarDays className="w-4 h-4" />
            Monthly Plan
          </Link>
        </div>

        {/* ── Personalization Card ────────────────────────────────── */}
        <section className="mt-4">
          <PersonalizationCard
            dietaryPreference={(profile as { dietaryPreference?: string })?.dietaryPreference}
            calorieTarget={(health as { targetCalories?: number })?.targetCalories}
          />
        </section>

        {/* ── AI Generate CTA ─────────────────────────────────────── */}
        <section className="mt-4 rounded-[20px] overflow-hidden bg-gradient-to-r from-[#F0F7E6] to-[#F8FBF0] border border-[#E2E8D0] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#538100]" />
            <h3
              className="text-[16px] font-bold text-[#0F172A]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              AI Meal Planner
            </h3>
          </div>
          <p
            className="text-[13px] text-[#64748B] mb-4"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Let AI build you a personalized weekly meal plan based on your dietary goals, preferences, and budget.
          </p>
          <Link
            href="/meal-plan/ai-planner"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#99CC33] text-black text-[14px] font-semibold hover:bg-[#6B8F24] transition-colors"
            style={{
              fontFamily: "Inter, sans-serif",
              boxShadow: "0px 4px 12px rgba(83,129,0,0.25)",
            }}
          >
            <Sparkles className="w-4 h-4" />
            Generate Plan
          </Link>
        </section>

        {/* ── Member Filter (multi-member households) ──────────── */}
        {members.length > 1 && (
          <section className="mt-4">
            <p
              className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Filter by member
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedMemberId(undefined)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap ${
                  selectedMemberId === undefined
                    ? "bg-[#99CC33] text-[#0F172A] shadow-sm"
                    : "bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Everyone
              </button>
              {members.map((member) => {
                const isSelected = selectedMemberId === member.id
                const displayName = member.fullName?.split(" ")[0] || "Member"
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap ${
                      isSelected
                        ? "bg-[#99CC33] text-[#0F172A] shadow-sm"
                        : "bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                    }`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {displayName}{member.isProfileOwner ? " (You)" : ""}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Existing Plans ──────────────────────────────────────── */}
        {plans.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-[16px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {hasActivePlan ? "Your Plans" : "Recommended for this week"}
              </h3>
              {hasActivePlan && (
                <Link
                  href="/meal-plan/weekly"
                  className="text-[13px] font-semibold text-[#538100] hover:underline"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  View Weekly →
                </Link>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {plans.slice(0, 5).map((plan) => {
                const memberLabel = getMemberLabel(plan)
                return (
                  <div key={plan.id}>
                    {memberLabel && members.length > 1 && (
                      <p
                        className="text-[11px] font-semibold text-[#538100] mb-1 ml-1"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        👤 {memberLabel}
                      </p>
                    )}
                    <PlanRecommendationCard
                      plan={plan}
                      onSelect={handleActivatePlan}
                      onDelete={handleDeletePlan}
                      isLoading={activatePlan.isPending}
                      isDeleting={deletePlan.isPending}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Empty State ─────────────────────────────────────────── */}
        {plans.length === 0 && (
          <section className="mt-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F0F7E6] flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-[#99CC33]" />
            </div>
            <h3
              className="text-[18px] font-bold text-[#0F172A] mb-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              No meal plans yet
            </h3>
            <p
              className="text-[14px] text-[#64748B] mb-4 max-w-[280px] mx-auto"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Generate your first AI meal plan to get started with weekly meal planning.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
