"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Scan, CameraIcon, FileText, Link2, ArrowLeft, AlertTriangle,
  Camera, ImagePlus, X, Loader2, CheckCircle2, Search,
} from "lucide-react"
import { MethodCard } from "@/components/analyze/method-card"
import { apiAnalyzeBarcode } from "@/lib/api"
import type { ScanHistoryItem } from "@/lib/scan-api"
import { MemberSelector } from "@/components/analyzer/member-selector"
import { ManualCodeEntry } from "@/components/scan/manual-code-entry"
import { Button } from "@/components/ui/button"
import { AnalyzerProvider, useAnalyzer } from "@/components/analyzer/analyzer-context"
import { AnalyzerResult } from "@/components/analyzer/analyzer-result"
import type { SourceType } from "@/components/analyzer/analyzer-context"

// ── Inner component ────────────────────────────────────────────────────────

function RecipeAnalyzerInner() {
  const router = useRouter()
  const {
    step, setStep,
    source, setSource,
    result, setResult,
    isAnalyzing, error, setError,
    memberId, setMemberId,
    runAnalysis, handleClear,
  } = useAnalyzer()

  const [showMemberSelector, setShowMemberSelector] = useState(false)
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([])

  // ── Mobile analyzing animation state ───────────────────────────────────
  const [progress, setProgress] = useState(0)
  const [ingredientStatus, setIngredientStatus] = useState<"loading" | "done">("loading")
  const [allergenStatus, setAllergenStatus] = useState<"loading" | "done">("loading")
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load recent scans
  useEffect(() => {
    async function loadRecent() {
      try {
        const mod = await import("@/lib/scan-api")
        const { items } = await mod.apiGetScanHistory(5)
        setRecentScans(items)
      } catch { /* silently ignore */ }
    }
    loadRecent()
  }, [])

  // When step transitions to "analyzing", start progress animation
  useEffect(() => {
    if (step === "analyzing") {
      setProgress(0)
      setIngredientStatus("loading")
      setAllergenStatus("loading")
      progressRef.current = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 8))
      }, 400)
      setTimeout(() => setIngredientStatus("done"), 2000)
      setTimeout(() => setAllergenStatus("done"), 4000)
    } else {
      if (progressRef.current) clearInterval(progressRef.current)
      if (step === "result") setProgress(100)
    }
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [step])

  // ── Validate + run ─────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setError(null)
    const text = (source.rawText || "").trim()

    if (source.type === "paste") {
      if (!text || text.length < 10) {
        setError("Please enter at least 10 characters of recipe text.")
        return
      }
    } else if (source.type === "link") {
      try {
        const u = new URL(text)
        if (!["http:", "https:"].includes(u.protocol)) throw new Error("bad")
      } catch {
        setError("Please enter a valid URL (e.g., https://example.com/recipe).")
        return
      }
    } else if (source.type === "photo") {
      if (!source.imageUrl) {
        setError("Please upload or capture a photo first.")
        return
      }
    }

    await runAnalysis()
  }

  // ── Select a method on mobile → jump to input step ─────────────────────
  const selectMethod = (type: SourceType) => {
    setSource({ type, rawText: "", imageUrl: undefined, barcode: undefined })
    setStep("input")
  }

  // ════════════════════════════════════════════════════════════════════════
  //  MOBILE VIEW (<lg) — Step-based wizard
  // ════════════════════════════════════════════════════════════════════════

  const renderMobile = () => {
    // ── Step: select ─────────────────────────────────────────────────────
    if (step === "select") {
      return (
        <div className="lg:hidden min-h-screen bg-[#F7F8F6] pb-[100px]">
          <div className="w-full max-w-[600px] mx-auto px-4">
            <header className="flex items-center gap-3 pt-6 pb-4">
              <button type="button" onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                aria-label="Go back">
                <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
              </button>
              <h1 className="text-[20px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}>
                Analyze Recipe
              </h1>
            </header>

            <p className="text-[14px] font-normal text-[#64748B] leading-5 mb-5"
              style={{ fontFamily: "Inter, sans-serif" }}>
              How would you like to analyze?
            </p>

            <div className="flex flex-col gap-3">
              <MethodCard icon={<Scan className="w-6 h-6" />} title="Scan Barcode"
                subtitle="Instant product logging" badge="Instant"
                onClick={() => router.push("/scan")} />
              <MethodCard icon={<CameraIcon className="w-6 h-6" />} title="Take Photo"
                subtitle="AI visual analysis" badge="AI"
                onClick={() => selectMethod("photo")} />
              <MethodCard icon={<FileText className="w-6 h-6" />} title="Paste Recipe Text"
                subtitle="Ingredient breakdown"
                onClick={() => selectMethod("paste")} />
              <MethodCard icon={<Link2 className="w-6 h-6" />} title="Paste Recipe URL"
                subtitle="Web import"
                onClick={() => selectMethod("link")} />
            </div>

            {recentScans.length > 0 && (
              <section className="mt-8">
                <h3 className="text-[14px] font-bold text-[#0F172A] mb-3 uppercase tracking-wider"
                  style={{ fontFamily: "Inter, sans-serif" }}>
                  Recent Scans
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentScans.map((scan) => (
                    <button key={scan.id} type="button"
                      onClick={() => router.push(`/scan/result?barcode=${encodeURIComponent(scan.barcode)}`)}
                      className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[13px] font-medium text-[#334155] hover:bg-[#F8FAFC] transition-colors"
                      style={{ fontFamily: "Inter, sans-serif" }}>
                      {scan.product?.name ?? scan.barcode}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )
    }

    // ── Step: input ──────────────────────────────────────────────────────
    if (step === "input") {
      return (
        <div className="lg:hidden min-h-[100dvh] bg-[#F7F8F6] pb-[120px]">
          <div className="w-full max-w-[600px] mx-auto px-4">
            <header className="flex items-center gap-3 pt-6 pb-4">
              <button type="button" onClick={() => setStep("select")}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                aria-label="Go back">
                <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
              </button>
              <h1 className="text-[20px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}>
                Analyze Recipe
              </h1>
            </header>

            {/* Paste Recipe Text */}
            {source.type === "paste" && (
              <>
                <label htmlFor="m-recipe-text"
                  className="block text-[14px] font-semibold text-[#0F172A] mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}>
                  Recipe Text
                </label>
                <textarea id="m-recipe-text" value={source.rawText || ""}
                  onChange={(e) => setSource({ ...source, rawText: e.target.value })}
                  placeholder="Paste your recipe, ingredient list, or blog post here..."
                  className="w-full min-h-[200px] rounded-2xl border-2 border-[#D4E8A8] bg-white p-4 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#99CC33] focus:ring-2 focus:ring-[#99CC33]/20 resize-none"
                  style={{ fontFamily: "Inter, sans-serif" }} />
                <div className="mt-4 bg-white border border-[#F1F5F9] rounded-2xl p-4 flex items-start gap-2.5">
                  <span className="text-[16px] mt-0.5">💡</span>
                  <p className="text-[13px] font-normal text-[#64748B] leading-5"
                    style={{ fontFamily: "Inter, sans-serif" }}>
                    Paste a whole blog post or just the ingredients list — our AI will extract the recipe information automatically.
                  </p>
                </div>
              </>
            )}

            {/* Paste Recipe URL */}
            {source.type === "link" && (
              <>
                <label htmlFor="m-recipe-url"
                  className="block text-[14px] font-semibold text-[#0F172A] mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}>
                  Recipe URL
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Link2 className="w-5 h-5 text-[#94A3B8]" />
                  </div>
                  <input id="m-recipe-url" type="url" value={source.rawText || ""}
                    onChange={(e) => setSource({ ...source, rawText: e.target.value })}
                    placeholder="https://example.com/recipe..."
                    className="w-full h-[52px] rounded-2xl border-2 border-[#D4E8A8] bg-white pl-12 pr-4 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#99CC33] focus:ring-2 focus:ring-[#99CC33]/20"
                    style={{ fontFamily: "Inter, sans-serif" }} autoComplete="off" autoFocus />
                </div>
                <div className="mt-4 bg-white border border-[#F1F5F9] rounded-2xl p-4 flex items-start gap-2.5">
                  <span className="text-[16px] mt-0.5">💡</span>
                  <p className="text-[13px] font-normal text-[#64748B] leading-5"
                    style={{ fontFamily: "Inter, sans-serif" }}>
                    Paste a recipe URL from any food blog, AllRecipes, BBC Good Food, or other recipe sites.
                  </p>
                </div>
              </>
            )}

            {/* Take Photo */}
            {source.type === "photo" && (
              <MobilePhotoInput source={source} setSource={setSource} />
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-red-800">{error}</p>
                  <button type="button" onClick={() => setError(null)}
                    className="text-[13px] text-red-600 hover:text-red-800 mt-1 font-medium">
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fixed bottom CTA */}
          <div className="fixed bottom-[72px] left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-[#F1F5F9] px-6 py-4 lg:bottom-0">
            <Button onClick={handleAnalyze}
              disabled={isAnalyzing || !(
                (source.type === "paste" && (source.rawText || "").trim()) ||
                (source.type === "link" && (source.rawText || "").trim()) ||
                (source.type === "photo" && source.imageUrl)
              )}
              className={`w-full h-[52px] rounded-2xl text-[16px] font-semibold transition-colors ${((source.type === "paste" && (source.rawText || "").trim()) ||
                  (source.type === "link" && (source.rawText || "").trim()) ||
                  (source.type === "photo" && source.imageUrl))
                  ? "bg-[#538100] hover:bg-[#466e00] text-white"
                  : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                }`}
              style={{ fontFamily: "Inter, sans-serif" }}>
              {isAnalyzing ? "Analyzing…" : "Analyze Recipe"}
            </Button>
          </div>
        </div>
      )
    }

    // ── Step: analyzing ──────────────────────────────────────────────────
    if (step === "analyzing") {
      return (
        <div className="lg:hidden min-h-[100dvh] bg-[#F7F8F6]">
          <div className="w-full max-w-[600px] mx-auto px-4">
            <header className="flex items-center gap-3 pt-6 pb-4">
              <button type="button" onClick={() => { handleClear() }}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                aria-label="Go back">
                <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
              </button>
              <h1 className="text-[20px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}>
                Analyzing…
              </h1>
            </header>

            <div className="flex flex-col items-center pt-10 gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#F1F5F9" strokeWidth="6" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#99CC33" strokeWidth="6"
                    strokeDasharray={`${(progress / 100) * 276.46} 276.46`}
                    strokeLinecap="round" transform="rotate(-90 50 50)"
                    className="transition-all duration-300" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="w-8 h-8 text-[#538100]" />
                </div>
              </div>

              <p className="text-[16px] font-semibold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}>
                {Math.round(progress)}% complete
              </p>

              <div className="w-full flex flex-col gap-3 mt-2">
                <MobileStatusCard label="Parsing Ingredients"
                  description="Extracting ingredients from your input"
                  status={ingredientStatus} />
                <MobileStatusCard label="Checking Allergens"
                  description="Cross-referencing family allergen profiles"
                  status={allergenStatus} />
                <MobileStatusCard label="Analyzing Nutrition"
                  description="Calculating nutritional breakdown"
                  status={progress >= 80 ? "done" : "loading"} />
              </div>
            </div>
          </div>
        </div>
      )
    }

    // ── Step: result ─────────────────────────────────────────────────────
    return (
      <div className="lg:hidden min-h-[100dvh] bg-[#F7F8F6] pb-[20px]">
        <div className="w-full max-w-[600px] mx-auto px-4">
          <header className="flex items-center justify-between pt-6 pb-2">
            <button type="button" onClick={handleClear}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
              aria-label="Go back">
              <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
            </button>
            <h1 className="text-[17px] font-semibold text-[#0F172A]"
              style={{ fontFamily: "Inter, sans-serif" }}>
              Analysis Result
            </h1>
            <div className="w-10" />
          </header>
          <AnalyzerResult variant="mobile" onBack={handleClear} />
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  //  DESKTOP VIEW (lg+)
  // ════════════════════════════════════════════════════════════════════════

  const renderDesktop = () => (
    <div className="hidden lg:block min-h-screen" style={{ background: "#F7F8F6", fontFamily: "Inter, sans-serif" }}>
      <div className="w-full max-w-[960px] mx-auto px-6">

        {/* Page header */}
        <div className="flex items-center justify-between pt-8 pb-2">
          <h1 className="text-[30px] font-bold text-[#0F172A] leading-[28px]">
            Analyze Recipe
          </h1>
          <div className="flex items-center gap-3">
            {showMemberSelector && (
              <MemberSelector value={memberId} onChange={setMemberId} />
            )}
            <button onClick={() => setShowMemberSelector(!showMemberSelector)}
              className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">
              {showMemberSelector ? "Hide" : "👤 Family Member"}
            </button>
          </div>
        </div>

        {/* Segmented toggle tabs */}
        <div className="py-3">
          <div className="flex items-center p-[7px] rounded-full"
            style={{ background: "#E2E8F0", border: "1px solid rgba(153,204,51,0.05)" }}>
            {([
              { key: "paste" as SourceType, label: "Paste Recipe Text" },
              { key: "link" as SourceType, label: "Paste Recipe URL" },
              { key: "barcode" as SourceType, label: "Scan Barcode" },
              { key: "photo" as SourceType, label: "Take Photo" },
            ]).map((tab) => (
              <button key={tab.key} type="button"
                onClick={() => {
                  if (source.type !== tab.key) {
                    setSource({ type: tab.key, rawText: "", imageUrl: undefined, barcode: undefined })
                    if (step === "result") handleClear()
                    else setStep("input")
                  }
                }}
                className={`flex-1 h-[34px] rounded-full text-[14px] font-semibold transition-all duration-200 ${source.type === tab.key
                    ? "bg-white text-[#538100] shadow-sm"
                    : "bg-transparent text-[#475569] hover:text-[#1E293B]"
                  }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        {step !== "result" && step !== "analyzing" && (
          <div className="flex flex-col gap-5 py-4">

            {source.type === "paste" && (
              <>
                <div>
                  <h2 className="text-[18px] font-bold text-[#161910] mb-4">Recipe Text</h2>
                  <textarea value={source.rawText || ""}
                    onChange={(e) => setSource({ ...source, rawText: e.target.value })}
                    placeholder="Paste recipe text or ingredients here..."
                    className="w-full min-h-[320px] rounded-3xl border border-[#DEE4D3] bg-white p-4 text-[16px] text-[#0F172A] placeholder:text-[#7C8E57] focus:outline-none focus:border-[#99CC33] focus:ring-2 focus:ring-[#99CC33]/20 resize-none" />
                </div>
                <div className="flex items-start gap-3 p-5 rounded-full"
                  style={{ background: "#F1F8E6", border: "1px solid rgba(153,204,51,0.2)" }}>
                  <div className="w-6 h-6 rounded-full bg-[#99CC33] flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1v10M4 7l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[14px] text-[#538100] leading-5">
                    Tip: You can paste a whole blog post or just a list of ingredients. Our AI will extract the nutritional data for you.
                  </p>
                </div>
              </>
            )}

            {source.type === "link" && (
              <div>
                <h2 className="text-[18px] font-bold text-[#161910] mb-4">Recipe URL</h2>
                <input type="url" value={source.rawText || ""}
                  onChange={(e) => setSource({ ...source, rawText: e.target.value })}
                  placeholder="https://example.com/your-recipe"
                  className="w-full h-[56px] rounded-3xl border border-[#DEE4D3] bg-white px-5 text-[16px] text-[#0F172A] placeholder:text-[#7C8E57] focus:outline-none focus:border-[#99CC33] focus:ring-2 focus:ring-[#99CC33]/20" />
                <p className="text-[14px] text-[#64748B] mt-3 leading-5">
                  Paste any recipe URL and we&apos;ll scrape the ingredients, steps, and nutrition info automatically.
                </p>
              </div>
            )}

            {source.type === "barcode" && (
              <div>
                <ManualCodeEntry onSubmit={(code) => {
                  setSource({ ...source, barcode: code })
                  setError(null)
                  apiAnalyzeBarcode(code, memberId)
                    .then((analyzed) => { setResult(analyzed); setStep("result") })
                    .catch((err) => {
                      const message = err instanceof Error ? err.message : "Unknown error"
                      setError(message)
                    })
                }} />
                <p className="text-[14px] text-[#64748B] mt-3 leading-5">
                  Enter a product barcode to look up its nutritional information and get analysis.
                </p>
              </div>
            )}

            {source.type === "photo" && (
              <div>
                <h2 className="text-[18px] font-bold text-[#161910] mb-4">Upload Photo</h2>
                <label htmlFor="desktop-photo-upload"
                  className="flex flex-col items-center justify-center w-full min-h-[240px] rounded-3xl border-2 border-dashed border-[#DEE4D3] bg-white cursor-pointer hover:border-[#99CC33] hover:bg-[#FAFDF5] transition-colors">
                  <CameraIcon className="w-10 h-10 text-[#94A3B8] mb-3" />
                  <span className="text-[16px] font-semibold text-[#0F172A]">Click to upload a photo</span>
                  <span className="text-[14px] text-[#64748B] mt-1">JPEG, PNG, or WebP — max 10 MB</span>
                  <input id="desktop-photo-upload" type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setSource({ ...source, imageUrl: URL.createObjectURL(file) })
                    }} />
                </label>
                {source.imageUrl && (
                  <div className="mt-4 rounded-3xl overflow-hidden border border-[#DEE4D3]">
                    <img src={source.imageUrl} alt="Uploaded" className="w-full max-h-[300px] object-cover" />
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-red-800">{error}</p>
                  <button type="button" onClick={() => setError(null)}
                    className="text-[13px] text-red-600 hover:text-red-800 mt-1 font-medium">
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Analyze button */}
            {source.type !== "barcode" && (
              <div className="pt-6 pb-4 w-[276px]">
                <button type="button" onClick={handleAnalyze}
                  disabled={isAnalyzing || !(
                    (source.type === "paste" && (source.rawText || "").trim()) ||
                    (source.type === "link" && (source.rawText || "").trim()) ||
                    (source.type === "photo" && source.imageUrl)
                  )}
                  className="w-full h-[56px] rounded-full text-[16px] font-bold tracking-[0.24px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "#99CC33", color: "#161910",
                    boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)",
                  }}>
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.42" strokeDashoffset="10" strokeLinecap="round" />
                      </svg>
                      Analyzing…
                    </span>
                  ) : "Analyze Recipe"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading state (desktop) */}
        {step === "analyzing" && (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#99CC33]/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#538100] animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.42" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[16px] font-semibold text-[#0F172A]">Analyzing your recipe...</p>
            <p className="text-[14px] text-[#64748B]">This may take a moment</p>
          </div>
        )}

        {/* Results (desktop) */}
        {step === "result" && result && <AnalyzerResult variant="desktop" />}

      </div>
    </div>
  )

  return (
    <>
      {renderMobile()}
      {renderDesktop()}
    </>
  )
}

// ── Mobile sub-components ──────────────────────────────────────────────────

function MobilePhotoInput({ source, setSource }: {
  source: { type: string; rawText?: string; imageUrl?: string; barcode?: string };
  setSource: (s: { type: SourceType; rawText?: string; imageUrl?: string; barcode?: string }) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSource({ ...source, type: "photo" as SourceType, imageUrl: reader.result as string })
    reader.readAsDataURL(file)
  }

  if (source.imageUrl) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-[#D4E8A8]">
        <img src={source.imageUrl} alt="Captured" className="w-full max-h-[400px] object-contain bg-black" />
        <button type="button"
          onClick={() => { setSource({ ...source, type: "photo" as SourceType, imageUrl: undefined }); if (fileInputRef.current) fileInputRef.current.value = "" }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
          aria-label="Remove photo">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 mt-2">
      <label className="flex flex-col items-center justify-center w-full h-[200px] rounded-2xl bg-white border-2 border-dashed border-[#D4E8A8] cursor-pointer hover:border-[#99CC33] transition-colors">
        <Camera className="w-8 h-8 text-[#94A3B8] mb-2" />
        <span className="text-[14px] font-semibold text-[#0F172A]">Take a Photo</span>
        <span className="text-[12px] text-[#94A3B8] mt-1">Opens your camera</span>
        <input type="file" accept="image/*" capture="environment" className="hidden"
          onChange={handleFileChange} ref={fileInputRef} />
      </label>
      <label className="flex flex-col items-center justify-center w-full h-[120px] rounded-2xl bg-white border-2 border-dashed border-[#D4E8A8] cursor-pointer hover:border-[#99CC33] transition-colors">
        <ImagePlus className="w-7 h-7 text-[#94A3B8] mb-1.5" />
        <span className="text-[14px] font-semibold text-[#0F172A]">Choose from Gallery</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </label>
    </div>
  )
}

function MobileStatusCard({ label, description, status }: {
  label: string; description: string; status: "loading" | "done";
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-[#F1F5F9]"
      style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.04)" }}>
      {status === "done" ? (
        <div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0">
          <Loader2 className="w-4 h-4 text-[#94A3B8] animate-spin" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#0F172A] leading-5">{label}</p>
        <p className="text-[12px] text-[#64748B] leading-4">{description}</p>
      </div>
    </div>
  )
}

// ── Page wrapper ───────────────────────────────────────────────────────────

export default function RecipeAnalyzerPage() {
  return (
    <AnalyzerProvider>
      <RecipeAnalyzerInner />
    </AnalyzerProvider>
  )
}
