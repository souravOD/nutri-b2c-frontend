// components/health-onboarding-wizard.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import {
  apiGetAllergens,
  apiGetDietaryPreferences,
  apiGetHealthConditions,
} from "@/lib/api"
import type { TaxonomyOption } from "@/lib/api"

type Step = 1 | 2 | 3 | 4
const toggleArray = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
const activityOptions = [
  { value: "sedentary", label: "Sedentary" },
  { value: "lightly_active", label: "Lightly active" },
  { value: "moderately_active", label: "Moderately active" },
  { value: "very_active", label: "Very active" },
  { value: "extremely_active", label: "Extremely active" },
] as const

const goalOptions = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "maintain_weight", label: "Maintain weight" },
  { value: "gain_weight", label: "Gain weight" },
  { value: "build_muscle", label: "Build muscle" },
] as const

export default function HealthOnboardingWizard() {
  const { user, updateUser } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [dietOptions, setDietOptions] = useState<TaxonomyOption[]>([])
  const [allergenOptions, setAllergenOptions] = useState<TaxonomyOption[]>([])
  const [conditionOptions, setConditionOptions] = useState<TaxonomyOption[]>([])

  // --- form state (accepts whatever the user enters; we normalize on save)
  const [dateOfBirth, setDateOfBirth] = useState<string>("")
  const [sex, setSex] = useState<"male" | "female" | "other" | "">("")
  const [heightValue, setHeightValue] = useState<string>("")
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm")
  const [weightValue, setWeightValue] = useState<string>("")
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg")
  const [activityLevel, setActivityLevel] = useState<typeof activityOptions[number]["value"] | "">("")
  const [goal, setGoal] = useState<typeof goalOptions[number]["value"] | "">("")
  const [diets, setDiets] = useState<string[]>([])
  const [allergens, setAllergens] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [disliked, setDisliked] = useState<string>("") // comma-separated

  useEffect(() => {
    let active = true
    Promise.all([apiGetDietaryPreferences(), apiGetAllergens(), apiGetHealthConditions()])
      .then(([dietsRes, allergensRes, conditionsRes]) => {
        if (!active) return
        setDietOptions(dietsRes || [])
        setAllergenOptions(allergensRes || [])
        setConditionOptions(conditionsRes || [])
      })
      .catch((err) => {
        console.error("Failed to load taxonomy choices", err)
        if (active) {
          setDietOptions([])
          setAllergenOptions([])
          setConditionOptions([])
        }
      })
    return () => { active = false }
  }, [])

  const pct = useMemo(() => {
    const total = 4
    return Math.round(((step - 1) / total) * 100)
  }, [step])

  // toggleArray is defined at module scope to avoid re-creation on each render

  async function handleFinish() {
    if (!user) return
    setSaving(true)
    try {
      const dislikedIngredients = disliked
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const resolveSelection = (selected: string[], options: TaxonomyOption[]) => {
        const byCode = new Map<string, TaxonomyOption>()
        for (const opt of options || []) {
          const key = opt.code || opt.name
          if (key) byCode.set(key, opt)
        }
        const names = selected
          .map((code) => byCode.get(code)?.name ?? code)
          .filter(Boolean)
        const codes = selected
          .map((code) => byCode.get(code)?.code ?? code)
          .filter(Boolean)
        const ids = selected
          .map((code) => byCode.get(code)?.gold_id)
          .filter(Boolean)
        return {
          names: Array.from(new Set(names)),
          codes: Array.from(new Set(codes)),
          ids: Array.from(new Set(ids)),
        }
      }

      const dietSel = resolveSelection(diets, dietOptions)
      const allergenSel = resolveSelection(allergens, allergenOptions)
      const conditionSel = resolveSelection(conditions, conditionOptions)

      // Normalize for our hook’s accepted shapes
      const payload = {
        // allow empty DoB (wizard UI shows optional)
        ...(dateOfBirth ? { dateOfBirth } : {}),
        ...(sex ? { sex } : {}),
        ...(activityLevel ? { activityLevel } : {}),
        ...(goal ? { goal } : {}),
        ...(heightValue
          ? { height: { value: Number(heightValue), unit: heightUnit } as const }
          : {}),
        ...(weightValue
          ? { weight: { value: Number(weightValue), unit: weightUnit } as const }
          : {}),
        ...(dietSel.names.length ? { diets: dietSel.names } : {}),
        ...(dietSel.codes.length ? { diet_codes: dietSel.codes } : {}),
        ...(dietSel.ids.length ? { diet_ids: dietSel.ids } : {}),
        ...(allergenSel.names.length ? { allergens: allergenSel.names } : {}),
        ...(allergenSel.codes.length ? { allergen_codes: allergenSel.codes } : {}),
        ...(allergenSel.ids.length ? { allergen_ids: allergenSel.ids } : {}),
        ...(dislikedIngredients.length ? { dislikedIngredients } : {}),
        ...(conditionSel.names.length ? { major_conditions: conditionSel.names } : {}),
        ...(conditionSel.codes.length ? { condition_codes: conditionSel.codes } : {}),
        ...(conditionSel.ids.length ? { condition_ids: conditionSel.ids } : {}),
        // ✅ important: mark onboarding completed
        onboardingComplete: true,
      }

      await updateUser(payload)
      toast({ title: "Profile saved", description: "Your recommendations are ready." })
      router.replace("/")
    } catch (e: any) {
      toast({ title: "Could not save profile", description: e?.message || "", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center">Welcome to NutriFind, {user?.name || "there"}!</h1>
      <p className="text-center text-muted-foreground mb-6">
        Let’s set up your health profile to get personalized recipe recommendations
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Tell us about yourself</CardDescription>
          <div className="mt-3 h-2 w-full rounded bg-secondary">
            <div
              className="h-2 rounded bg-primary transition-all"
              style={{ width: `${pct + 25}%` }} // 25%, 50%, 75%, 100%
            />
          </div>
          <div className="text-right text-xs text-muted-foreground mt-1">{pct + 25}% complete</div>
        </CardHeader>

        <CardContent className="space-y-8">
          {step === 1 && (
            <section className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Sex</Label>
                <RadioGroup value={sex} onValueChange={(v) => setSex(v as any)} className="grid grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="male" value="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="female" value="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="other" value="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <div className="flex gap-2">
                    <Input
                      id="height"
                      type="number"
                      placeholder="170"
                      value={heightValue}
                      onChange={(e) => setHeightValue(e.target.value)}
                    />
                    <Select value={heightUnit} onValueChange={(v) => setHeightUnit(v as any)}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      value={weightValue}
                      onChange={(e) => setWeightValue(e.target.value)}
                    />
                    <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as any)}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-6">
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select value={activityLevel} onValueChange={(v) => setActivityLevel(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Goal</Label>
                <Select value={goal} onValueChange={(v) => setGoal(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-6">
              <div className="space-y-2">
                <Label>Dietary Preferences</Label>
                <div className="flex flex-wrap gap-2">
                  {dietOptions.map((d) => (
                    <Button
                      key={d.code || d.name}
                      type="button"
                      variant={diets.includes(d.code || d.name || "") ? "default" : "outline"}
                      onClick={() => setDiets((arr) => toggleArray(arr, d.code || d.name || ""))}
                      className="rounded-full"
                      size="sm"
                    >
                      {d.name || d.code}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allergens</Label>
                <div className="flex flex-wrap gap-2">
                  {allergenOptions.map((a) => (
                    <Button
                      key={a.code || a.name}
                      type="button"
                      variant={allergens.includes(a.code || a.name || "") ? "default" : "outline"}
                      onClick={() => setAllergens((arr) => toggleArray(arr, a.code || a.name || ""))}
                      className="rounded-full"
                      size="sm"
                    >
                      {a.name || a.code}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Major Health Conditions</Label>
                <div className="flex flex-wrap gap-2">
                  {conditionOptions.map((c) => (
                    <Button
                      key={c.code || c.name}
                      type="button"
                      variant={conditions.includes(c.code || c.name || "") ? "default" : "outline"}
                      onClick={() => setConditions((arr) => toggleArray(arr, c.code || c.name || ""))}
                      className="rounded-full"
                      size="sm"
                    >
                      {c.name || c.code}
                    </Button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="disliked">Disliked Ingredients (comma-separated)</Label>
                <Input
                  id="disliked"
                  placeholder="e.g., cilantro, mushrooms"
                  value={disliked}
                  onChange={(e) => setDisliked(e.target.value)}
                />
              </div>
            </section>
          )}

          {/* nav */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
              disabled={step === 1 || saving}
            >
              Previous
            </Button>

            {step < 4 ? (
              <Button type="button" onClick={() => setStep((s) => ((s + 1) as Step))} disabled={saving}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleFinish} disabled={saving}>
                {saving ? "Saving…" : "Finish"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
