"use client"

import { useMemo, useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bell, ScanBarcode, Sparkles, Clock } from "lucide-react"
import { useUnreadCount } from "@/hooks/use-notifications"
import Link from "next/link"
import { apiGetFeed, apiAddMealLogItem, apiGetNutritionDaily, apiRejectRecipe, apiGetGroceryLists, apiGetGroceryListDetail } from "@/lib/api"
import { useUser } from "@/hooks/use-user"
import { useFavorites } from "@/hooks/use-favorites"
import { useActiveMember } from "@/contexts/member-context"
import { MemberSwitcher } from "@/components/member-switcher"
import { useHouseholdMembers } from "@/hooks/use-household"
import { CalorieRing } from "@/components/home/calorie-ring"
import { MacroBar } from "@/components/home/macro-bar"
import { RecipeCardHome } from "@/components/home/recipe-card-home"
import { QuickActionCard } from "@/components/home/quick-action-card"
import { LogMealModal } from "@/components/meal/log-meal-modal"
import { QuickScanFAB } from "@/components/layout/quick-scan-fab"
import { useToast } from "@/hooks/use-toast"
import type { Recipe, MealType } from "@/lib/types"

function getSubtitle(): string {
  const h = new Date().getHours()
  if (h < 12) return "Today's meal log is looking great!"
  if (h < 17) return "You're on track with your goals!"
  return "Almost done for the day — great job!"
}

