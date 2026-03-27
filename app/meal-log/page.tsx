"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Calendar, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  apiGetMealLog,
  apiAddMealItem,
  apiUpdateMealItem,
  apiDeleteMealItem,
  apiLogWater,
  apiCopyDay,
  apiGetStreak,
  apiGetNutritionDaily,
  apiToggleSave,
} from "@/lib/api"
import { useUser } from "@/hooks/use-user"
import { useHouseholdMembers } from "@/hooks/use-household"
import { useSelectedMember } from "@/hooks/use-selected-member"
import { useToast } from "@/hooks/use-toast"
import { CalorieRing } from "@/components/home/calorie-ring"
import { MacroBar } from "@/components/home/macro-bar"
import { DateNavigator } from "@/components/meal/date-navigator"
import { WaterTracker } from "@/components/meal/water-tracker"
import { MealSlotCard } from "@/components/meal/meal-slot-card"
import { QuickAddSheet } from "@/components/meal/quick-add-sheet"
import { MyRecipesPickerSheet } from "@/components/meal/my-recipes-picker-sheet"
import { MealOptionsSheet } from "@/components/meal/meal-options-sheet"
import { LogMealModal } from "@/components/meal/log-meal-modal"
import { LogConfirmation } from "@/components/meal/log-confirmation"
import type { MealType, MealLogItem, Recipe, AddMealItemPayload } from "@/lib/types"

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0]
}

function n(v: number | string | null | undefined): number {
  if (v == null) return 0
  return typeof v === "string" ? parseFloat(v) || 0 : v
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "snack", "dinner"]

