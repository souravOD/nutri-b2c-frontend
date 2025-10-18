"use client"

import { useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ALL_ALLERGENS, ALL_CUISINES, ALL_DIETS, ALL_MAJOR_CONDITIONS } from "@/lib/data"
import { CuisineMultiSelect } from "./cuisine-multi-select"

// Required shape with defaults that match FiltersFormValues in lib/types.ts
// --- Schema with defaults (defaults make INPUT keys optional, OUTPUT required) ---
const schema = z.object({
  dietaryRestrictions: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),

  // [min, max] calories
  calories: z.tuple([z.number(), z.number()]).default([0, 1200]),

  proteinMin: z.number().min(0).default(0),
  carbsMin: z.number().min(0).default(0),
  fatMin: z.number().min(0).default(0),
  fiberMin: z.number().min(0).default(0),

  sugarMax: z.number().min(0).default(100),
  sodiumMax: z.number().min(0).default(4000),
  maxTime: z.number().min(0).default(120),

  cuisines: z.array(z.string()).default([]),
  majorConditions: z.array(z.string()).default([]),
  q: z.string().default(""),
  // meal type: '' means not set; otherwise one of 'breakfast','lunch','dinner','snack'
  mealType: z.string().default(""),
})

// IMPORTANT: use the schema's INPUT type for the form, OUTPUT type for apply()
type FiltersFormInput = z.input<typeof schema>   // optionals allowed
export type FiltersFormValues = z.output<typeof schema> // all fields present

interface FilterPanelProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialValues: FiltersFormValues
  onApply: (values: FiltersFormValues) => void
  onReset: () => void
}

