"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"
import { CameraPermissionGate } from "@/components/scan/camera-permission-gate"
import { LivePreview } from "@/components/scan/live-preview"
import { ScanResultSheet } from "@/components/scan/scan-result-sheet"
import { ImageUploadScan } from "@/components/scan/image-upload-scan"
import { ManualCodeEntry } from "@/components/scan/manual-code-entry"
import { ScannerOverlay } from "@/components/scan/scanner-overlay"
import { ScanErrorSheet } from "@/components/scan/scan-error-sheet"
import { History, Camera, Loader2, ArrowLeft, Zap, Upload, Keyboard } from "lucide-react"
import type { BarcodeResult } from "@/lib/barcode"
import {
  apiScanLookup,
  apiSaveScanHistory,
  apiGetScanHistory,
  type ScanLookupResult,
  type ScanHistoryItem,
} from "@/lib/scan-api"

export default function ScanPage() {
  const router = useRouter()
  const scanner = useBarcodeScanner()
  const { getHistory } = scanner
  const [showResult, setShowResult] = useState(false)
  const [scanResult, setScanResult] = useState<ScanLookupResult | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [showError, setShowError] = useState(false)
  const [torch, setTorch] = useState(false)

  // Load scan history from API on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const { items } = await apiGetScanHistory(10);
        setScanHistory(items);
      } catch (err) {
        console.error("Failed to load scan history:", err);
        setScanHistory(
          getHistory().map((h: { ts?: string; value: string; format?: string }) => ({
            id: h.ts?.toString() ?? Date.now().toString(),
            barcode: h.value,
            barcodeFormat: h.format,
            scanSource: "camera",
            scannedAt: h.ts ? new Date(h.ts).toISOString() : new Date().toISOString(),
            product: null,
          }))
        );
      }
    }
    loadHistory();
  }, [getHistory])

  const handleDetected = useCallback(async (result: BarcodeResult) => {
    scanner.setResult(result)
    scanner.saveToHistory(result)
    setIsLookingUp(true)
    setShowError(false)

    try {
      const lookupResult = await apiScanLookup(result.value)
      setScanResult(lookupResult)

      if (lookupResult.source === "not_found") {
        setShowError(true)
      } else {
        // Mobile: navigate to result page with barcode
        router.push(`/scan/result?barcode=${encodeURIComponent(result.value)}`)
      }

      // Save to scan history via API
      try {
        await apiSaveScanHistory({
          barcode: result.value,
          productId: lookupResult.product?.id,
          barcodeFormat: result.format,
          scanSource: "camera",
        })
        const { items } = await apiGetScanHistory(10)
        setScanHistory(items)
      } catch (historyErr) {
        console.error("Failed to save scan history:", historyErr)
      }
    } catch (err) {
      console.error("Product lookup failed:", err)
      setScanResult({
        product: null,
        allergenWarnings: [],
        healthWarnings: [],
        source: "not_found",
      })
      setShowError(true)
    } finally {
      setIsLookingUp(false)
    }

    if (navigator.vibrate) {
      navigator.vibrate(200)
    }
  }, [scanner, router])

  const handleScanAgain = () => {
    setShowResult(false)
    setShowError(false)
    setScanResult(null)
    scanner.setResult(null)
  }

  const handleManualEntry = async (code: string) => {
    const result: BarcodeResult = {
      format: "Manual",
      value: code,
    }
    await handleDetected(result)
  }

  const handleImageScan = async (result: BarcodeResult) => {
    await handleDetected(result)
  }

  // Camera Permission Gate (both mobile + desktop)
  if (scanner.permission === "prompt" && !useFallback) {
    return (
      <CameraPermissionGate
        onPermissionGranted={() => scanner.requestPermission()}
        onFallback={() => setUseFallback(true)}
      />
    )
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE VIEW (<lg) — Full-screen camera
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden relative min-h-[100dvh] bg-black overflow-hidden">
        {/* Camera preview full-screen */}
        {scanner.permission === "granted" && !useFallback ? (
          <>
            {/* Live camera feed */}
            <div className="absolute inset-0">
              <LivePreview
                onDetected={handleDetected}
                onError={(error) => console.error("Scan error:", error)}
              />
            </div>

            {/* Scanner overlay: dark mask + corners + scan line */}
            <ScannerOverlay />

            {/* Top header */}
            <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-6 pb-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1
                className="text-[17px] font-semibold text-white"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Scan Product
              </h1>
              <button
                type="button"
                onClick={() => {
                  setTorch(!torch)
                  scanner.toggleTorch(!torch)
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${torch ? "bg-[#99CC33]" : "bg-black/40 backdrop-blur-sm"
                  }`}
                aria-label="Toggle flashlight"
                disabled={!scanner.torchAvailable}
              >
                <Zap className="w-5 h-5 text-white" />
              </button>
            </header>

            {/* Instruction text */}
            <div className="absolute z-20" style={{ top: "62%", left: 0, right: 0 }}>
              <p
                className="text-center text-[15px] font-semibold text-white px-8"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Position the barcode within the frame
              </p>
              <p
                className="text-center text-[13px] font-normal text-white/60 px-8 mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Scanning will start automatically
              </p>
            </div>

            {/* Tip card */}
            <div className="absolute z-20 px-6" style={{ top: "68%", left: 0, right: 0 }}>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl py-3 px-4 flex items-start gap-2.5">
                <span className="text-[16px] mt-0.5">💡</span>
                <p
                  className="text-[13px] font-normal text-white/90 leading-5"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Hold your phone steady and make sure the barcode is well-lit for best results
                </p>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 px-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUseFallback(true)}
                  className="flex-1 h-[48px] bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center gap-2 text-white"
                >
                  <Upload className="w-4 h-4" />
                  <span
                    className="text-[14px] font-semibold"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Upload Image
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseFallback(true)}
                  className="flex-1 h-[48px] bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center gap-2 text-white"
                >
                  <Keyboard className="w-4 h-4" />
                  <span
                    className="text-[14px] font-semibold"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Enter Manually
                  </span>
                </button>
              </div>
            </div>

            {/* Loading overlay */}
            {isLookingUp && (
              <div className="absolute inset-0 z-25 bg-black/60 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#99CC33]" />
                <p
                  className="text-white text-[15px] font-medium mt-4"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Looking up product...
                </p>
              </div>
            )}

            {/* Error sheet */}
            <ScanErrorSheet
              open={showError}
              onRetry={handleScanAgain}
              onManualEntry={() => {
                setShowError(false)
                setUseFallback(true)
              }}
            />
          </>
        ) : (
          /* Fallback: image upload + manual entry on mobile */
          <div className="min-h-[100dvh] bg-[#F7F8F6] p-4 space-y-4">
            <header className="flex items-center gap-3 pt-2 pb-4">
              <button
                type="button"
                onClick={() => {
                  setUseFallback(false)
                  if (scanner.permission === "prompt") scanner.requestPermission()
                }}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                aria-label="Back to camera"
              >
                <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
              </button>
              <h1
                className="text-[18px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Manual Entry
              </h1>
            </header>
            <ImageUploadScan onDetected={handleImageScan} />
            <ManualCodeEntry onSubmit={handleManualEntry} />

            {/* Recent Scans on mobile */}
            {scanHistory.length > 0 && (
              <section
                className="bg-white rounded-[20px] border border-[#F1F5F9] overflow-hidden"
                style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F1F5F9]">
                  <History className="w-4 h-4 text-[#538100]" />
                  <h3
                    className="text-[14px] font-bold text-[#0F172A]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Recent Scans
                  </h3>
                </div>
                <div className="divide-y divide-[#F1F5F9]">
                  {scanHistory.slice(0, 5).map((scan) => (
                    <button
                      type="button"
                      key={scan.id}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F7F8F6] active:bg-[#F1F5F9] transition-colors text-left"
                      onClick={() => handleManualEntry(scan.barcode)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-medium text-[#538100] bg-[#99CC33]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {scan.barcodeFormat || "Barcode"}
                        </span>
                        <span className="text-[13px] font-medium text-[#0F172A] truncate">
                          {scan.product ? scan.product.name : scan.barcode}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#94A3B8] whitespace-nowrap ml-2">
                        {new Date(scan.scannedAt).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DESKTOP VIEW (lg+) — Figma themed scanner layout
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:block px-6 py-8 max-w-[800px] mx-auto space-y-6"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-[24px] font-bold text-[#0F172A]">Barcode Scanner</h1>
          <p className="text-[14px] text-[#94A3B8] mt-1">Scan product barcodes to view nutrition information</p>
        </div>

        {/* Loading */}
        {isLookingUp && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#538100]" />
            <span className="ml-3 text-[15px] text-[#64748B]">Looking up product...</span>
          </div>
        )}

        {/* Camera scanner */}
        {scanner.permission === "granted" && !showResult && !isLookingUp && !useFallback ? (
          <div className="space-y-4">
            <div
              className="rounded-[20px] overflow-hidden border border-[#E2E8F0]"
              style={{ boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.06)" }}
            >
              <LivePreview
                onDetected={handleDetected}
                onError={(error) => console.error("Scan error:", error)}
              />
            </div>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => scanner.toggleTorch(true)}
                disabled={!scanner.torchAvailable}
                className="h-[42px] px-5 rounded-2xl border border-[#E2E8F0] bg-white hover:bg-[#F7F8F6] text-[#0F172A] text-[14px] font-medium flex items-center gap-2 transition-colors disabled:opacity-40"
              >
                <Zap className="w-4 h-4 text-[#538100]" />
                Torch
              </button>
              <button
                type="button"
                onClick={() => setUseFallback(true)}
                className="h-[42px] px-5 rounded-2xl border border-[#E2E8F0] bg-white hover:bg-[#F7F8F6] text-[#0F172A] text-[14px] font-medium flex items-center gap-2 transition-colors"
              >
                <Keyboard className="w-4 h-4 text-[#538100]" />
                Manual Options
              </button>
            </div>
          </div>
        ) : null}

        {/* Fallback: Image upload + Manual entry */}
        {!isLookingUp && (useFallback || scanner.permission === "denied") ? (
          <div className="space-y-4">
            {scanner.permission !== "denied" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUseFallback(false)
                    if (scanner.permission === "prompt") {
                      scanner.requestPermission()
                    }
                  }}
                  className="text-[14px] font-medium text-[#538100] hover:text-[#466e00] flex items-center gap-1.5 mx-auto transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Switch to Camera
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploadScan onDetected={handleImageScan} />
              <ManualCodeEntry onSubmit={handleManualEntry} />
            </div>
          </div>
        ) : null}

        {/* Recent Scans */}
        {scanHistory.length > 0 && (
          <section
            className="bg-white rounded-[24px] border border-[#F1F5F9] overflow-hidden"
            style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F1F5F9]">
              <History className="w-5 h-5 text-[#538100]" />
              <h3 className="text-[15px] font-bold text-[#0F172A]">Recent Scans</h3>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {scanHistory.slice(0, 5).map((scan) => (
                <button
                  type="button"
                  key={scan.id}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F7F8F6] transition-colors text-left"
                  onClick={() => handleManualEntry(scan.barcode)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-[#538100] bg-[#99CC33]/10 px-2 py-0.5 rounded-full">
                      {scan.barcodeFormat || "Barcode"}
                    </span>
                    <span className="text-[14px] font-medium text-[#0F172A]">
                      {scan.product ? scan.product.name : scan.barcode}
                    </span>
                  </div>
                  <span className="text-[12px] text-[#94A3B8]">
                    {new Date(scan.scannedAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {scanResult && (
          <ScanResultSheet
            open={showResult}
            onOpenChange={setShowResult}
            result={{
              format: scanner.lastResult?.format || "",
              value: scanner.lastResult?.value || "",
              product: scanResult.product
                ? {
                  id: scanResult.product.id,
                  title: scanResult.product.name,
                  brand: scanResult.product.brand ?? undefined,
                  imageUrl: scanResult.product.imageUrl ?? undefined,
                  allergens: scanResult.product.allergens ?? undefined,
                  nutrition: {
                    calories: scanResult.product.nutrition.calories ?? undefined,
                    protein_g: scanResult.product.nutrition.protein_g ?? undefined,
                    carbs_g: scanResult.product.nutrition.carbs_g ?? undefined,
                    fat_g: scanResult.product.nutrition.fat_g ?? undefined,
                    fiber_g: scanResult.product.nutrition.fiber_g ?? undefined,
                    sugar_g: scanResult.product.nutrition.sugar_g ?? undefined,
                    sodium_mg: scanResult.product.nutrition.sodium_mg ?? undefined,
                    saturatedFat: scanResult.product.nutrition.saturatedFat ?? undefined,
                  },
                }
                : null,
            }}
            allergenWarnings={scanResult.allergenWarnings}
            healthWarnings={scanResult.healthWarnings}
            onScanAgain={handleScanAgain}
          />
        )}
      </div>
    </>
  )
}
