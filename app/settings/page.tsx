"use client"

import { useState } from "react"
import { useSettings } from "@/hooks/use-settings"
import { ALL_CUISINES, ALL_DIETS, ALL_ALLERGENS } from "@/lib/settings"
import { useToast } from "@/hooks/use-toast"
import type { SortOption } from "@/lib/types"
import {
  Settings,
  Sliders,
  Target,
  Shield,
  Bell,
  Sparkles,
  X,
  Plus,
  Check,
  Download,
  RotateCcw,
  Trash2,
  ChevronDown,
} from "lucide-react"

const toNum = (prev: number, v: string) => {
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) ? prev : n
}

/* ─── Reusable sub-components ─── */

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={S.card}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={S.cardTitle}>{title}</h3>
        {desc && <p style={S.cardDesc}>{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={S.fieldLabel}>{children}</label>
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p style={S.fieldHint}>{children}</p>
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...S.input, ...(props.style || {}) }} />
}

function StyledSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={S.select}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#999" }} />
    </div>
  )
}

function PillToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      ...S.pill,
      background: active ? "#99CC33" : "white",
      color: active ? "white" : "#555",
      borderColor: active ? "#99CC33" : "#E0E0E0",
    }}>
      {label}
      {active && <X size={12} style={{ marginLeft: 4 }} />}
    </button>
  )
}

function CustomSlider({ value, min, max, step, onChange, label, hint }: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; label: string; hint?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#99CC33" }}>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: 6, appearance: "none" as const,
          background: `linear-gradient(to right, #99CC33 ${pct}%, #E0E0E0 ${pct}%)`,
          borderRadius: 3, outline: "none", cursor: "pointer",
        }}
      />
      {hint && <p style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

function CustomToggle({ label, hint, checked, onChange }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
      <div>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>{label}</span>
        {hint && <p style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{hint}</p>}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: checked ? "#99CC33" : "#D0D0D0", position: "relative", transition: "background 0.2s",
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: 10, background: "white",
          position: "absolute", top: 2,
          left: checked ? 22 : 2, transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </button>
    </div>
  )
}

