"use client"

import { useEffect, useState } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { SourceForm } from "@/components/analyzer/source-form"
import { ResultPanel } from "@/components/analyzer/result-panel"
import { analyzeRecipe } from "@/lib/analyze"
import { apiAnalyzeText, apiAnalyzeUrl, apiAnalyzeImage, apiAnalyzeBarcode, apiSaveAnalyzedRecipe } from "@/lib/api"
import type { AnalyzeResult } from "@/lib/types"
import { MemberSelector } from "@/components/analyzer/member-selector"

export type SourceType = "paste" | "link" | "photo" | "barcode" | "live"

export interface SourceData {
  type: SourceType
  rawText?: string
  imageUrl?: string
  barcode?: string
}

const STORAGE_KEY = "recipe_analyzer_state_v1"

export default function RecipeAnalyzerPage() {
  // Always start with fresh input state
  const [source, setSource] = useState<SourceData>({ type: "paste", rawText: "" })
  const [result, setResult] = useState<AnalyzeResult>()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [memberId, setMemberId] = useState<string | undefined>()
  const [showMemberSelector, setShowMemberSelector] = useState(false)

  useEffect(() => {
    // restore previous session (only restore result, not input text)
    // This allows users to see their last analysis result while starting fresh with input
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Only restore the result, not the source input (to allow fresh input)
          if (parsed?.result) {
            setResult(parsed.result)
          }
        } catch (err) {
          console.warn("[RecipeAnalyzer] Failed to restore from localStorage:", err)
        }
      }
    }
  }, [])

  const handleAnalyze = async () => {
    const text = (source.rawText || "").trim()
    const hasImage = !!source.imageUrl
    const hasBarcode = !!source.barcode

    if (!text && !hasImage && !hasBarcode) return
    setIsAnalyzing(true)
    try {
      let analyzed: AnalyzeResult

      if (source.type === "photo" && hasImage) {
        analyzed = await apiAnalyzeImage(source.imageUrl!, memberId)
      } else if (source.type === "link" && text) {
        analyzed = await apiAnalyzeUrl(text, memberId)
      } else if ((source.type === "barcode" || source.type === "live") && hasBarcode) {
        analyzed = await apiAnalyzeBarcode(source.barcode!, memberId)
      } else if (text) {
        analyzed = await analyzeRecipe(text, memberId)
      } else {
        throw new Error("No input provided — paste text, upload a photo, or scan a barcode.")
      }

      setResult(analyzed)
      // Save result to localStorage (but not source input, so input stays fresh on refresh)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ result: analyzed }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("[RecipeAnalyzer] Analysis failed:", message)
      // Show user-friendly error message
      alert(`Analysis failed: ${message}. Check console for details.`)
      // Error is handled by fallback in analyzeRecipe, but we still show the error
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!result) return
    try {
      const saved = await apiSaveAnalyzedRecipe(result)
      alert(`Recipe saved! ID: ${saved.id}`)
    } catch (err) {
      console.error("Save failed:", err)
      alert("Failed to save recipe")
    }
  }

  const handleExport = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "recipe-analysis.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setSource({ type: "paste", rawText: "" })
    setResult(undefined)
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleOpenInBuilder = () => {
    if (!result) return
    // seed the builder draft (localStorage only; no backend change)
    const builderData = {
      id: `draft_${Date.now()}`,
      title: result.title || "Untitled",
      description: result.summary || "",
      servings: result.servings || 1,
      ingredients: result.ingredients,
      steps: result.steps || [],
      currentStep: "meta" as const,
      isDirty: true,
    }
    localStorage.setItem("recipe_builder_draft_v1", JSON.stringify(builderData))
    window.location.href = "/recipes/build"
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Recipe Analyzer</h1>
            <p className="text-muted-foreground mt-2">
              Analyze recipes from text, links, photos, or barcodes to get nutrition, allergens, and tips.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showMemberSelector && (
              <MemberSelector value={memberId} onChange={setMemberId} />
            )}
            <button
              onClick={() => setShowMemberSelector(!showMemberSelector)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {showMemberSelector ? "Hide" : "Show"} Family Member
            </button>
            <button
              onClick={handleClear}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-200px)] min-h-[600px]">
        <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
          <ResizablePanel defaultSize={40} minSize={30}>
            <SourceForm source={source} onChange={setSource} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={60} minSize={40}>
            <ResultPanel
              result={result}
              loading={isAnalyzing}
              onEdit={setResult}
              onExport={handleExport}
              onOpenInBuilder={handleOpenInBuilder}
              onSave={handleSave}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
