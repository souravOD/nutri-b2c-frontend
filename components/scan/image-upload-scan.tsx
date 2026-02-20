"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Loader2 } from "lucide-react"
import type { BarcodeResult } from "@/lib/barcode"

export function ImageUploadScan({ onDetected }: { onDetected: (r: BarcodeResult) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File) => {
    setError(null)
    setIsProcessing(true)
    try {
      const result = await scanImageFile(file)
      if (!result) throw new Error("No barcode found in this image")
      onDetected(result)
    } catch (e: any) {
      setError(e?.message || "Failed to scan image")
    } finally {
      setIsProcessing(false)
    }
  }

  const scanImageFile = async (file: File): Promise<BarcodeResult | null> => {
    // 1. Try native BarcodeDetector (Chrome/Edge on desktop, most Android browsers)
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        // @ts-ignore
        const det = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
        })
        const bitmap = await createImageBitmap(file)
        const results = await det.detect(bitmap)
        if (results?.[0]) {
          return { format: results[0].format, value: results[0].rawValue }
        }
      } catch {
        // Not supported or failed — fall through
      }
    }

    // 2. Try @zxing/browser (supported in all modern browsers)
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser")
      const url = URL.createObjectURL(file)
      try {
        const reader = new BrowserMultiFormatReader()
        const result = await reader.decodeFromImageUrl(url)
        if (result) {
          return {
            format: result.getBarcodeFormat().toString(),
            value: result.getText(),
          }
        }
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch {
      // ZXing failed — fall through
    }

    // 3. Try @ericblade/quagga2 (fallback for broader format support)
    try {
      const { default: Quagga } = await import("@ericblade/quagga2")
      const url = URL.createObjectURL(file)
      const result = await new Promise<BarcodeResult | null>((resolve) => {
        Quagga.decodeSingle(
          {
            src: url,
            numOfWorkers: 0, // Must be 0 for browser (no web workers in this context)
            inputStream: { size: 1024 },
            decoder: {
              readers: [
                "ean_reader",
                "ean_8_reader",
                "upc_reader",
                "upc_e_reader",
                "code_128_reader",
                "code_39_reader",
              ],
            },
          },
          (res: any) => {
            URL.revokeObjectURL(url)
            if (res?.codeResult?.code) {
              resolve({ format: res.codeResult.format || "quagga", value: res.codeResult.code })
            } else {
              resolve(null)
            }
          }
        )
      })
      if (result) return result
    } catch {
      // Quagga failed
    }

    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="w-4 h-4" /> Scan from Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <Button
            type="button"
            className="w-full"
            onClick={() => inputRef.current?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload photo
              </>
            )}
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Upload a clear photo of the barcode for best results
        </p>
      </CardContent>
    </Card>
  )
}
