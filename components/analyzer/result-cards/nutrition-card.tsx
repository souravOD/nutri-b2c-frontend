"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Edit, Activity } from "lucide-react"
import type { AnalyzeResult } from "@/lib/types"
import type { AnalyzerCardResult } from "@/components/analyzer/result-cards/types"

interface NutritionCardProps {
  result: AnalyzerCardResult
  onEdit?: (r: AnalyzeResult) => void
}

export function NutritionCard({ result, onEdit }: NutritionCardProps) {
  const n = result.nutrition || {}
  const calories = n.calories || 0
  const pct = (v: number, kcalPerGram: number) => (calories ? Math.min(100, ((v * kcalPerGram) / calories) * 100) : 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" /> Nutrition (per serving)
        </CardTitle>
        {onEdit && <Button variant="ghost" size="sm" onClick={()=>onEdit(result)}><Edit className="h-4 w-4"/></Button>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm font-medium">Calories</span><span className="text-sm">{calories}</span></div>
            <div className="flex justify-between"><span className="text-sm">Protein</span><span className="text-sm">{n.protein} g</span></div>
            <div className="flex justify-between"><span className="text-sm">Carbs</span><span className="text-sm">{n.carbs} g</span></div>
            <div className="flex justify-between"><span className="text-sm">Fat</span><span className="text-sm">{n.fat} g</span></div>
            {n.sodium != null && <div className="flex justify-between"><span className="text-sm">Sodium</span><span className="text-sm">{n.sodium} mg</span></div>}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span>Protein</span><span>{Math.round(pct(n.protein||0,4))}%</span></div>
            <Progress value={pct(n.protein||0,4)} className="h-1"/>
            <div className="flex justify-between text-xs"><span>Carbs</span><span>{Math.round(pct(n.carbs||0,4))}%</span></div>
            <Progress value={pct(n.carbs||0,4)} className="h-1"/>
            <div className="flex justify-between text-xs"><span>Fat</span><span>{Math.round(pct(n.fat||0,9))}%</span></div>
            <Progress value={pct(n.fat||0,9)} className="h-1"/>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
