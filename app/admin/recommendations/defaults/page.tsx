// app/admin/recommendations/defaults/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Info, Save, RotateCcw } from "lucide-react"
import { getAdminDefaults, setAdminDefaults, isAdminApplyEnabled, setAdminApplyEnabled } from "@/lib/admin/defaults"
import { appendAudit } from "@/lib/admin/audit"
// v12c exposes DEFAULT_SETTINGS; Vercel used a helper. We'll build our own getDefaultSettings().
import { DEFAULT_SETTINGS as BASE_DEFAULTS } from "@/lib/settings"

// --- Local constants (kept small; adjust if you like) ---
const ALL_DIETS = ["vegan", "vegetarian", "keto", "paleo", "gluten-free", "dairy-free"]
const ALL_ALLERGENS = ["milk", "egg", "fish", "shellfish", "tree nuts", "peanuts", "wheat", "soy", "sesame"]
const ALL_CUISINES = ["italian", "mexican", "thai", "indian", "japanese", "mediterranean"]

// Shape we use locally; avoids depending on missing exported types.
type RecommendationSettings = {
  weights: {
    tasteVsHealth: number // 0..100 (higher = prioritize taste)
  }
  filters: {
    calories: [number, number] // range
    prepTime: [number, number] // minutes range
    diets: string[]
    allergens: string[] // to avoid
    cuisines: string[]
    healthyOnly: boolean
  }
}

// Build defaults from your v12c DEFAULT_SETTINGS if present; otherwise fall back.
function getDefaultSettings(): RecommendationSettings {
  const fallback: RecommendationSettings = {
    weights: { tasteVsHealth: 50 },
    filters: {
      calories: [0, 800],
      prepTime: [0, 120],
      diets: [],
      allergens: [],
      cuisines: [],
      healthyOnly: false,
    },
  }

  // Many v12c setups keep recommendation knobs under something like DEFAULT_SETTINGS.recommendations
  // If your structure differs, tweak the mapping below — it’s defensive and won’t break if keys are missing.
  try {
    const anyBase = BASE_DEFAULTS as any
    const rec = anyBase?.recommendations ?? anyBase?.defaults ?? anyBase // be permissive
    if (!rec) return fallback

    return {
      weights: {
        tasteVsHealth: Number(rec?.weights?.tasteVsHealth ?? 50),
      },
      filters: {
        calories: Array.isArray(rec?.filters?.calories)
          ? [Number(rec.filters.calories[0] ?? 0), Number(rec.filters.calories[1] ?? 800)]
          : [0, 800],
        prepTime: Array.isArray(rec?.filters?.prepTime)
          ? [Number(rec.filters.prepTime[0] ?? 0), Number(rec.filters.prepTime[1] ?? 120)]
          : [0, 120],
        diets: Array.isArray(rec?.filters?.diets) ? rec.filters.diets.slice() : [],
        allergens: Array.isArray(rec?.filters?.allergens) ? rec.filters.allergens.slice() : [],
        cuisines: Array.isArray(rec?.filters?.cuisines) ? rec.filters.cuisines.slice() : [],
        healthyOnly: Boolean(rec?.filters?.healthyOnly ?? false),
      },
    }
  } catch {
    return fallback
  }
}