export default function DailyLogPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  // ── Household member switching (same pattern as nutrition page) ──
  const { members } = useHouseholdMembers()
  const defaultMember = useMemo(
    () => members.find((m) => m.isProfileOwner) ?? members[0] ?? null,
    [members]
  )
  const { memberId, setMemberId } = useSelectedMember(defaultMember?.id)

  useEffect(() => {
    if (!memberId && defaultMember?.id) setMemberId(defaultMember.id)
  }, [memberId, defaultMember?.id, setMemberId])

  // ── State ──
  const [date, setDate] = useState(new Date())
  const dateStr = toDateStr(date)

  // Quick-add sheet
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddSlot, setQuickAddSlot] = useState<MealType>("breakfast")

  // Meal options sheet
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [optionsItem, setOptionsItem] = useState<MealLogItem | null>(null)

  // Log meal modal
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logRecipe, setLogRecipe] = useState<Recipe | null>(null)

  // Log confirmation
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmData, setConfirmData] = useState({
    calories: 0, protein: 0, carbs: 0, fats: 0,
  })

  // My recipes picker
  const [myRecipesPickerOpen, setMyRecipesPickerOpen] = useState(false)

  // ── Data fetching ──
  const { data: mealLog } = useQuery({
    queryKey: ["meal-log", dateStr, memberId],
    queryFn: () => apiGetMealLog(dateStr, memberId),
    staleTime: 30_000,
  })

  const { data: nutrition } = useQuery({
    queryKey: ["nutrition-daily", dateStr, memberId],
    queryFn: () => apiGetNutritionDaily({ date: dateStr, memberId }),
    staleTime: 30_000,
  })

  const { data: streakData } = useQuery({
    queryKey: ["streak", memberId],
    queryFn: () => apiGetStreak(memberId),
    staleTime: 120_000,
  })

  // ── Mutations ──
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["meal-log", dateStr] })
    queryClient.invalidateQueries({ queryKey: ["nutrition-daily", dateStr] })
  }

  const addMutation = useMutation({
    mutationFn: (payload: AddMealItemPayload) => apiAddMealItem(payload),
    onSuccess: () => invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteMealItem(id, memberId),
    onSuccess: () => invalidate(),
  })

  const waterMutation = useMutation({
    mutationFn: (deltaMl: number) => apiLogWater(dateStr, deltaMl, memberId),
    onSuccess: () => invalidate(),
  })

  const copyDayMutation = useMutation({
    mutationFn: () => {
      const yesterday = new Date(date)
      yesterday.setDate(yesterday.getDate() - 1)
      return apiCopyDay(toDateStr(yesterday), dateStr, memberId)
    },
    onSuccess: () => {
      invalidate()
      toast({ title: "Copied!", description: "Yesterday's meals copied to today." })
    },
    onError: () => {
      toast({ title: "Copy failed", variant: "destructive" })
    },
  })

  // ── Helpers ──
  const items = mealLog?.items ?? []
  const itemsBySlot = (slot: MealType) => items.filter((i) => i.mealType === slot)

  const totals = nutrition?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  const targets = nutrition?.targets ?? { calories: 2000, proteinG: 150, carbsG: 250, fatG: 70 }
  // Source water from the meal log row (backend stores water_ml on meal_logs table)
  const waterGlasses = Math.round(n((mealLog?.log as { waterMl?: number | null })?.waterMl ?? 0) / 250)
  const streakDays = streakData?.currentStreak ?? 0

  // ── Handlers ──
  const handleOpenQuickAdd = useCallback((slot: MealType) => {
    setQuickAddSlot(slot)
    setQuickAddOpen(true)
  }, [])

  const handleOpenOptions = useCallback((item: MealLogItem) => {
    setOptionsItem(item)
    setOptionsOpen(true)
  }, [])

  const handleQuickSelectRecipe = useCallback((recipe: Recipe) => {
    setLogRecipe(recipe)
    setQuickAddOpen(false)
    setLogModalOpen(true)
  }, [])

  const handleConfirmLog = useCallback(
    async (recipeId: string, mealType: MealType, servings: number, memberIds?: string[]) => {
      try {
        if (memberIds?.length) {
          await Promise.all(memberIds.map(mid =>
            addMutation.mutateAsync({
              date: dateStr,
              mealType,
              recipeId,
              servings,
              source: "recipe",
              memberId: mid,
            })
          ))
        } else {
          await addMutation.mutateAsync({
            date: dateStr,
            mealType,
            recipeId,
            servings,
            source: "recipe",
            ...(memberId ? { memberId } : {}),
          })
        }
        setLogModalOpen(false)
        setConfirmData({
          calories: (logRecipe?.nutrition?.calories ?? logRecipe?.calories ?? 0) * servings,
          protein: (logRecipe?.nutrition?.protein_g ?? logRecipe?.protein_g ?? 0) * servings,
          carbs: (logRecipe?.nutrition?.carbs_g ?? logRecipe?.carbs_g ?? 0) * servings,
          fats: (logRecipe?.nutrition?.fat_g ?? logRecipe?.fat_g ?? 0) * servings,
        })
        setConfirmOpen(true)
      } catch {
        toast({ title: "Failed to log meal", variant: "destructive" })
      }
    },
    [addMutation, dateStr, memberId, logRecipe, toast],
  )

  const handleEditPortions = useCallback((item: MealLogItem) => {
    // Simple inline edit — prompt for servings
    const newServings = prompt("Enter new servings:", String(n(item.servings)))
    if (newServings) {
      apiUpdateMealItem(item.id, { servings: parseFloat(newServings) }, memberId).then(() => invalidate())
    }
  }, [memberId])

  const handleRemoveMeal = useCallback((item: MealLogItem) => {
    deleteMutation.mutate(item.id)
    toast({ title: "Meal removed" })
  }, [deleteMutation, toast])

  const handleCopyToTomorrow = useCallback((item: MealLogItem) => {
    const tomorrow = new Date(date)
    tomorrow.setDate(tomorrow.getDate() + 1)
    addMutation.mutate({
      date: toDateStr(tomorrow),
      mealType: item.mealType as MealType,
      ...(item.recipeId ? { recipeId: item.recipeId } : {}),
      ...(item.productId ? { productId: item.productId } : {}),
      ...(item.customName ? { customName: item.customName } : {}),
      servings: n(item.servings),
      source: "copy",
    })
    toast({ title: "Copied to tomorrow" })
  }, [addMutation, date, toast])

  const handleSaveToFavorites = useCallback((item: MealLogItem) => {
    if (item.recipeId) {
      apiToggleSave(item.recipeId).then(() => {
        toast({ title: "Saved to favorites!" })
      })
    }
  }, [toast])

  const handleLogForFamily = useCallback((_item: MealLogItem) => {
    toast({ title: "Coming soon", description: "Family logging will be available in a future update." })
  }, [toast])

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
              Daily Log
            </h1>
          </div>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[#F1F5F9] transition-colors"
            aria-label="Calendar"
          >
            <Calendar className="w-5 h-5 text-[#0F172A]" />
          </button>
        </header>

        {/* ── Member Switcher (dropdown matching nutrition page) ── */}
        {members.length > 1 && (
          <div className="flex items-center justify-end py-2">
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="h-9 px-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20 max-w-[180px] truncate"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName || m.fullName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Date Navigator ─────────────────────────────────────── */}
        <DateNavigator date={date} onChange={setDate} />

        {/* ── Daily Overview Card ─────────────────────────────────── */}
        <section
          className="bg-white border border-[#F1F5F9] rounded-[24px] p-5 mt-2"
          style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-4">
            <CalorieRing consumed={n(totals.calories)} target={n(targets.calories)} />
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              {streakDays > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#538100] bg-[#F0F7E6] px-2.5 py-1 rounded-full self-end"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  🔥 {streakDays} Day Streak!
                </span>
              )}
              <MacroBar label="Protein" value={n(totals.proteinG)} target={n(targets.proteinG)} color="#99CC33" />
              <MacroBar label="Carbs" value={n(totals.carbsG)} target={n(targets.carbsG)} color="#60A5FA" />
              <MacroBar label="Fat" value={n(totals.fatG)} target={n(targets.fatG)} color="#FB923C" />
            </div>
          </div>
        </section>

        {/* ── Water Tracker ──────────────────────────────────────── */}
        <section className="mt-4 bg-white border border-[#F1F5F9] rounded-[20px] p-4">
          <WaterTracker
            current={waterGlasses}
            target={8}
            onToggle={(newGlasses) => {
              const deltaMl = (newGlasses - waterGlasses) * 250
              if (deltaMl !== 0) waterMutation.mutate(deltaMl)
            }}
          />
        </section>

        {/* ── 4 Meal Slots ───────────────────────────────────────── */}
        <div className="flex flex-col gap-3 mt-4">
          {MEAL_TYPES.map((slot) => (
            <MealSlotCard
              key={slot}
              mealType={slot}
              items={itemsBySlot(slot)}
              onAdd={() => handleOpenQuickAdd(slot)}
              onOpenOptions={handleOpenOptions}
            />
          ))}
        </div>

        {/* ── AI CTA Card ────────────────────────────────────────── */}
        <section className="mt-4 rounded-[20px] overflow-hidden bg-gradient-to-r from-[#F0F7E6] to-[#F8FBF0] border border-[#E2E8D0] p-5">
          <h3
            className="text-[16px] font-bold text-[#0F172A] mb-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            AI Meal Planner
          </h3>
          <p
            className="text-[13px] text-[#64748B] mb-4"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Get a personalized plan for today&apos;s goals
          </p>
          <Link
            href="/meal-plan/ai-planner"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#99CC33] text-[#0F172A] text-[14px] font-semibold border border-[#6B8F24] hover:bg-[#6B8F24] transition-colors"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <Sparkles className="w-4 h-4" />
            Generate Plan
          </Link>
        </section>
      </div>

      {/* ── Sheets / Modals ──────────────────────────────────────── */}
      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        mealType={quickAddSlot}
        date={dateStr}
        memberId={memberId}
        onSelectRecipe={handleQuickSelectRecipe}
        onScanProduct={() => router.push("/scan")}
        onFromMyRecipes={() => {
          setQuickAddOpen(false)
          setMyRecipesPickerOpen(true)
        }}
        onCopyYesterday={() => copyDayMutation.mutate()}
      />

      <MealOptionsSheet
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        item={optionsItem}
        onEditPortions={handleEditPortions}
        onCopyToTomorrow={handleCopyToTomorrow}
        onSaveToFavorites={handleSaveToFavorites}
        onLogForFamily={handleLogForFamily}
        onRemoveMeal={handleRemoveMeal}
      />

      <MyRecipesPickerSheet
        open={myRecipesPickerOpen}
        onOpenChange={setMyRecipesPickerOpen}
        mealType={quickAddSlot}
        date={dateStr}
        memberId={memberId}
        onQuickAdd={(recipe) => {
          addMutation.mutateAsync({
            date: dateStr,
            mealType: quickAddSlot,
            recipeId: recipe.id,
            servings: 1,
            source: "recipe",
            ...(memberId ? { memberId } : {}),
          }).then(() => {
            setMyRecipesPickerOpen(false)
            setConfirmData({
              calories: recipe.nutrition?.calories ?? recipe.calories ?? 0,
              protein: recipe.nutrition?.protein_g ?? recipe.protein_g ?? 0,
              carbs: recipe.nutrition?.carbs_g ?? recipe.carbs_g ?? 0,
              fats: recipe.nutrition?.fat_g ?? recipe.fat_g ?? 0,
            })
            setConfirmOpen(true)
          }).catch(() => {
            toast({ title: "Failed to log meal", variant: "destructive" })
          })
        }}
        onSelectRecipe={handleQuickSelectRecipe}
      />

      <LogMealModal
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        recipe={logRecipe}
        onConfirm={handleConfirmLog}
        loading={addMutation.isPending}
        defaultMealType={quickAddSlot}
      />

      <LogConfirmation
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        calories={confirmData.calories}
        protein={confirmData.protein}
        carbs={confirmData.carbs}
        fats={confirmData.fats}
        dailyConsumed={n(totals.calories) + confirmData.calories}
        dailyTarget={n(targets.calories)}
        onViewDailyLog={() => {
          setConfirmOpen(false)
        }}
        onBackToPlanning={() => {
          setConfirmOpen(false)
          router.push("/meal-plan")
        }}
      />
    </div>
  )
}
