"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, UtensilsCrossed } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiLogFromCooking } from "@/lib/api"

interface StartCookingOverlayProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  steps: string[]
  recipeTitle?: string
  recipeId?: string
  servings?: number
}

export function StartCookingOverlay({ open, onOpenChange, steps, recipeTitle, recipeId, servings }: StartCookingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showLogPrompt, setShowLogPrompt] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const cookingStartedAt = useRef<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (open && !cookingStartedAt.current) {
      cookingStartedAt.current = new Date().toISOString()
    }
    if (!open) {
      cookingStartedAt.current = null
    }
  }, [open])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    setTimer(0)
    setIsTimerRunning(false)
    setShowLogPrompt(false)
    onOpenChange(false)
  }

  const handleFinishCooking = () => {
    setIsTimerRunning(false)
    if (recipeId) {
      setShowLogPrompt(true)
    } else {
      handleClose()
    }
  }

  const handleLogMeal = async () => {
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
  }

  const handleSkipLog = () => {
    handleClose()
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
        else onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-3xl h-[90vh] sm:h-auto sm:min-h-[500px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center">{recipeTitle ? `Cooking: ${recipeTitle}` : "Cooking Mode"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col justify-center space-y-6 py-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Number */}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary tabular-nums mb-2">{currentStep + 1}</div>
          </div>

          {/* Step Content */}
          <div className="text-center px-4">
            <p className="text-lg leading-relaxed max-w-2xl mx-auto">{steps[currentStep]}</p>
          </div>

          {/* Timer */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-mono font-bold">{formatTime(timer)}</div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsTimerRunning(!isTimerRunning)}>
                {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTimer(0)
                  setIsTimerRunning(false)
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Log Meal Prompt */}
        {showLogPrompt && (
          <div className="flex-shrink-0 border-t pt-4 space-y-3">
            <div className="text-center space-y-2">
              <UtensilsCrossed className="h-8 w-8 mx-auto text-green-600" />
              <p className="font-semibold">Cooking complete!</p>
              <p className="text-sm text-muted-foreground">Would you like to log this meal?</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSkipLog} className="flex-1">
                Skip
              </Button>
              <Button onClick={handleLogMeal} disabled={isLogging} className="flex-1 bg-green-600 hover:bg-green-700">
                {isLogging ? "Logging..." : "Log Meal"}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {!showLogPrompt && (
          <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">
              Exit Cooking Mode
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button onClick={handleFinishCooking} className="bg-green-600 hover:bg-green-700">
                Finish Cooking
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next Step
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
