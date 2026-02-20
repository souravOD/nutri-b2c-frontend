"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SourceData } from "@/app/recipe-analyzer/page"

export function LinkSource({ source, onChange }: { source: SourceData; onChange: (s: SourceData) => void }) {
  return (
    <div className="space-y-2">
      <Label>Recipe URL</Label>
      <Input placeholder="https://example.com/your-recipe" value={source.rawText || ""} onChange={(e) => onChange({ ...source, rawText: e.target.value })} />
      <p className="text-xs text-muted-foreground">Paste a recipe URL to extract and analyze the recipe.</p>
    </div>
  )
}
