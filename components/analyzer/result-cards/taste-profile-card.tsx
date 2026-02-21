"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Palette } from "lucide-react"
import type { AnalyzeResult } from "@/lib/types"
import type { AnalyzerCardResult } from "@/components/analyzer/result-cards/types"

interface TasteProfileCardProps {
  result: AnalyzerCardResult
  onEdit?: (r: AnalyzeResult) => void
}

export function TasteProfileCard({ result, onEdit }: TasteProfileCardProps) {
  const tastes: string[] = result.tasteList || []
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" /> Taste Profile
        </CardTitle>
        {onEdit && <Button variant="ghost" size="sm" onClick={()=>onEdit(result)}><Edit className="h-4 w-4"/></Button>}
      </CardHeader>
      <CardContent>
        {tastes.length ? (
          <div className="flex flex-wrap gap-2">{tastes.map((t)=> <Badge key={t} variant="outline">{t}</Badge>)}</div>
        ) : (
          <p className="text-sm text-muted-foreground">No distinctive taste tags detected.</p>
        )}
      </CardContent>
    </Card>
  )
}
