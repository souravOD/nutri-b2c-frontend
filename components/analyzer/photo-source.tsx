"use client"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import type { SourceData } from "@/app/recipe-analyzer/page"

interface PhotoSourceProps {
  source: SourceData
  onChange: (s: SourceData) => void
  onAnalyze?: () => void
}

export function PhotoSource({ source, onChange, onAnalyze }: PhotoSourceProps) {
  const [preview, setPreview] = useState<string>(source.imageUrl || "")
  const pendingAnalyze = useRef(false)

  useEffect(() => {
    const nextPreview = source.imageUrl || ""
    setPreview((prev) => (prev === nextPreview ? prev : nextPreview))
  }, [source.imageUrl])

  // Auto-trigger analysis once the imageUrl is set in source state
  useEffect(() => {
    if (pendingAnalyze.current && source.imageUrl) {
      pendingAnalyze.current = false
      onAnalyze?.()
    }
  }, [source.imageUrl, onAnalyze])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || "")
      setPreview(url)
      pendingAnalyze.current = true
      onChange({ ...source, imageUrl: url })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Upload photo (menu/page)</Label>
        <div className="flex items-center gap-2">
          <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {preview && <Button type="button" variant="outline" onClick={() => { setPreview(""); onChange({ ...source, imageUrl: "" }) }}><X className="h-4 w-4 mr-2" />Remove</Button>}
        </div>
        {preview ? <img src={preview} alt="preview" className="mt-3 h-48 w-full object-cover rounded-md border" /> :
          <div className="h-48 grid place-items-center border rounded-md text-sm text-muted-foreground"><Upload className="mr-2 h-4 w-4" /><span>Drop an image</span></div>}
      </div>

      <div className="space-y-2">
        <Label>Transcribed text (optional)</Label>
        <Textarea rows={8} placeholder="Type or paste recognized text…" value={source.rawText || ""} onChange={(e) => onChange({ ...source, rawText: e.target.value })} />
      </div>
    </div>
  )
}
