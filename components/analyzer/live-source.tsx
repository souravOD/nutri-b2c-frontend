"use client"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { LivePreview } from "@/components/scan/live-preview"
import type { SourceData } from "@/components/analyzer/analyzer-context"
import type { BarcodeResult } from "@/lib/barcode"

export function LiveSource({ source, onChange }: { source: SourceData; onChange: (s: SourceData) => void }) {
  const [error, setError] = useState<string | null>(null)

  const onDetected = (res: BarcodeResult) => onChange({ ...source, barcode: res.value })
  const onError = (err: Error) => setError(err.message)

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>Use your camera to scan barcodes or text, then complete the recipe text below.</AlertDescription>
      </Alert>

      <LivePreview onDetected={onDetected} onError={onError} />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="space-y-2">
        <Label>Captured/typed text</Label>
        <Textarea rows={6} placeholder="Type the recognized text here…" value={source.rawText || ""} onChange={(e) => onChange({ ...source, rawText: e.target.value })} />
      </div>
    </div>
  )
}
