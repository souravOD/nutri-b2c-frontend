"use client"

import { useSettings } from "@/hooks/use-settings"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { SettingsSection } from "@/components/settings/settings-section"
import { SliderSetting } from "@/components/settings/slider-setting"
import { RangeSetting } from "@/components/settings/range-setting"
import { ToggleSetting } from "@/components/settings/toggle-setting"
import { MultiSelectSetting } from "@/components/settings/multi-select-setting"
import { TagInputSetting } from "@/components/settings/tag-input-setting"
import { StickyApplyBar } from "@/components/settings/sticky-apply-bar"
import { ScorePreviewCard } from "@/components/settings/score-preview-card"
import { ALL_CUISINES, ALL_DIETS, ALL_ALLERGENS } from "@/lib/settings"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import type { SortOption } from "@/lib/types"

// Coerce string input to a number; if empty/NaN, keep the previous number
const toNum = (prev: number, v: string) => {
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? prev : n;
};

export default function SettingsPage() {
  const { settings, updateSettings, apply, resetToDefaults, downloadJson } = useSettings()
  const { toast } = useToast()

  const handleApply = () => {
    apply()
    toast({ title: "Settings saved", description: "Your preferences have been saved successfully." })
  }

  const handleReset = () => {
    resetToDefaults()
    toast({ title: "Settings reset", description: "All settings have been restored to defaults." })
  }

  const handleClearData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nutri_favorites")
      localStorage.removeItem("nutri_history")
    }
    toast({ title: "Data cleared", description: "Personalization data has been cleared." })
  }

  // safe locals for optional sections
  const behavior = settings.behavior ?? {}
  const adv = settings.advanced ?? { weights: { health: 0, time: 0, popularity: 0, personal: 0, diversity: 0 } }
  const caps = settings.caps ?? {}

  const tabs = [
    {
      id: "general",
      label: "General",
      content: (
        <div className="space-y-6">
          <SettingsSection
            title="General Preferences"
            description="Configure your basic preferences for units, cuisines, and cooking time."
          >
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Units</Label>
                <RadioGroup
                  value={settings.units}
                  onValueChange={(value: "US" | "Metric") => updateSettings({ units: value })}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="US" id="us" />
                    <Label htmlFor="us">US (Imperial)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Metric" id="metric" />
                    <Label htmlFor="metric">Metric</Label>
                  </div>
                </RadioGroup>
              </div>

              <MultiSelectSetting
                label="Preferred Cuisines"
                description="Select cuisines you enjoy most"
                options={ALL_CUISINES}
                value={settings.cuisines}
                onChange={(cuisines) => updateSettings({ cuisines })}
              />

              <TagInputSetting
                label="Disliked Ingredients"
                description="Add ingredients you want to avoid"
                value={settings.dislikes}
                onChange={(dislikes) => updateSettings({ dislikes })}
                placeholder="e.g., mushrooms, cilantro"
              />

              {/* RangeSetting doesn't support formatValue in your codebase; remove it */}
              <RangeSetting
                label="Default Time Range"
                description="Preferred cooking time range in minutes"
                min={0}
                max={120}
                step={5}
                value={settings.timeRangeMinMax}
                onChange={(timeRangeMinMax) => updateSettings({ timeRangeMinMax })}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "goals",
      label: "Goals",
      content: (
        <div className="space-y-6">
          <SettingsSection
            title="Goals & Constraints"
            description="Set your dietary goals, restrictions, and nutritional targets."
          >
            <div className="space-y-4">
              <MultiSelectSetting
                label="Diets"
                description="Select dietary preferences you follow"
                options={ALL_DIETS}
                value={settings.diets}
                onChange={(diets) => updateSettings({ diets })}
              />

              <MultiSelectSetting
                label="Allergens to Avoid"
                description="Select allergens you need to avoid"
                options={ALL_ALLERGENS}
                value={settings.allergens}
                onChange={(allergens) => updateSettings({ allergens })}
              />

              <div>
                <Label htmlFor="calorie-target" className="text-base font-medium">
                  Daily Calorie Target
                </Label>
                <Input
                  id="calorie-target"
                  type="number"
                  min="1000"
                  max="5000"
                  value={String(settings.calorieTarget ?? "")}
                  onChange={(e) =>
                    updateSettings({ calorieTarget: Number.parseInt(e.target.value) || undefined })
                  }
                  className="mt-2 max-w-xs"
                  placeholder="2000"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Macro Weights (0-100)</Label>
                <SliderSetting
                  label="Protein Priority"
                  value={settings.macroWeights.protein}
                  onChange={(protein) =>
                    updateSettings({ macroWeights: { ...settings.macroWeights, protein } })
                  }
                  min={0}
                  max={100}
                />
                <SliderSetting
                  label="Carbs Priority"
                  value={settings.macroWeights.carbs}
                  onChange={(carbs) =>
                    updateSettings({ macroWeights: { ...settings.macroWeights, carbs } })
                  }
                  min={0}
                  max={100}
                />
                <SliderSetting
                  label="Fat Priority"
                  value={settings.macroWeights.fat}
                  onChange={(fat) => updateSettings({ macroWeights: { ...settings.macroWeights, fat } })}
                  min={0}
                  max={100}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sodium-max" className="text-base font-medium">
                    Sodium Max (mg)
                  </Label>
                  <Input
                    id="sodium-max"
                    type="number"
                    min="0"
                    max="10000"
                    value={String(caps.sodiumMax ?? "")}
                    onChange={(e) =>
                      updateSettings({
                        caps: { ...settings.caps, sodiumMax: toNum(settings.caps.sodiumMax, e.target.value)},
                      })
                    }
                    className="mt-2"
                    placeholder="2300"
                  />
                </div>
                <div>
                  <Label htmlFor="sugar-max" className="text-base font-medium">
                    Added Sugar Max (g)
                  </Label>
                  <Input
                    id="sugar-max"
                    type="number"
                    min="0"
                    max="200"
                    value={String(caps.addedSugarMax ?? "")}
                    onChange={(e) =>
                      updateSettings({
                        caps: { ...settings.caps, addedSugarMax: toNum(settings.caps.addedSugarMax, e.target.value)},
                      })
                    }
                    className="mt-2"
                    placeholder="50"
                  />
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "recommendation",
      label: "Recommendation",
      content: (
        <div className="space-y-6">
          <SettingsSection
            title="Recommendation Behavior"
            description="Fine-tune how recipes are recommended and ranked for you."
          >
            <div className="space-y-4">
              {/* Map Explore/Exploit to behavior.exploration (0..1) */}
              <SliderSetting
                label="Explore ↔ Exploit"
                description="Balance between trying new recipes vs. sticking to favorites"
                value={Math.round((behavior.exploration ?? 0) * 100)}
                onChange={(pct) =>
                  updateSettings({ behavior: { ...behavior, exploration: (pct as number) / 100 } })
                }
                min={0}
                max={100}
              />

              {/* These next controls map to advanced weights that actually exist in your types */}
              <SliderSetting
                label="Diversity"
                description="How much variety you want in recommendations"
                value={adv.weights.diversity ?? 0}
                onChange={(diversity) =>
                  updateSettings({
                    advanced: { ...adv, weights: { ...adv.weights, diversity } },
                  })
                }
                min={0}
                max={100}
              />

              <SliderSetting
                label="Health Emphasis"
                description="Prioritize healthier recipes"
                value={adv.weights.health ?? 0}
                onChange={(health) =>
                  updateSettings({
                    advanced: { ...adv, weights: { ...adv.weights, health } },
                  })
                }
                min={0}
                max={100}
              />

              <SliderSetting
                label="Personalization Weight"
                description="How much your history influences recommendations"
                value={adv.weights.personal ?? 0}
                onChange={(personal) =>
                  updateSettings({
                    advanced: { ...adv, weights: { ...adv.weights, personal } },
                  })
                }
                min={0}
                max={100}
              />

              <div>
                <Label className="text-base font-medium">Default Sort</Label>
                <Select
                  value={behavior.defaultSort ?? "time"}
                  onValueChange={(defaultSort: SortOption) =>
                    updateSettings({ behavior: { ...behavior, defaultSort } })
                  }
                >
                  <SelectTrigger className="mt-2 max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time</SelectItem>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="popular">Popularity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ToggleSetting
                label="Show Score Badge"
                description="Display recommendation scores on recipe cards"
                checked={!!behavior.showScoreBadge}
                onChange={(showScoreBadge) => updateSettings({ behavior: { ...behavior, showScoreBadge } })}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "privacy",
      label: "Privacy",
      content: (
        <div className="space-y-6">
          <SettingsSection title="Data & Privacy" description="Control how your data is used for personalization.">
            <div className="space-y-4">
              {/* Your current types don't include personalization.useHistory; remove that toggle */}

              <div className="space-y-3">
                <Label className="text-base font-medium">Data Management</Label>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleClearData}>
                    Clear Personalization Data
                  </Button>
                  <Button variant="outline" onClick={downloadJson}>
                    Download Settings JSON
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Reset All Settings
                  </Button>
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      content: (
        <div className="space-y-6">
          <SettingsSection
            title="Notifications"
            description="Configure when and how you'd like to be notified (UI-only preview)."
          >
            <div className="space-y-4">
              {/* Your types only have notifications.enableReminders */}
              <ToggleSetting
                label="Enable Reminders"
                description="Turn on simple UI reminders (no actual push/email)"
                checked={!!settings.notifications?.enableReminders}
                onChange={(enableReminders) =>
                  updateSettings({ notifications: { ...(settings.notifications ?? {}), enableReminders } })
                }
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "advanced",
      label: "Advanced",
      content: (
        <div className="space-y-6">
          <SettingsSection
            title="Advanced Settings"
            description="Fine-tune the recommendation weights and view live scoring."
          >
            <div className="space-y-4">
              {/* Algorithm select removed (not in your types) */}

              <div className="space-y-3">
                <Label className="text-base font-medium">Rerank Weights (0-100)</Label>
                <SliderSetting
                  label="Health (Wh)"
                  value={adv.weights.health ?? 0}
                  onChange={(health) =>
                    updateSettings({ advanced: { ...adv, weights: { ...adv.weights, health } } })
                  }
                  min={0}
                  max={100}
                />
                <SliderSetting
                  label="Time (Wt)"
                  value={adv.weights.time ?? 0}
                  onChange={(time) =>
                    updateSettings({ advanced: { ...adv, weights: { ...adv.weights, time } } })
                  }
                  min={0}
                  max={100}
                />
                <SliderSetting
                  label="Popularity (Wp)"
                  value={adv.weights.popularity ?? 0}
                  onChange={(popularity) =>
                    updateSettings({ advanced: { ...adv, weights: { ...adv.weights, popularity } } })
                  }
                  min={0}
                  max={100}
                />
                <SliderSetting
                  label="Personal (Wr)"
                  value={adv.weights.personal ?? 0}
                  onChange={(personal) =>
                    updateSettings({ advanced: { ...adv, weights: { ...adv.weights, personal } } })
                  }
                  min={0}
                  max={100}
                />
                <SliderSetting
                  label="Diversity (Wd)"
                  value={adv.weights.diversity ?? 0}
                  onChange={(diversity) =>
                    updateSettings({ advanced: { ...adv, weights: { ...adv.weights, diversity } } })
                  }
                  min={0}
                  max={100}
                />
              </div>

              <ScorePreviewCard weights={adv.weights} />
            </div>
          </SettingsSection>
        </div>
      ),
    },
  ]

  return (
    <div className="container px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Customize your NutriFind experience and preferences</p>
      </div>

      <div className="relative pb-20">
        <SettingsTabs tabs={tabs} defaultTab="general" />
        {/* StickyApplyBar Props don't include hasUnsavedChanges in your codebase */}
        <StickyApplyBar onApply={handleApply} onReset={handleReset} />
      </div>
    </div>
  )
}
