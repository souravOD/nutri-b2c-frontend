"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Lightbulb } from "lucide-react"
import type { AnalyzeResult } from "@/lib/types"
import type { AnalyzerCardResult } from "@/components/analyzer/result-cards/types"

interface SuggestionsCardProps {
  result: AnalyzerCardResult
  onEdit?: (r: AnalyzeResult) => void
}

export function SuggestionsCard({ result, onEdit }: SuggestionsCardProps) {
  const suggestions: string[] = result.suggestions || []
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4" /> Suggestions
        </CardTitle>
        {onEdit && <Button variant="ghost" size="sm" onClick={()=>onEdit(result)}><Edit className="h-4 w-4"/></Button>}
      </CardHeader>
      <CardContent>
        {suggestions.length ? (
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {suggestions.map((s, i)=> <li key={i}>{s}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No suggestions yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