export default function HomePage() {
  const { user } = useUser()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { toast } = useToast()
  const { data: unreadCount = 0 } = useUnreadCount()
  const { activeMemberId, setActiveMember } = useActiveMember()
  const { members: householdMembers = [] } = useHouseholdMembers()

  const [logRecipe, setLogRecipe] = useState<Recipe | null>(null)
  const [logOpen, setLogOpen] = useState(false)
  const [logLoading, setLogLoading] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const { data: nutrition } = useQuery({
    queryKey: ["nutrition-daily"],
    queryFn: () => apiGetNutritionDaily(),
    staleTime: 60_000,
  })

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["home-feed", activeMemberId],
    queryFn: () => apiGetFeed(activeMemberId ?? undefined),
    staleTime: 120_000,
  })

  // Grocery list data for desktop footer preview
  const { data: groceryData } = useQuery({
    queryKey: ["grocery-lists-active"],
    queryFn: async () => {
      try {
        const { lists } = await apiGetGroceryLists("active")
        if (lists.length === 0) return null
        const detail = await apiGetGroceryListDetail(lists[0].id)
        return detail
      } catch {
        return null
      }
    },
    staleTime: 300_000,
  })

  const visibleRecipes = useMemo(
    () => recipes.filter((r) => !dismissed.has(r.id)),
    [recipes, dismissed],
  )

  const handleDismiss = useCallback(async (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
    try {
      await apiRejectRecipe(id)
    } catch {
      // silent — local dismiss already happened
    }
  }, [])

  const handleAddToLog = useCallback((recipe: Recipe) => {
    setLogRecipe(recipe)
    setLogOpen(true)
  }, [])

  const handleConfirmLog = useCallback(
    async (recipeId: string, mealType: MealType, servings: number, memberIds?: string[]) => {
      setLogLoading(true)
      try {
        const today = new Date().toISOString().split("T")[0]
        if (memberIds?.length) {
          await Promise.all(memberIds.map(mid =>
            apiAddMealLogItem({
              date: today,
              mealType,
              recipeId,
              servings,
              source: "recipe",
              memberId: mid,
            })
          ))
        } else {
          await apiAddMealLogItem({
            date: today,
            mealType,
            recipeId,
            servings,
            source: "recipe",
          })
        }
        toast({
          title: "Added to meal log",
          description: `${logRecipe?.title ?? "Recipe"} logged as ${mealType}`,
        })
        setLogOpen(false)
      } catch (err) {
        toast({
          title: "Failed to log meal",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        })
      } finally {
        setLogLoading(false)
      }
    },
    [logRecipe, toast],
  )

  const totals = nutrition?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  const targets = nutrition?.targets ?? { calories: 2000, proteinG: 150, carbsG: 250, fatG: 70 }
  const firstName = user?.name?.split(" ")[0] ?? "there"

  const praiseText = useMemo(() => {
    if (totals.proteinG > 30) return "Great protein choice!"
    if (totals.calories > 0) return "Keep it up — you're doing great!"
    return "Log your first meal to get started!"
  }, [totals])

  // Compute "on track" percentage for desktop subtitle
  const onTrackPct = useMemo(() => {
    if (targets.calories <= 0) return 0
    return Math.min(Math.round((totals.calories / targets.calories) * 100), 100)
  }, [totals.calories, targets.calories])

  // Grocery preview items (first 3 unpurchased)
  const groceryPreviewItems = useMemo(() => {
    if (!groceryData?.items) return []
    return groceryData.items
      .filter((item) => !item.isPurchased)
      .slice(0, 3)
  }, [groceryData])

  return (
    <div className="min-h-screen bg-[#F7F8F6] pb-[100px] lg:pb-8">
      {/* Centered container with comfortable max-width */}
      <div className="w-full max-w-[900px] mx-auto px-4 md:px-6">

        {/* ── Header: Nutri + Bell (mobile/tablet only — sidebar has brand on lg) ── */}
        <header className="flex items-center justify-between pt-6 pb-2 lg:hidden">
          <h1
            className="text-[24px] font-bold text-[#538100] leading-8 tracking-[-0.6px]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Nutri
          </h1>
          <Link href="/notifications" className="relative p-2 rounded-full" aria-label="Notifications">
            <Bell className="w-5 h-5 text-[#0F172A]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] border-2 border-[#F7F8F6]" />
            )}
          </Link>
        </header>

        {/* Desktop: bell is now in FigmaTopBar, no duplicate needed */}

        {/* ── Member Switcher (replaces Individual/Family toggle) ── */}
        {householdMembers.length > 1 && (
          <div className="py-3">
            <MemberSwitcher
              members={householdMembers}
              activeId={activeMemberId || (user as any)?.b2cCustomerId || ""}
              onChange={setActiveMember}
            />
          </div>
        )}

        {/* ── Greeting ───────────────────────────────────────────── */}
        <section className="pt-2 pb-4">
          <h2
            className="text-[24px] lg:text-[30px] font-bold text-[#0F172A] leading-8 lg:leading-9 tracking-[-0.6px]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Hi {firstName},
          </h2>
          {/* Mobile subtitle */}
          <p
            className="text-[16px] font-normal text-[#64748B] leading-6 lg:hidden"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {getSubtitle()}
          </p>
          {/* Desktop subtitle — shows on-track percentage */}
          <p
            className="hidden lg:block text-[16px] font-normal text-[#64748B] leading-6"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Your nutrition plan is {onTrackPct}% on track today. You&apos;re doing great!
          </p>
        </section>

        {/* ── Nutrition Summary + Quick Actions (desktop: side-by-side) ─── */}
        <div className="lg:flex lg:gap-8 lg:items-stretch">
          {/* Nutrition Summary Card */}
          <section
            className="bg-white border border-[#F1F5F9] rounded-[32px] lg:rounded-[16px] p-5 lg:p-6 lg:flex-[2]"
            style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06), 0px 1px 2px -1px rgba(0,0,0,0.06)" }}
          >
            {/* Mobile: stacked layout */}
            <div className="lg:hidden">
              {/* Top row: progress info + ring */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[12px] font-medium text-[#64748B] uppercase tracking-[0.7px] leading-4"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Daily Progress
                  </span>
                  <div className="flex items-end">
                    <span className="text-[26px] font-bold text-[#0F172A] leading-8" style={{ fontFamily: "Inter, sans-serif" }}>
                      {Math.round(totals.calories)}{" "}
                    </span>
                    <span className="text-[16px] font-normal text-[#94A3B8] leading-6" style={{ fontFamily: "Inter, sans-serif" }}>
                      / {Math.round(targets.calories)} kcal
                    </span>
                  </div>
                </div>
                <CalorieRing consumed={totals.calories} target={targets.calories} />
              </div>

              {/* Macro bars */}
              <div className="flex flex-col gap-3 mt-4">
                <MacroBar label="Protein" value={Number(totals.proteinG)} target={Number(targets.proteinG)} color="#99CC33" />
                <MacroBar label="Carbs" value={Number(totals.carbsG)} target={Number(targets.carbsG)} color="#60A5FA" />
                <MacroBar label="Fats" value={Number(totals.fatG)} target={Number(targets.fatG)} color="#FB923C" />
              </div>

              {/* Praise */}
              <div className="flex gap-1 items-center mt-3">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 0C2.688 0 0 2.688 0 6C0 9.312 2.688 12 6 12C9.312 12 12 9.312 12 6C12 2.688 9.312 0 6 0ZM5.4 9L2.4 6L3.252 5.148L5.4 7.29L8.748 3.942L9.6 4.8L5.4 9Z" fill="#538100" />
                </svg>
                <span className="text-[12px] font-semibold text-[#538100] leading-4" style={{ fontFamily: "Inter, sans-serif" }}>
                  {praiseText}
                </span>
              </div>
            </div>

            {/* Desktop: side-by-side ring + macros */}
            <div className="hidden lg:flex lg:gap-8 lg:items-center lg:h-full">
              {/* Left: Calorie Ring (large) */}
              <div className="flex-shrink-0">
                <CalorieRing consumed={totals.calories} target={targets.calories} size={192} />
              </div>
              {/* Right: Macro Bars */}
              <div className="flex-1 flex flex-col justify-center gap-6">
                <MacroBar label="Proteins" value={Number(totals.proteinG)} target={Number(targets.proteinG)} color="#99CC33" />
                <MacroBar label="Carbohydrates" value={Number(totals.carbsG)} target={Number(targets.carbsG)} color="#FB923C" />
                <MacroBar label="Fats" value={Number(totals.fatG)} target={Number(targets.fatG)} color="#60A5FA" />
              </div>
            </div>
          </section>

          {/* Quick Actions — desktop only */}
          <div className="hidden lg:flex lg:flex-col lg:gap-4 lg:flex-1 lg:min-w-[280px]">
            <QuickActionCard
              title="Food Scanner"
              description="Instant nutritional facts from any barcode or meal photo."
              href="/scan"
              icon={ScanBarcode}
              variant="green"
            />
            <QuickActionCard
              title="AI Planner"
              description="Let AI build your weekly menu based on your fridge contents."
              href="/meal-plan/generate"
              icon={Sparkles}
              variant="white"
            />
          </div>
        </div>

        {/* ── Recommended Recipes ─────────────────────────────────── */}
        <section className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[20px] lg:text-[24px] font-bold text-[#0F172A] leading-7 lg:leading-8" style={{ fontFamily: "Inter, sans-serif" }}>
              Recommended for you
            </h3>
            <Link href="/search" className="text-[14px] font-semibold lg:font-bold text-[#99CC33] lg:text-[#538100] leading-5" style={{ fontFamily: "Inter, sans-serif" }}>
              View all
            </Link>
          </div>

          {/* 1-col mobile, 2-col on md, 4-col on lg */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[300px] animate-pulse rounded-[32px] lg:rounded-[16px] bg-[#F1F5F9]" />
              ))
            ) : visibleRecipes.length === 0 ? (
              <div className="col-span-full rounded-[24px] border border-[#F1F5F9] bg-white p-8 text-center">
                <p className="font-medium text-[#0F172A]">No recipes to show</p>
                <p className="text-sm text-[#64748B] mt-1">Check back later for personalized recommendations.</p>
              </div>
            ) : (
              visibleRecipes.map((recipe) => (
                <RecipeCardHome
                  key={recipe.id}
                  recipe={recipe}
                  isSaved={isFavorite(recipe.id)}
                  onAddToLog={handleAddToLog}
                  onDismiss={handleDismiss}
                  onToggleSave={toggleFavorite}
                />
              ))
            )}
          </div>
        </section>

        {/* ── Desktop Footer: Recent Activity + Grocery List Preview ─────── */}
        <section className="hidden lg:flex lg:gap-8 lg:border-t lg:border-[#E2E8F0] lg:pt-8 lg:mt-8">
          {/* Recent Activity — Coming Soon */}
          <div className="flex-1">
            <h3
              className="text-[16px] font-bold text-[#0F172A] leading-6 mb-4"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Recent Activity
            </h3>
            <div className="flex flex-col gap-4 items-center justify-center py-8 rounded-[12px] border border-[#F1F5F9] bg-white">
              <Clock className="w-8 h-8 text-[#94A3B8]" />
              <p className="text-[14px] font-medium text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                Coming Soon
              </p>
              <p className="text-[12px] text-[#CBD5E1] max-w-[200px] text-center" style={{ fontFamily: "Inter, sans-serif" }}>
                Track your nutrition milestones and achievements here.
              </p>
            </div>
          </div>

          {/* Grocery List Preview — real data */}
          <div className="flex-1">
            <h3
              className="text-[16px] font-bold text-[#0F172A] leading-6 mb-4"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Grocery List Preview
            </h3>
            {groceryPreviewItems.length > 0 ? (
              <div className="bg-white border border-[#F1F5F9] rounded-[12px] p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  {groceryPreviewItems.map((item) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <div className="w-4 h-4 rounded border-2 border-[#99CC33] flex-shrink-0" />
                      <span
                        className="text-[14px] text-[#0F172A] leading-5"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {item.itemName}{item.quantity ? ` (${item.quantity}${item.unit ? item.unit : ""})` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/grocery-list"
                  className="text-[12px] font-bold text-[#538100] leading-4"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  View Full List →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4 items-center justify-center py-8 rounded-[12px] border border-[#F1F5F9] bg-white">
                <p className="text-[14px] font-medium text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                  No active grocery list
                </p>
                <Link
                  href="/grocery-list"
                  className="text-[12px] font-bold text-[#538100]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Create one →
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      <QuickScanFAB />

      <LogMealModal
        recipe={logRecipe}
        open={logOpen}
        onOpenChange={setLogOpen}
        onConfirm={handleConfirmLog}
        loading={logLoading}
      />
    </div>
  )
}
