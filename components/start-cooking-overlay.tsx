"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, X, UtensilsCrossed } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiLogFromCooking } from "@/lib/api"
import { parseTimerDuration } from "@/hooks/use-cooking-timer"
import { CircularTimer, NoTimerPlaceholder } from "@/components/recipe/cooking-timer"
import { NutritionPills } from "@/components/recipe/nutrition-info"

interface StartCookingOverlayProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  steps: string[]
  recipeTitle?: string
  recipeId?: string
  servings?: number
  calories?: number
  protein?: number
  carbs?: number
}

/** Extract a short title from step text */
function extractTitle(text: string): string {
  const colonIdx = text.indexOf(":")
  if (colonIdx > 0 && colonIdx < 50) return text.slice(0, colonIdx)
  const words = text.split(/\s+/).slice(0, 5)
  return words.join(" ") + (text.split(/\s+/).length > 5 ? "…" : "")
}

export function StartCookingOverlay({
  open,
  onOpenChange,
  steps,
  recipeTitle,
  recipeId,
  servings,
  calories,
  protein,
  carbs,
}: StartCookingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showLogPrompt, setShowLogPrompt] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const cookingStartedAt = useRef<string | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Wake Lock
  useEffect(() => {
    if (open) {
      cookingStartedAt.current = new Date().toISOString()
      // Request wake lock
      navigator.wakeLock?.request("screen").then((sentinel) => {
        wakeLockRef.current = sentinel
      }).catch(() => { })
    }
    return () => {
      wakeLockRef.current?.release()
      wakeLockRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      cookingStartedAt.current = null
      setCurrentStep(0)
      setShowLogPrompt(false)
    }
  }, [open])

  const handleClose = useCallback(() => {
    setCurrentStep(0)
    setShowLogPrompt(false)
    wakeLockRef.current?.release()
    wakeLockRef.current = null
    onOpenChange(false)
  }, [onOpenChange])

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep, steps.length])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const handleFinishCooking = useCallback(() => {
    if (recipeId) {
      setShowLogPrompt(true)
    } else {
      handleClose()
    }
  }, [recipeId, handleClose])

  const handleLogMeal = useCallback(async () => {
    if (!recipeId || !cookingStartedAt.current) return
    setIsLogging(true)
    try {
      await apiLogFromCooking({
        recipeId,
        servings: servings ?? 1,
        cookingStartedAt: cookingStartedAt.current,
        cookingFinishedAt: new Date().toISOString(),
      })
      toast({ title: "Meal logged!", description: "Added to your meal log for today." })
      handleClose()
      router.push("/meal-log")
    } catch {
      toast({ title: "Failed to log meal", variant: "destructive" })
    } finally {
      setIsLogging(false)
    }
  }, [recipeId, servings, toast, handleClose, router])

  if (!open) return null

  const progress = ((currentStep + 1) / steps.length) * 100
  const stepText = steps[currentStep] ?? ""
  const stepTitle = extractTitle(stepText)
  const timerDuration = parseTimerDuration(stepText)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 lg:pl-[220px]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="w-full max-w-[480px] h-full lg:h-[90vh] lg:max-h-[900px] lg:rounded-2xl lg:shadow-2xl bg-white flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="flex items-center justify-between">
            {/* Back */}
            <button
              type="button"
              onClick={currentStep > 0 ? handlePrev : handleClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
            </button>

            {/* Title + step counter */}
            <div className="text-center">
              <p className="text-[15px] font-bold text-[#0F172A]">{recipeTitle}</p>
              <p className="text-[12px] font-semibold text-[#99CC33] uppercase tracking-wider">
                STEP {currentStep + 1} OF {steps.length}
              </p>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#0F172A]" />
            </button>
          </div>

          {/* Segmented progress bar */}
          <div className="flex gap-1 mt-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= currentStep ? "bg-[#99CC33]" : "bg-[#E2E8F0]"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-6 flex flex-col items-center">
          {showLogPrompt ? (
            /* ── Log Meal Prompt ── */
            <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-[320px]">
              <div className="w-16 h-16 rounded-full bg-[#F0F7E6] flex items-center justify-center">
                <UtensilsCrossed className="w-8 h-8 text-[#99CC33]" />
              </div>
              <div className="text-center">
                <h2 className="text-[24px] font-bold text-[#0F172A] mb-2">Cooking complete!</h2>
                <p className="text-[14px] text-[#64748B]">Would you like to log this meal?</p>
              </div>
              <div className="w-full space-y-3 mt-4">
                <button
                  type="button"
                  onClick={handleLogMeal}
                  disabled={isLogging}
                  className="w-full py-4 rounded-[48px] bg-[#99CC33] text-white text-[16px] font-bold hover:bg-[#8ABB2A] transition-colors disabled:opacity-50"
                  style={{
                    boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)",
                  }}
                >
                  {isLogging ? "Logging..." : "Log Meal"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 text-[16px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          ) : (
            /* ── Step Content ── */
            <>
              {/* Step Title */}
              <h2 className="text-[24px] font-bold text-[#0F172A] text-center leading-8 mb-4 max-w-[360px]">
                {stepTitle}
              </h2>

              {/* Step Body */}
              <p className="text-[15px] text-[#475569] text-center leading-7 mb-8 max-w-[340px]">
                {stepText}
              </p>

              {/* Timer */}
              {timerDuration ? (
                <CircularTimer durationSeconds={timerDuration} />
              ) : (
                <NoTimerPlaceholder />
              )}

              {/* Nutritional Highlights */}
              <div className="mt-8">
                <NutritionPills calories={calories} protein={protein} carbs={carbs} />
              </div>
            </>
          )}
        </div>

        {/* ── Bottom Navigation ── */}
        {!showLogPrompt && (
          <div className="flex-shrink-0 px-5 pb-6 pt-3 space-y-3 border-t border-[#F1F5F9]">
            {/* Next Step / Finish Cooking */}
            {currentStep === steps.length - 1 ? (
              <>
                <button
                  type="button"
                  onClick={handleFinishCooking}
                  className="w-full py-4 rounded-[48px] bg-[#99CC33] text-white text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-[#8ABB2A] transition-colors"
                  style={{
                    boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)",
                  }}
                >
                  Next Step
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleFinishCooking}
                  className="w-full py-4 rounded-[48px] border-2 border-[#99CC33] text-[#538100] text-[16px] font-bold hover:bg-[#F0F7E6] transition-colors"
                >
                  Finish Cooking
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-4 rounded-[48px] bg-[#99CC33] text-white text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-[#8ABB2A] transition-colors"
                style={{
                  boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)",
                }}
              >
                Next Step
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
