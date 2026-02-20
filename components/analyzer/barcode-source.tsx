"use client"
import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { ImageUploadScan } from "@/components/scan/image-upload-scan"
import { ManualCodeEntry } from "@/components/scan/manual-code-entry"
import type { SourceData } from "@/app/recipe-analyzer/page"
import type { BarcodeResult } from "@/lib/barcode"

interface BarcodeSourceProps {
  source: SourceData
  onChange: (s: SourceData) => void
  onAnalyze?: () => void
}

export function BarcodeSource({ source, onChange, onAnalyze }: BarcodeSourceProps) {
  const [lastScan, setLastScan] = useState<BarcodeResult | null>(null)
  const pendingAnalyze = useRef(false)

  // Auto-trigger analysis once barcode is set in source state
  useEffect(() => {
    if (pendingAnalyze.current && source.barcode) {
      pendingAnalyze.current = false
      onAnalyze?.()
    }
  }, [source.barcode, onAnalyze])

  const onDetected = (res: BarcodeResult) => {
    setLastScan(res)
    pendingAnalyze.current = true
    onChange({ ...source, barcode: res.value, rawText: source.rawText || "" })
  }

  const onManualSubmit = (code: string) => {
    pendingAnalyze.current = true
    onChange({ ...source, barcode: code, rawText: source.rawText || "" })
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>Upload a photo with a barcode, or enter the code manually.</AlertDescription>
      </Alert>

      <ImageUploadScan onDetected={onDetected} />
      <ManualCodeEntry onSubmit={onManualSubmit} />

      <div className="space-y-2">
        <Label>Notes or ingredients (optional)</Label>
        <Textarea rows={6} placeholder="Add ingredients if the product is a component in a recipe…" value={source.rawText || ""} onChange={(e) => onChange({ ...source, rawText: e.target.value })} />
      </div>

      {lastScan && <p className="text-xs text-muted-foreground">Last scan: {lastScan.format} → {lastScan.value}</p>}
    </div>
  )
}
