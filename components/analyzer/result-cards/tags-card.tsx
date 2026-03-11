"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Tag } from "lucide-react"
import type { AnalyzeResult } from "@/lib/types"
import type { AnalyzerCardResult } from "@/components/analyzer/result-cards/types"

interface TagsCardProps {
  result: AnalyzerCardResult
  onEdit?: (r: AnalyzeResult) => void
}

export function TagsCard({ result, onEdit }: TagsCardProps) {
  const diets = result.diets ?? []
  const cuisines = result.cuisines ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" /> Tags & Categories
        </CardTitle>
        {onEdit && <Button variant="ghost" size="sm" onClick={()=>onEdit(result)}><Edit className="h-4 w-4"/></Button>}
      </CardHeader>
      <CardContent className="space-y-4">
        {diets.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Diets</h4>
            <div className="flex flex-wrap gap-2">{diets.map((d: string)=> <Badge key={d} variant="secondary">{d.replace(/_/g," ")}</Badge>)}</div>
          </div>
        )}
        {cuisines.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Cuisines</h4>
            <div className="flex flex-wrap gap-2">{cuisines.map((c: string)=> <Badge key={c} variant="outline">{c}</Badge>)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