function MultiPillSelect({ label, hint, options, value, onChange }: {
  label: string; hint?: string; options: string[]; value: string[];
  onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <FieldLabel>{label}</FieldLabel>
      {hint && <FieldHint>{hint}</FieldHint>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {options.map(opt => (
          <PillToggle key={opt} label={opt} active={value.includes(opt)} onClick={() => toggle(opt)} />
        ))}
      </div>
    </div>
  )
}

function TagInput({ label, hint, value, onChange, placeholder }: {
  label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string
}) {
  const [input, setInput] = useState("")
  const add = () => {
    const t = input.trim().toLowerCase()
    if (t && !value.includes(t)) { onChange([...value, t]); setInput("") }
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <FieldLabel>{label}</FieldLabel>
      {hint && <FieldHint>{hint}</FieldHint>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <StyledInput value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder} style={{ flex: 1 }} />
        <button onClick={add} disabled={!input.trim()} style={{
          ...S.btnIcon, opacity: input.trim() ? 1 : 0.4,
        }}><Plus size={16} /></button>
      </div>
      {value.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {value.map(tag => (
            <span key={tag} style={S.tag}>
              {tag}
              <button onClick={() => onChange(value.filter(t => t !== tag))} style={S.tagRemove}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function RangeSlider({ label, hint, value, min, max, step, onChange }: {
  label: string; hint?: string; value: [number, number]; min: number; max: number; step: number
  onChange: (v: [number, number]) => void
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#99CC33" }}>{value[0]} - {value[1]}</span>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <StyledInput type="number" value={value[0]} min={min} max={value[1]}
          step={step} onChange={e => onChange([Number(e.target.value), value[1]])}
          style={{ width: 70, textAlign: "center" }} />
        <div style={{ flex: 1, height: 4, background: "#E0E0E0", borderRadius: 2, position: "relative" }}>
          <div style={{
            position: "absolute", left: `${((value[0] - min) / (max - min)) * 100}%`,
            right: `${100 - ((value[1] - min) / (max - min)) * 100}%`,
            background: "#99CC33", height: "100%", borderRadius: 2,
          }} />
        </div>
        <StyledInput type="number" value={value[1]} min={value[0]} max={max}
          step={step} onChange={e => onChange([value[0], Number(e.target.value)])}
          style={{ width: 70, textAlign: "center" }} />
      </div>
      {hint && <p style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

function ScorePreview({ weights }: { weights: { health: number; time: number; popularity: number; personal: number; diversity: number } }) {
  const mock = { health: 0.85, time: 0.7, popularity: 0.6, personal: 0.9, diversity: 0.4 }
  const total = weights.health + weights.time + weights.popularity + weights.personal + weights.diversity
  if (total === 0) return null
  const nw = {
    health: weights.health / total, time: weights.time / total,
    popularity: weights.popularity / total, personal: weights.personal / total, diversity: weights.diversity / total,
  }
  const score = nw.health * mock.health + nw.time * mock.time + nw.popularity * mock.popularity +
    nw.personal * mock.personal + nw.diversity * mock.diversity
  const components = [
    { name: "Health", val: mock.health, w: nw.health, color: "#4CAF50" },
    { name: "Time", val: mock.time, w: nw.time, color: "#2196F3" },
    { name: "Popularity", val: mock.popularity, w: nw.popularity, color: "#9C27B0" },
    { name: "Personal", val: mock.personal, w: nw.personal, color: "#FF9800" },
    { name: "Diversity", val: mock.diversity, w: nw.diversity, color: "#E91E63" },
  ]
  return (
    <div style={{ background: "#F8FFF0", borderRadius: 12, padding: 16, border: "1px solid #D0E8B0" }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#1A1A2E" }}>{(score * 100).toFixed(0)}</div>
        <div style={{ fontSize: 12, color: "#999" }}>Score Preview — Mediterranean Quinoa Bowl</div>
      </div>
      {components.map(c => {
        const contrib = c.val * c.w * 100
        return (
          <div key={c.name} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 2 }}>
              <span>{c.name}</span><span>{contrib.toFixed(0)}</span>
            </div>
            <div style={{ height: 4, background: "#E8E8E8", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${contrib}%`, height: "100%", background: c.color, borderRadius: 2 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Main Settings Page ─── */
const DISABLED_TABS = new Set(["recommendation", "advanced"])  // TODO: enable after RAG integration

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "goals", label: "Goals", icon: Target },
  { id: "recommendation", label: "Recommend", icon: Sliders },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "advanced", label: "Advanced", icon: Sparkles },
]

export default function SettingsPage() {
  const { settings, updateSettings, apply, resetToDefaults, downloadJson } = useSettings()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")

  const behavior = settings.behavior ?? {}
  const adv = settings.advanced ?? { weights: { health: 0, time: 0, popularity: 0, personal: 0, diversity: 0 } }
  const caps = settings.caps ?? {}

  const handleApply = async () => {
    try { await apply(); toast({ title: "Settings saved", description: "Your preferences have been saved to your account." }) }
    catch { toast({ title: "Error", description: "Failed to save settings. Please try again.", variant: "destructive" }) }
  }
  const handleReset = async () => {
    try { await resetToDefaults(); toast({ title: "Settings reset", description: "Restored to defaults." }) }
    catch { toast({ title: "Error", description: "Failed to reset settings.", variant: "destructive" }) }
  }
  const handleClear = () => {
    if (typeof window !== "undefined") { localStorage.removeItem("nutri_favorites"); localStorage.removeItem("nutri_history") }
    toast({ title: "Data cleared", description: "Personalization data has been cleared." })
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.heading}>Settings</h1>
          <p style={S.subheading}>Customize your NutriFind experience</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={S.tabBar}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          const disabled = DISABLED_TABS.has(tab.id)
          return (
            <button key={tab.id}
              onClick={() => !disabled && setActiveTab(tab.id)}
              title={disabled ? "Coming soon — requires RAG integration" : tab.label}
              style={{
                ...S.tab,
                background: active ? "#99CC33" : "transparent",
                color: disabled ? "#c0c0c0" : active ? "white" : "#777",
                fontWeight: active ? 600 : 400,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
              }}>
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div style={S.content}>
        {activeTab === "general" && (
          <Card title="General Preferences" desc="Configure your basic preferences for units, cuisines, and cooking time.">
            <div style={{ marginBottom: 20 }}>
              <FieldLabel>Units</FieldLabel>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {(["US", "Metric"] as const).map(u => (
                  <button key={u} onClick={() => updateSettings({ units: u })} style={{
                    ...S.radioBtn,
                    background: settings.units === u ? "#99CC33" : "white",
                    color: settings.units === u ? "white" : "#555",
                    borderColor: settings.units === u ? "#99CC33" : "#E0E0E0",
                  }}>
                    {settings.units === u && <Check size={14} style={{ marginRight: 4 }} />}
                    {u === "US" ? "US (Imperial)" : "Metric"}
                  </button>
                ))}
              </div>
            </div>

            <MultiPillSelect label="Preferred Cuisines" hint="Select cuisines you enjoy most"
              options={ALL_CUISINES} value={settings.cuisines}
              onChange={cuisines => updateSettings({ cuisines })} />

            <TagInput label="Disliked Ingredients" hint="Add ingredients you want to avoid"
              value={settings.dislikes} onChange={dislikes => updateSettings({ dislikes })}
              placeholder="e.g., mushrooms, cilantro" />

            <RangeSlider label="Default Time Range" hint="Preferred cooking time range in minutes"
              value={settings.timeRangeMinMax} min={0} max={120} step={5}
              onChange={timeRangeMinMax => updateSettings({ timeRangeMinMax })} />
          </Card>
        )}

        {activeTab === "goals" && (
          <Card title="Goals & Targets" desc="Set your health goals and nutritional targets. These are saved to your health profile.">
            <div style={{ marginBottom: 20 }}>
              <FieldLabel>Health Goal</FieldLabel>
              <StyledSelect value={settings.healthGoal ?? ""}
                onChange={(v: string) => updateSettings({ healthGoal: v || null } as any)}
                options={[
                  { value: "", label: "Select a goal..." },
                  { value: "lose_weight", label: "Lose Weight" },
                  { value: "gain_muscle", label: "Build Muscle" },
                  { value: "maintain", label: "Maintain Weight" },
                  { value: "improve_energy", label: "Improve Energy" },
                  { value: "heart_health", label: "Heart Health" },
                  { value: "general_wellness", label: "General Wellness" },
                ]} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <FieldLabel>Target Weight (kg)</FieldLabel>
                <StyledInput type="number" min={30} max={300} step={0.1}
                  value={String(settings.targetWeightKg ?? "")}
                  onChange={e => updateSettings({ targetWeightKg: Number.parseFloat(e.target.value) || undefined } as any)}
                  placeholder="e.g. 70" style={{ marginTop: 6 }} />
              </div>
              <div>
                <FieldLabel>Daily Calorie Target</FieldLabel>
                <StyledInput type="number" min={1000} max={5000}
                  value={String(settings.calorieTarget ?? "")}
                  onChange={e => updateSettings({ calorieTarget: Number.parseInt(e.target.value) || undefined })}
                  placeholder="2000" style={{ marginTop: 6 }} />
              </div>
            </div>

            <FieldLabel>Macro Targets (g)</FieldLabel>
            <div style={{ marginTop: 8 }}>
              <CustomSlider label="Protein (g)" value={settings.macroWeights.protein} min={0} max={300} step={1}
                onChange={protein => updateSettings({ macroWeights: { ...settings.macroWeights, protein } })} />
              <CustomSlider label="Carbs (g)" value={settings.macroWeights.carbs} min={0} max={500} step={1}
                onChange={carbs => updateSettings({ macroWeights: { ...settings.macroWeights, carbs } })} />
              <CustomSlider label="Fat (g)" value={settings.macroWeights.fat} min={0} max={200} step={1}
                onChange={fat => updateSettings({ macroWeights: { ...settings.macroWeights, fat } })} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 8 }}>
              <div>
                <FieldLabel>Fiber Target (g)</FieldLabel>
                <StyledInput type="number" min={0} max={100}
                  value={String(settings.targetFiberG ?? "")}
                  onChange={e => updateSettings({ targetFiberG: Number.parseFloat(e.target.value) || undefined } as any)}
                  placeholder="25" style={{ marginTop: 6 }} />
              </div>
              <div>
                <FieldLabel>Sodium Max (mg)</FieldLabel>
                <StyledInput type="number" min={0} max={10000}
                  value={String(caps.sodiumMax ?? "")}
                  onChange={e => updateSettings({ caps: { ...settings.caps, sodiumMax: toNum(settings.caps.sodiumMax, e.target.value) } })}
                  placeholder="2300" style={{ marginTop: 6 }} />
              </div>
              <div>
                <FieldLabel>Sugar Max (g)</FieldLabel>
                <StyledInput type="number" min={0} max={200}
                  value={String(caps.addedSugarMax ?? "")}
                  onChange={e => updateSettings({ caps: { ...settings.caps, addedSugarMax: toNum(settings.caps.addedSugarMax, e.target.value) } })}
                  placeholder="50" style={{ marginTop: 6 }} />
              </div>
            </div>
          </Card>
        )}

        {activeTab === "recommendation" && (
          <Card title="Recommendation Behavior" desc="Fine-tune how recipes are recommended and ranked for you.">
            <CustomSlider label="Explore ↔ Exploit"
              hint="Balance between trying new recipes vs. sticking to favorites"
              value={Math.round((behavior.exploration ?? 0) * 100)} min={0} max={100} step={1}
              onChange={pct => updateSettings({ behavior: { ...behavior, exploration: pct / 100 } })} />

            <CustomSlider label="Diversity" hint="How much variety you want in recommendations"
              value={adv.weights.diversity ?? 0} min={0} max={100} step={1}
              onChange={diversity => updateSettings({ advanced: { ...adv, weights: { ...adv.weights, diversity } } })} />

            <CustomSlider label="Health Emphasis" hint="Prioritize healthier recipes"
              value={adv.weights.health ?? 0} min={0} max={100} step={1}
              onChange={health => updateSettings({ advanced: { ...adv, weights: { ...adv.weights, health } } })} />

            <CustomSlider label="Personalization Weight" hint="How much your history influences recommendations"
              value={adv.weights.personal ?? 0} min={0} max={100} step={1}
              onChange={personal => updateSettings({ advanced: { ...adv, weights: { ...adv.weights, personal } } })} />

            <div style={{ marginBottom: 16 }}>
              <FieldLabel>Default Sort</FieldLabel>
              <StyledSelect value={behavior.defaultSort ?? "time"}
                onChange={(v: string) => updateSettings({ behavior: { ...behavior, defaultSort: v as SortOption } })}
                options={[
                  { value: "time", label: "Time" },
                  { value: "relevance", label: "Relevance" },
                  { value: "popular", label: "Popularity" },
                ]} />
            </div>

            <CustomToggle label="Show Score Badge" hint="Display recommendation scores on recipe cards"
              checked={!!behavior.showScoreBadge}
              onChange={showScoreBadge => updateSettings({ behavior: { ...behavior, showScoreBadge } })} />
          </Card>
        )}

        {activeTab === "privacy" && (
          <Card title="Data & Privacy" desc="Control how your data is used for personalization.">
            <FieldLabel>Data Management</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <button onClick={handleClear} style={S.actionBtn}>
                <Trash2 size={14} /> Clear Personalization Data
              </button>
              <button onClick={downloadJson} style={S.actionBtn}>
                <Download size={14} /> Download Settings JSON
              </button>
              <button onClick={handleReset} style={S.actionBtn}>
                <RotateCcw size={14} /> Reset All Settings
              </button>
            </div>
          </Card>
        )}

        {activeTab === "notifications" && (
          <Card title="Notifications" desc="Configure when and how you'd like to be notified.">
            <CustomToggle label="Enable Reminders" hint="Turn on simple UI reminders"
              checked={!!settings.notifications?.enableReminders}
              onChange={enableReminders => updateSettings({ notifications: { ...(settings.notifications ?? {}), enableReminders } })} />
          </Card>
        )}

        {activeTab === "advanced" && (
          <Card title="Advanced Settings" desc="Fine-tune the recommendation weights and view live scoring.">
            <FieldLabel>Rerank Weights (0–100)</FieldLabel>
            <div style={{ marginTop: 8 }}>
              <CustomSlider label="Health (Wh)" value={adv.weights.health ?? 0} min={0} max={100} step={1}
                onChange={health => updateSettings({ advanced: { ...adv, weights: { ...adv.weights, health } } })} />
              <CustomSlider label="Time (Wt)" value={adv.weights.time ?? 0} min={0} max={100} step={1}
                onChange={time => updateSettings({ advanced: { ...adv, weights: { ...adv.weights, time } } })} />
              <CustomSlider label="Popularity (Wp)" value={adv.weights.popularity ?? 0} min={0} max={100} step={1}
                onChange={popularity => updateSettings({ advanced: { ...adv, weights: { ...adv.weights, popularity } } })} />
              <CustomSlider label="Personal (Wr)" value={adv.weights.personal ?? 0} min={0} max={100} step={1}
                onChange={personal => updateSettings({ advanced: { ...adv, weights: { ...adv.weights, personal } } })} />
              <CustomSlider label="Diversity (Wd)" value={adv.weights.diversity ?? 0} min={0} max={100} step={1}
                onChange={diversity => updateSettings({ advanced: { ...adv, weights: { ...adv.weights, diversity } } })} />
            </div>
            <ScorePreview weights={adv.weights} />
          </Card>
        )}
      </div>

      {/* Sticky Apply Bar */}
      <div className="settings-sticky-bar">
        <div className="settings-sticky-inner">
          <button onClick={handleApply} className="settings-apply-btn">
            <Check size={16} /> Apply Changes
          </button>
          <button onClick={handleReset} className="settings-reset-btn">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: #99CC33; border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2); cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #99CC33; border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2); cursor: pointer;
        }
        .settings-sticky-bar {
          position: fixed; bottom: 72px; left: 0; right: 0;
          padding: 12px 16px;
          background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, #FFFFFF 100%);
          border-top: 1px solid #E8E8E8;
          box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
          z-index: 45;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .settings-sticky-inner {
          display: flex; gap: 10px;
          max-width: 780px; margin: 0 auto;
        }
        .settings-apply-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 14px 24px; border-radius: 14px;
          border: none; background: linear-gradient(135deg, #99CC33, #7AB820);
          color: white; font-size: 15px; font-weight: 600;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 2px 8px rgba(153, 204, 51, 0.3);
          transition: all 0.2s;
        }
        .settings-apply-btn:hover {
          background: linear-gradient(135deg, #88BB22, #6BA710);
          box-shadow: 0 4px 12px rgba(153, 204, 51, 0.4);
          transform: translateY(-1px);
        }
        .settings-reset-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 14px 20px; border-radius: 14px;
          border: 1.5px solid #E0E0E0; background: white; color: #666;
          font-size: 14px; font-weight: 500; cursor: pointer;
          font-family: inherit; transition: all 0.2s;
        }
        .settings-reset-btn:hover {
          border-color: #CCC; background: #F8F8F8;
        }
        @media (min-width: 1024px) {
          .settings-sticky-bar {
            bottom: 0;
            left: 256px;
            padding: 14px 32px;
          }
          .settings-sticky-inner {
            max-width: 480px;
          }
          .settings-apply-btn {
            flex: unset;
            padding: 12px 32px;
            font-size: 14px;
          }
          .settings-reset-btn {
            padding: 12px 20px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  )
}

/* ─── Style constants ─── */
const S: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 780, margin: "0 auto", padding: "0 16px 180px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    padding: "24px 0 16px",
  },
  heading: {
    margin: 0, fontSize: 26, fontWeight: 700, color: "#1A1A2E",
  },
  subheading: {
    margin: "4px 0 0", fontSize: 14, color: "#64748B",
  },
  tabBar: {
    display: "flex", gap: 4, background: "#F0F0F0", padding: 4, borderRadius: 14,
    marginBottom: 20, overflowX: "auto" as const,
  },
  tab: {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
    borderRadius: 10, border: "none", fontSize: 13, cursor: "pointer",
    fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  content: {},
  card: {
    background: "white", borderRadius: 16, padding: 24,
    border: "1px solid #F0F0F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  cardTitle: {
    margin: 0, fontSize: 17, fontWeight: 600, color: "#1A1A2E",
  },
  cardDesc: {
    margin: "4px 0 0", fontSize: 13, color: "#999",
  },
  fieldLabel: {
    display: "block", fontSize: 13, fontWeight: 600, color: "#555",
  },
  fieldHint: {
    fontSize: 12, color: "#999", margin: "2px 0 0",
  },
  input: {
    padding: "10px 14px", borderRadius: 10,
    border: "1px solid #E0E0E0", fontSize: 14,
    fontFamily: "inherit", color: "#333", background: "#FAFAFA",
    outline: "none", width: "100%", boxSizing: "border-box" as const,
  },
  select: {
    padding: "10px 32px 10px 14px", borderRadius: 10,
    border: "1px solid #E0E0E0", fontSize: 14,
    fontFamily: "inherit", color: "#333", background: "#FAFAFA",
    appearance: "none" as const, outline: "none", width: "100%",
    cursor: "pointer",
  },
  pill: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "6px 14px", borderRadius: 20,
    border: "1px solid", fontSize: 13, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
  },
  radioBtn: {
    display: "inline-flex", alignItems: "center",
    padding: "8px 18px", borderRadius: 10,
    border: "1px solid", fontSize: 13, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
  },
  tag: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "4px 12px", borderRadius: 16,
    background: "#99CC33", color: "white", fontSize: 13, fontWeight: 500,
  },
  tagRemove: {
    background: "none", border: "none", color: "white",
    cursor: "pointer", fontSize: 14, fontWeight: 700,
    padding: 0, marginLeft: 2, lineHeight: 1,
  },
  btnIcon: {
    width: 40, height: 40, borderRadius: 10,
    border: "1px solid #E0E0E0", background: "white",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "#555", flexShrink: 0,
  },
  actionBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "10px 16px", borderRadius: 10,
    border: "1px solid #E0E0E0", background: "white",
    color: "#555", fontSize: 13, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
  },
  stickyBar: {},
  applyBtn: {},
  resetBtn: {},
}
