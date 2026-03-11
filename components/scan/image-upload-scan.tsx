"use client"

import { useRef, useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import type { BarcodeResult } from "@/lib/barcode"

type BarcodeDetectorResult = { format: string; rawValue: string }
type BarcodeDetectorInstance = {
  detect: (image: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>
}
type BarcodeDetectorConstructor = new (options: {
  formats: string[]
}) => BarcodeDetectorInstance

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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to scan image"
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const scanImageFile = async (file: File): Promise<BarcodeResult | null> => {
    // 1. Try native BarcodeDetector (Chrome/Edge on desktop, most Android browsers)
    const BarcodeDetectorCtor =
      typeof window !== "undefined"
        ? (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
        : undefined
    if (BarcodeDetectorCtor) {
      try {
        const det = new BarcodeDetectorCtor({
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
          (res) => {
            URL.revokeObjectURL(url)
            const code = res?.codeResult?.code
            if (typeof code === "string" && code.length > 0) {
              const format = typeof res.codeResult?.format === "string" ? res.codeResult.format : "quagga"
              resolve({ format, value: code })
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
    <section
      className="bg-white rounded-[20px] border border-[#F1F5F9] overflow-hidden"
      style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)", fontFamily: "Inter, sans-serif" }}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F1F5F9]">
        <Upload className="w-4 h-4 text-[#538100]" />
        <h3 className="text-[15px] font-bold text-[#0F172A]">Scan from Image</h3>
      </div>
      <div className="px-5 py-4 space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <button
          type="button"
          className="w-full h-[48px] bg-[#538100] hover:bg-[#466e00] text-white rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload photo
            </>
          )}
        </button>
        {error && <p className="text-[12px] text-[#EF4444]">{error}</p>}
        <p className="text-[12px] text-[#94A3B8]">
          Upload a clear photo of the barcode for best results
        </p>
      </div>
    </section>
  )
}
