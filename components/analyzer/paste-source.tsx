"use client"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { SourceData } from "@/components/analyzer/analyzer-context"

const EXAMPLE = `Chocolate Chip Cookies
Serves: 24 cookies

Ingredients:
- 2 1/4 cups all-purpose flour
- 1 tsp baking soda
- 1 tsp salt
- 1 cup butter, softened
- 3/4 cup granulated sugar
- 3/4 cup brown sugar
- 2 large eggs
- 2 tsp vanilla extract
- 2 cups chocolate chips

Instructions:
1. Preheat oven to 375°F
2. Mix flour, baking soda, and salt
3. Cream butter and sugars
4. Beat in eggs and vanilla
5. Add flour mixture
6. Stir in chips
7. Bake 8–11 min`

export function PasteSource({ source, onChange }: { source: SourceData; onChange: (s: SourceData) => void }) {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="flex flex-col">
        <Label className="mb-2">Paste your recipe</Label>
        <Textarea rows={18} value={source.rawText || ""} onChange={(e) => onChange({ ...source, rawText: e.target.value })} />
      </div>
      <div className="flex flex-col">
        <Label className="mb-2 text-muted-foreground">Example</Label>
        <Textarea readOnly rows={18} value={EXAMPLE} className="opacity-80" />
      </div>
    </div>
  )
}