// Small, inline score preview similar to Vercel’s card
function ScorePreview({ settings }: { settings: RecommendationSettings }) {
  const score = useMemo(() => {
    // Toy formula: higher taste weight reduces health score a bit; penalties for calories/time; bonuses for healthyOnly.
    const taste = settings.weights.tasteVsHealth
    const [cMin, cMax] = settings.filters.calories
    const [tMin, tMax] = settings.filters.prepTime

    let s = 100
    s -= taste * 0.2
    s -= Math.max(0, (cMax - 600) / 10) // penalize very high max calories
    s -= Math.max(0, (tMax - 45) / 2) // penalize long prep time
    if (settings.filters.healthyOnly) s += 10
    s = Math.max(0, Math.min(100, Math.round(s)))
    return s
  }, [settings])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Preview</CardTitle>
        <CardDescription>Example: Mediterranean Quinoa Bowl</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-4xl font-bold">{score}</div>
        <div className="text-sm text-muted-foreground">
          Formula: base 100 − tasteBias − caloriePenalty − timePenalty + healthyBonus
        </div>
        <Separator />
        <div className="text-sm">
          <div>
            Taste vs Health: <Badge variant="secondary">{settings.weights.tasteVsHealth}</Badge>
          </div>
          <div className="mt-1">
            Calories:{" "}
            <Badge variant="outline">
              {settings.filters.calories[0]} – {settings.filters.calories[1]} kcal
            </Badge>
          </div>
          <div className="mt-1">
            Prep time:{" "}
            <Badge variant="outline">
              {settings.filters.prepTime[0]} – {settings.filters.prepTime[1]} min
            </Badge>
          </div>
          <div className="mt-1">
            Diets:{" "}
            {settings.filters.diets.length ? (
              settings.filters.diets.map((d) => (
                <Badge key={d} variant="secondary" className="mr-1">
                  {d}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">none</span>
            )}
          </div>
          <div className="mt-1">
            Avoid:{" "}
            {settings.filters.allergens.length ? (
              settings.filters.allergens.map((a) => (
                <Badge key={a} variant="secondary" className="mr-1">
                  {a}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">none</span>
            )}
          </div>
          <div className="mt-1">
            Cuisines:{" "}
            {settings.filters.cuisines.length ? (
              settings.filters.cuisines.map((c) => (
                <Badge key={c} variant="secondary" className="mr-1">
                  {c}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">any</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminRecommendationDefaults() {
  const [settings, setSettings] = useState<RecommendationSettings>(getDefaultSettings())
  const [applyToDevice, setApplyToDevice] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    const saved = getAdminDefaults<RecommendationSettings>()
    const apply = isAdminApplyEnabled()
    if (saved) setSettings(saved)
    setApplyToDevice(apply)
  }, [])

  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [settings, applyToDevice])

  const save = () => {
    setAdminDefaults(settings)
    setAdminApplyEnabled(applyToDevice)
    setHasUnsavedChanges(false)
    appendAudit({
      ts: new Date().toISOString(),
      actor: "admin",
      action: "save-defaults",
      summary: "Saved recommendation defaults",
    })
  }

  const reset = () => {
    setSettings(getDefaultSettings())
    setApplyToDevice(isAdminApplyEnabled())
    setHasUnsavedChanges(true)
  }

  // Helpers for chip/checkbox multi-selects
  const toggleInArray = (key: "diets" | "allergens" | "cuisines", value: string) => {
    setSettings((prev) => {
      const next = new Set(prev.filters[key])
      next.has(value) ? next.delete(value) : next.add(value)
      return { ...prev, filters: { ...prev.filters, [key]: Array.from(next) } }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Global Recommendation Defaults</h1>
          <p className="text-muted-foreground">Configure default recommendation settings for all users (demo/local).</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={reset} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={save} disabled={!hasUnsavedChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These settings are stored in your browser’s <strong>localStorage</strong> for demo purposes and do not modify
          your backend/Appwrite data.
        </AlertDescription>
      </Alert>

      {/* Apply to device */}
      <Card>
        <CardHeader>
          <CardTitle>Apply to this device</CardTitle>
          <CardDescription>Control whether defaults override user settings on this device.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Switch id="apply" checked={applyToDevice} onCheckedChange={setApplyToDevice} />
          <Label htmlFor="apply">Force defaults for this device</Label>
          <Badge variant="secondary">{applyToDevice ? "Enabled" : "Disabled"}</Badge>
        </CardContent>
      </Card>

      {/* Scoring */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring</CardTitle>
          <CardDescription>Balance between taste and health, and constrain calories & prep time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Taste vs Health */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tasteHealth">Taste vs Health</Label>
              <Badge variant="secondary">{settings.weights.tasteVsHealth}</Badge>
            </div>
            <Slider
              id="tasteHealth"
              value={[settings.weights.tasteVsHealth]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) =>
                setSettings((s) => ({ ...s, weights: { ...s.weights, tasteVsHealth: Number(v) } }))
              }
            />
          </div>

          {/* Calories range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="calories">Calories range</Label>
              <Badge variant="outline">
                {settings.filters.calories[0]} – {settings.filters.calories[1]} kcal
              </Badge>
            </div>
            <Slider
              id="calories"
              value={[settings.filters.calories[0], settings.filters.calories[1]]}
              min={0}
              max={1200}
              step={10}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, filters: { ...s.filters, calories: [Number(v[0]), Number(v[1])] as [number, number] } }))
              }
            />
          </div>

          {/* Prep time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prep">Prep time (min)</Label>
              <Badge variant="outline">
                {settings.filters.prepTime[0]} – {settings.filters.prepTime[1]} min
              </Badge>
            </div>
            <Slider
              id="prep"
              value={[settings.filters.prepTime[0], settings.filters.prepTime[1]]}
              min={0}
              max={180}
              step={5}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, filters: { ...s.filters, prepTime: [Number(v[0]), Number(v[1])] as [number, number] } }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Dietary & Allergens */}
      <Card>
        <CardHeader>
          <CardTitle>Dietary & Allergens</CardTitle>
          <CardDescription>Select preferred diets, allergens to avoid, and cuisine tags.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Diets */}
          <div className="space-y-2">
            <div className="font-medium">Preferred diets</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ALL_DIETS.map((d) => (
                <label key={d} className="flex items-center gap-2">
                  <Checkbox checked={settings.filters.diets.includes(d)} onCheckedChange={() => toggleInArray("diets", d)} />
                  <span className="capitalize">{d}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div className="space-y-2">
            <div className="font-medium">Avoid allergens</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ALL_ALLERGENS.map((a) => (
                <label key={a} className="flex items-center gap-2">
                  <Checkbox checked={settings.filters.allergens.includes(a)} onCheckedChange={() => toggleInArray("allergens", a)} />
                  <span className="capitalize">{a}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cuisines */}
          <div className="space-y-2">
            <div className="font-medium">Cuisine tags</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ALL_CUISINES.map((c) => (
                <label key={c} className="flex items-center gap-2">
                  <Checkbox checked={settings.filters.cuisines.includes(c)} onCheckedChange={() => toggleInArray("cuisines", c)} />
                  <span className="capitalize">{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Healthy only */}
          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="healthy"
              checked={settings.filters.healthyOnly}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, filters: { ...s.filters, healthyOnly: Boolean(v) } }))}
            />
            <Label htmlFor="healthy">Show only healthy options</Label>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <ScorePreview settings={settings} />
    </div>
  )
}
