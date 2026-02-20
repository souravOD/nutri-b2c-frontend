"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap } from "lucide-react"

import { PasteSource } from "@/components/analyzer/paste-source"
import { LinkSource } from "@/components/analyzer/link-source"
import { PhotoSource } from "@/components/analyzer/photo-source"
import { BarcodeSource } from "@/components/analyzer/barcode-source"
import { LiveSource } from "@/components/analyzer/live-source"

import type { SourceData, SourceType } from "@/app/recipe-analyzer/page"

interface Props {
  source: SourceData
  onChange: (source: SourceData) => void
  onAnalyze: () => void
  isAnalyzing: boolean
}

export function SourceForm({ source, onChange, onAnalyze, isAnalyzing }: Props) {
  const canAnalyze =
    (source.type === "paste" && (source.rawText || "").trim().length > 0) ||
    (source.type === "link" && (source.rawText || "").trim().length > 0) ||
    (source.type === "photo" && ((source.rawText || "").trim().length > 0 || (source.imageUrl || "").length > 0)) ||
    (source.type === "barcode" && ((source.rawText || "").trim().length > 0 || (source.barcode || "").length > 0)) ||
    (source.type === "live" && (source.rawText || "").trim().length > 0)

  const setType = (t: SourceType) => {
    // Clear input fields when switching source types (unless switching to same type)
    if (source.type !== t) {
      onChange({ 
        type: t, 
        rawText: "", // Clear text when switching tabs
        imageUrl: undefined,
        barcode: undefined
      })
    }
  }

  return (
    <Card className="h-full rounded-none lg:rounded-l-lg">
      <CardHeader className="pb-2">
        <CardTitle>Recipe Source</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-3rem)] flex flex-col">
        <Tabs value={source.type} onValueChange={(v) => setType(v as SourceType)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="paste">Paste</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="photo">Photo</TabsTrigger>
            <TabsTrigger value="barcode">Barcode</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-4">
            <TabsContent value="paste" className="h-full"><PasteSource source={source} onChange={onChange}/></TabsContent>
            <TabsContent value="link" className="h-full"><LinkSource source={source} onChange={onChange}/></TabsContent>
            <TabsContent value="photo" className="h-full"><PhotoSource source={source} onChange={onChange} onAnalyze={onAnalyze}/></TabsContent>
            <TabsContent value="barcode" className="h-full"><BarcodeSource source={source} onChange={onChange} onAnalyze={onAnalyze}/></TabsContent>
            <TabsContent value="live" className="h-full"><LiveSource source={source} onChange={onChange}/></TabsContent>
          </div>
        </Tabs>

        <div className="mt-4 flex justify-end">
          <Button onClick={onAnalyze} disabled={isAnalyzing || !canAnalyze}>
            {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</> : <><Zap className="mr-2 h-4 w-4" />Analyze Recipe</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
