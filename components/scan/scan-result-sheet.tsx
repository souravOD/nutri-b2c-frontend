"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, Search, Heart, Camera, AlertTriangle, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { NutritionFactsPanel } from "@/components/nutrition-facts-panel"
import type { Product } from "@/lib/types"

type AllergenWarning = {
  allergenName: string
  severity: string | null
  memberName: string
  message: string
}

type HealthWarning = {
  conditionName: string
  nutrient: string
  value: number
  message: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: {
    format: string
    value: string
    product?: Product | null
  }
  allergenWarnings?: AllergenWarning[]
  healthWarnings?: HealthWarning[]
  onScanAgain: () => void
}

export function ScanResultSheet({
  open,
  onOpenChange,
  result,
  allergenWarnings = [],
  healthWarnings = [],
  onScanAgain,
}: Props) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.warn("Failed to copy:", error)
    }
  }

  const findRecipes = () => {
    if (result.product?.title) {
      router.push(`/search?q=${encodeURIComponent(result.product.title)}`)
    }
    onOpenChange(false)
  }

  const saveProduct = () => {
    // TODO: Implement product save (favorites/pantry)
    console.log("Saving product:", result.product)
  }

  const hasWarnings = allergenWarnings.length > 0 || healthWarnings.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Scan Result</SheetTitle>
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">{result.format}</Badge>
            <span className="font-mono text-sm">{result.value}</span>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {result.product ? (
            <>
              {/* Product Info */}
              <div className="flex gap-4">
                {result.product.imageUrl && (
                  <img
                    src={result.product.imageUrl || "/placeholder.svg"}
                    alt={result.product.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{result.product.title}</h3>
                  {result.product.brand && <p className="text-muted-foreground">{result.product.brand}</p>}
                  {result.product.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.product.tags.slice(0, 5).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Personalized Allergen Warnings */}
              {allergenWarnings.length > 0 && (
                <>
                  <div className="rounded-lg border-2 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <h4 className="font-semibold text-red-700 dark:text-red-300">
                        Allergen Warnings
                      </h4>
                    </div>
                    {allergenWarnings.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300"
                      >
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                </>
              )}

              {/* Personalized Health Warnings */}
              {healthWarnings.length > 0 && (
                <>
                  <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <h4 className="font-semibold text-amber-700 dark:text-amber-300">
                        Health Notices
                      </h4>
                    </div>
                    {healthWarnings.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
                      >
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                </>
              )}

              {/* Nutrition Facts - Show first */}
              {result.product.nutrition && (
                <>
                  <NutritionFactsPanel
                    nutrition={result.product.nutrition}
                    servings={1}
                  />
                </>
              )}

              {/* Standard Allergen Info (from product data) */}
              {result.product.allergens && result.product.allergens.length > 0 && (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Allergens</h4>
                    <div className="flex flex-wrap gap-1">
                      {result.product.allergens.map((allergen) => (
                        <Badge key={allergen} variant="destructive" className="text-xs">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={findRecipes} className="flex-1">
                  <Search className="w-4 h-4 mr-2" />
                  Find Recipes
                </Button>
                <Button variant="outline" onClick={saveProduct} className="flex-1 bg-transparent">
                  <Heart className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Product Not Found</h3>
              <p className="text-muted-foreground text-sm mb-4">We couldn't find information for this barcode.</p>
              <div className="space-y-2">
                <Button variant="outline" size="sm">
                  Try Photo Scan
                </Button>
                <Button variant="outline" size="sm">
                  Enter Code Manually
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Bottom Actions */}
          <div className="flex gap-3">
            <Button onClick={onScanAgain} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Scan Again
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
