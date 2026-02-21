"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, ChefHat } from "lucide-react"
import type { AnalyzeResult, AnalyzedIngredient } from "@/lib/types"
import type { AnalyzerCardResult } from "@/components/analyzer/result-cards/types"

interface IngredientsCardProps {
  result: AnalyzerCardResult
  onEdit?: (r: AnalyzeResult) => void
}

export function IngredientsCard({ result, onEdit }: IngredientsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <ChefHat className="h-4 w-4" /> Ingredients ({result.ingredients?.length || 0})
        </CardTitle>
        {onEdit && <Button variant="ghost" size="sm" onClick={()=>onEdit(result)}><Edit className="h-4 w-4"/></Button>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(result.ingredients || []).map((ing: AnalyzedIngredient, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="text-sm">{ing.qty ? `${ing.qty} ` : ""}{ing.unit ? `${ing.unit} ` : ""}{ing.item}</div>
              {ing.matched && <Badge variant="outline" className="text-xs">matched</Badge>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