export function FilterPanel({ open, onOpenChange, initialValues, onApply, onReset }: FilterPanelProps) {
  const form = useForm<FiltersFormInput>({
    resolver: zodResolver(schema),
    // provide full defaults (OUTPUT fits into INPUT just fine)
    defaultValues: schema.parse(initialValues ?? {}),
    mode: "onChange",
  })

   useEffect(() => {
    form.reset(schema.parse(initialValues ?? {}));
  }, [open, initialValues, form]);

  // function getActiveFiltersCount(): number {
  //   const values = form.getValues()
  //   let count = 0
  //   if ((values.dietaryRestrictions || []).length > 0) count++
  //   if ((values.allergens || []).length > 0) count++
  //   if ((values.cuisines || []).length > 0) count++
  //   if ((values.majorConditions || []).length > 0) count++
  //   if (values.calories && (values.calories[0] > 0 || values.calories[1] < 1200)) count++
  //   if ((values.proteinMin || 0) > 0) count++
  //   if ((values.carbsMin || 0) > 0) count++
  //   if ((values.fatMin || 0) > 0) count++
  //   if ((values.fiberMin || 0) > 0) count++
  //   if ((values.sugarMax || 100) < 100) count++
  //   if ((values.sodiumMax || 4000) < 4000) count++
  //   if ((values.maxTime || 120) < 120) count++
  //   if ((values.mealType || "") !== "") count++
  //   return count
  // }
  function getActiveFiltersCount(): number {
    const values = form.getValues();
    let count = 0;

    // Count all selected array filters individually
    count += values.dietaryRestrictions.length;
    count += values.allergens.length;
    count += values.cuisines.length;
    count += values.majorConditions.length;

    // Numeric and single-value filters
    if (values.calories[0] > 0) count++;           // Min calories
    if (values.calories[1] < 1200) count++;        // Max calories
    if (values.proteinMin > 0) count++;
    if (values.carbsMin > 0) count++;
    if (values.fatMin > 0) count++;
    if (values.fiberMin > 0) count++;
    if (values.sugarMax < 100) count++;
    if (values.sodiumMax < 4000) count++;
    if (values.maxTime < 120) count++;
    if (values.mealType) count++;

    return count;
  }
  function handleApply() {
    const values = schema.parse(form.getValues())
    onApply(values)
    onOpenChange(false)
  }

  function handleReset() {
    const resetValues = {
      dietaryRestrictions: [],
      allergens: [],
      calories: [0, 1200] as [number, number],
      proteinMin: 0,
      carbsMin: 0,
      fatMin: 0,
      fiberMin: 0,
      sugarMax: 100,
      sodiumMax: 4000,
      maxTime: 120,
      cuisines: [],
      majorConditions: [],
      q: "",
      mealType: "",
    }
    form.reset(resetValues)
    onReset()
  }

  const watchCalories = form.watch("calories") || [0, 1200]
  const watchProtein = form.watch("proteinMin") || 0
  const watchCarbs = form.watch("carbsMin") || 0
  const watchFat = form.watch("fatMin") || 0
  const watchFiber = form.watch("fiberMin") || 0
  const watchSugar = form.watch("sugarMax") || 100
  const watchSodium = form.watch("sodiumMax") || 4000
  const watchMaxTime = form.watch("maxTime") || 120
  const watchMealType = form.watch("mealType") || ""

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 w-full md:max-w-md h-dvh flex flex-col">
        <div className="p-6 border-b">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              Refine recipes by diet, nutrition, time, and cuisine.
              <br />
              <span className="text-xs text-muted-foreground">
                Diets & Allergens use AND logic. Cuisines use OR logic. Macros are minimums, Calories is range.
              </span>
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Dietary Restrictions */}
            <section>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Dietary Restrictions
                <Badge variant="outline" className="text-xs">
                  AND
                </Badge>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {ALL_DIETS.map((diet) => {
                  const checked = (form.watch("dietaryRestrictions") || []).includes(diet)
                  return (
                    <label
                      key={diet}
                      className="flex items-center gap-2 rounded border p-2 [&:has(:checked)]:bg-muted cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const current = form.getValues("dietaryRestrictions") || []
                          form.setValue(
                            "dietaryRestrictions",
                            v ? [...current, diet] : current.filter((d) => d !== diet),
                          )
                        }}
                      />
                      <span className="text-sm">{diet}</span>
                    </label>
                  )
                })}
              </div>
            </section>

            {/* Allergens */}
            <section>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Allergens to Avoid
                <Badge variant="outline" className="text-xs">
                  AND
                </Badge>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ALLERGENS.map((allergen) => {
                  const checked = (form.watch("allergens") || []).includes(allergen)
                  return (
                    <label
                      key={allergen}
                      className="flex items-center gap-2 rounded border p-2 [&:has(:checked)]:bg-destructive/10 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const current = form.getValues("allergens") || []
                          form.setValue("allergens", v ? [...current, allergen] : current.filter((x) => x !== allergen))
                        }}
                      />
                      <span className="text-sm">{allergen}</span>
                    </label>
                  )
                })}
              </div>
            </section>
            {/* Major Health Conditions */}
            <section className="space-y-2">
              <Label>Major Health Conditions</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_MAJOR_CONDITIONS.map((cond) => {
                  const checked = (form.watch("majorConditions") || []).includes(cond)
                  return (
                    <label key={cond} className="flex items-center gap-2 rounded border px-2 py-1">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const curr = form.getValues("majorConditions") || []
                          form.setValue(
                            "majorConditions",
                            v ? [...curr, cond] : curr.filter((x: string) => x !== cond)
                          )
                        }}
                      />
                      <span className="text-sm">{cond}</span>
                    </label>
                  )
                })}
              </div>
            </section>

            <Separator />

            {/* Nutrition */}
            <section>
              <h3 className="font-semibold mb-3">Nutrition</h3>
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center justify-between mb-2">
                    <span>Calories (range)</span>
                    <span className="text-sm font-mono">
                      {watchCalories[0]} - {watchCalories[1]} kcal
                    </span>
                  </Label>
                  <Slider
                    min={0}
                    max={1200}
                    step={10}
                    value={watchCalories}
                    onValueChange={(v) => form.setValue("calories", [v[0], v[1]] as [number, number])}
                    className="w-full"
                    aria-label="Calories range"
                  />
                </div>

                <div>
                  <Label className="flex items-center justify-between mb-2">
                    <span>Protein (minimum)</span>
                    <span className="text-sm font-mono">{watchProtein}g+</span>
                  </Label>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[watchProtein]}
                    onValueChange={(v) => form.setValue("proteinMin", v[0])}
                    className="w-full"
                    aria-label="Minimum protein"
                  />
                </div>

                <div>
                  <Label className="flex items-center justify-between mb-2">
                    <span>Carbs (minimum)</span>
                    <span className="text-sm font-mono">{watchCarbs}g+</span>
                  </Label>
                  <Slider
                    min={0}
                    max={200}
                    step={5}
                    value={[watchCarbs]}
                    onValueChange={(v) => form.setValue("carbsMin", v[0])}
                    className="w-full"
                    aria-label="Minimum carbs"
                  />
                </div>

                <div>
                  <Label className="flex items-center justify-between mb-2">
                    <span>Fat (minimum)</span>
                    <span className="text-sm font-mono">{watchFat}g+</span>
                  </Label>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[watchFat]}
                    onValueChange={(v) => form.setValue("fatMin", v[0])}
                    className="w-full"
                    aria-label="Minimum fat"
                  />
                </div>

                <div>
                  <Label className="flex items-center justify-between mb-2">
                    <span>Fiber (minimum)</span>
                    <span className="text-sm font-mono">{watchFiber}g+</span>
                  </Label>
                  <Slider
                    min={0}
                    max={50}
                    step={1}
                    value={[watchFiber]}
                    onValueChange={(v) => form.setValue("fiberMin", v[0])}
                    className="w-full"
                    aria-label="Minimum fiber"
                  />
                </div>

                <div>
                  <Label className="flex items-center justify-between mb-2">
                    <span>Sugar (maximum)</span>
                    <span className="text-sm font-mono">≤{watchSugar}g</span>
                  </Label>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[watchSugar]}
                    onValueChange={(v) => form.setValue("sugarMax", v[0])}
                    className="w-full"
                    aria-label="Maximum sugar"
                  />
                </div>

                <div>
                  <Label className="flex items-center justify-between mb-2">
                    <span>Sodium (maximum)</span>
                    <span className="text-sm font-mono">≤{watchSodium}mg</span>
                  </Label>
                  <Slider
                    min={0}
                    max={4000}
                    step={50}
                    value={[watchSodium]}
                    onValueChange={(v) => form.setValue("sodiumMax", v[0])}
                    className="w-full"
                    aria-label="Maximum sodium"
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Cooking Time */}
            <section>
              <h3 className="font-semibold mb-3">Cooking Time</h3>
              <div>
                <Label className="flex items-center justify-between mb-2">
                  <span>Max total time</span>
                  <span className="text-sm font-mono">≤{watchMaxTime} min</span>
                </Label>
                <Slider
                  min={0}
                  max={120}
                  step={5}
                  value={[watchMaxTime]}
                  onValueChange={(v) => form.setValue("maxTime", v[0])}
                  className="w-full"
                  aria-label="Maximum cooking time"
                />
              </div>
            </section>

            {/* Cuisine */}
            <section>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Cuisine Type
                <Badge variant="outline" className="text-xs">
                  OR
                </Badge>
              </h3>
              <CuisineMultiSelect
                options={ALL_CUISINES}
                value={form.watch("cuisines") || []}
                onChange={(next) => form.setValue("cuisines", next)}
              />
            </section>

            <Separator />

            {/* Meal Type */}
            <section>
              <h3 className="font-semibold mb-3">Meal Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "breakfast", label: "Breakfast" },
                  { key: "lunch", label: "Lunch" },
                  { key: "dinner", label: "Dinner" },
                  { key: "snack", label: "Snack" },
                ].map((opt) => {
                  const checked = watchMealType === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={`rounded border px-3 py-2 text-left ${checked ? 'bg-accent' : ''}`}
                      onClick={() => form.setValue('mealType', checked ? '' : opt.key)}
                      aria-pressed={checked}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
        </div>

        {/* Sticky Actions */}
        <div className="sticky bottom-0 border-t bg-background p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button className="flex-1" onClick={handleApply}>
                Apply
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-primary-foreground text-primary">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
            {activeFiltersCount > 0 && (
              <p className="text-xs text-muted-foreground text-center" aria-live="polite">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} applied
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
