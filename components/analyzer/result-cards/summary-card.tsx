"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, FileText, Clock, Users } from "lucide-react"
import type { AnalyzeResult } from "@/lib/types"
import type { AnalyzerCardResult } from "@/components/analyzer/result-cards/types"

interface SummaryCardProps {
  result: AnalyzerCardResult
  onEdit?: (r: AnalyzeResult) => void
}

export function SummaryCard({ result, onEdit }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" /> Recipe Summary
        </CardTitle>
        {onEdit && <Button variant="ghost" size="sm" onClick={()=>onEdit(result)}><Edit className="h-4 w-4"/></Button>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {result.title && <h3 className="font-semibold text-lg">{result.title}</h3>}
          {result.summary && <p className="text-sm text-muted-foreground">{result.summary}</p>}
          <div className="flex gap-4 text-sm">
            {result.servings && <div className="flex items-center gap-1"><Users className="h-4 w-4"/>{result.servings} servings</div>}
            <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4"/>est. time varies</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
