"use client"

import { useState, useEffect, useCallback } from "react"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"
import { CameraPermissionGate } from "@/components/scan/camera-permission-gate"
import { LivePreview } from "@/components/scan/live-preview"
import { ScanResultSheet } from "@/components/scan/scan-result-sheet"
import { ImageUploadScan } from "@/components/scan/image-upload-scan"
import { ManualCodeEntry } from "@/components/scan/manual-code-entry"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Camera, Loader2 } from "lucide-react"
import type { BarcodeResult } from "@/lib/barcode"
import {
  apiScanLookup,
  apiSaveScanHistory,
  apiGetScanHistory,
  type ScanLookupResult,
  type ScanHistoryItem,
} from "@/lib/scan-api"

export default function ScanPage() {
  const scanner = useBarcodeScanner()
  const [showResult, setShowResult] = useState(false)
  const [scanResult, setScanResult] = useState<ScanLookupResult | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [useFallback, setUseFallback] = useState(false)

  // Load scan history from API on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const { items } = await apiGetScanHistory(10);
        setScanHistory(items);
      } catch (err) {
        console.error("Failed to load scan history:", err);
        // Fallback to localStorage history
        setScanHistory(
          scanner.getHistory().map((h: { ts?: string; value: string; format?: string }) => ({
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
  }, [])

  const handleDetected = useCallback(async (result: BarcodeResult) => {
    scanner.setResult(result)
    scanner.saveToHistory(result)
    setIsLookingUp(true)

    try {
      const lookupResult = await apiScanLookup(result.value)
      setScanResult(lookupResult)
      setShowResult(true)

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
      setShowResult(true)
    } finally {
      setIsLookingUp(false)
    }

    if (navigator.vibrate) {
      navigator.vibrate(200)
    }
  }, [scanner])

  const handleScanAgain = () => {
    setShowResult(false)
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

  // ── Camera Permission Gate ──────────────────────────────────────────────
  // Show ONLY when camera hasn't been granted yet AND user hasn't chosen fallback
  if (scanner.permission === "prompt" && !useFallback) {
    return (
      <CameraPermissionGate
        onPermissionGranted={() => scanner.requestPermission()}
        onFallback={() => setUseFallback(true)}
      />
    )
  }

  // ── Main UI ─────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Barcode Scanner</h1>
        <p className="text-muted-foreground">Scan product barcodes to view nutrition information</p>
      </div>

      {isLookingUp && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Looking up product...</span>
        </div>
      )}

      {/* Camera live preview — only when camera is granted */}
      {scanner.permission === "granted" && !showResult && !isLookingUp && !useFallback ? (
        <div className="space-y-4">
          <LivePreview
            onDetected={handleDetected}
            onError={(error) => console.error("Scan error:", error)}
          />

          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scanner.toggleTorch(true)}
              disabled={!scanner.torchAvailable}
            >
              <Camera className="w-4 h-4 mr-2" />
              Torch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseFallback(true)}
            >
              Manual Options
            </Button>
          </div>
        </div>
      ) : null}

      {/* Always show fallback options when: camera denied, fallback chosen, or no camera */}
      {!isLookingUp && (useFallback || scanner.permission === "denied") ? (
        <div className="space-y-4">
          {scanner.permission !== "denied" && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseFallback(false)
                  if (scanner.permission === "prompt") {
                    scanner.requestPermission()
                  }
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Switch to Camera
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploadScan onDetected={handleImageScan} />
            <ManualCodeEntry onSubmit={handleManualEntry} />
          </div>
        </div>
      ) : null}

      {/* Scan history */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.slice(0, 5).map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleManualEntry(scan.barcode)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {scan.barcodeFormat || "Barcode"}
                    </Badge>
                    <div>
                      {scan.product ? (
                        <span className="text-sm font-medium">{scan.product.name}</span>
                      ) : (
                        <span className="font-mono text-sm">{scan.barcode}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(scan.scannedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
  )
}
