"use client"
import * as React from "react"
import { X, ChevronDown } from "lucide-react"
import { searchIngredients } from "@/lib/api"
import type { IngredientSearchResult } from "@/lib/api"

/** Nutrition per 100g – attached when user selects from autocomplete */
export type NutritionPer100g = {
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  sodium_mg: number | null
  saturated_fat_g: number | null
}

export type IngredientRow = {
  id: string
  qty: number | ""
  unit: string
  item: string
  note?: string
  /** Set when user selects from autocomplete dropdown */
  nutritionPer100g?: NutritionPer100g
}

const UNITS = ["", "g", "kg", "mg", "ml", "l", "tsp", "tbsp", "cup", "oz", "lb", "pcs", "pinch"]

export default function IngredientRowCmp({
  row,
  onChange,
  onRemove,
}: {
  row: IngredientRow
  onChange: (next: IngredientRow) => void
  onRemove: () => void
}) {
  const [suggestions, setSuggestions] = React.useState<IngredientSearchResult[]>([])
  const [showDropdown, setShowDropdown] = React.useState(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latestQueryRef = React.useRef("")
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function handleNameChange(value: string) {
    latestQueryRef.current = value
    // Clear nutrition if user edits the name manually (no longer matched)
    onChange({ ...row, item: value, nutritionPer100g: undefined })

    // Debounced search
    clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    if (trimmed.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        // Skip if query has changed since this timeout was scheduled
        if (latestQueryRef.current.trim() !== trimmed) return
        try {
          const results = await searchIngredients(trimmed, 6)
          setSuggestions(results)
          setShowDropdown(results.length > 0)
        } catch {
          setSuggestions([])
          setShowDropdown(false)
        }
      }, 300)
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }

  function handleSelect(ing: IngredientSearchResult) {
    // Attach nutrition data directly to the ingredient row
    onChange({
      ...row,
      item: ing.name,
      nutritionPer100g: {
        calories: ing.calories,
        protein_g: ing.protein_g,
        carbs_g: ing.total_carbs_g,
        fat_g: ing.total_fat_g,
        fiber_g: ing.dietary_fiber_g,
        sodium_mg: ing.sodium_mg,
        saturated_fat_g: ing.saturated_fat_g,
      },
    })
    setShowDropdown(false)
    setSuggestions([])
  }

  return (
    <div className="ing-row" ref={wrapperRef}>
      <style>{ingredientRowCSS}</style>
      {/* Qty */}
      <input
        className="ing-qty"
        type="number"
        min={0}
        step="0.1"
        value={row.qty}
        onChange={(e) =>
          onChange({ ...row, qty: e.target.value === "" ? "" : Number(e.target.value) })
        }
        placeholder="Qty"
      />
      {/* Unit */}
      <div className="ing-unit-wrap">
        <select
          className="ing-unit"
          value={row.unit}
          onChange={(e) => onChange({ ...row, unit: e.target.value })}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u || "Unit"}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="ing-unit-icon" />
      </div>
      {/* Ingredient name with autocomplete */}
      <div className="ing-name-wrap">
        <input
          className="ing-name"
          value={row.item}
          onChange={(e) => handleNameChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true)
          }}
          placeholder="Ingredient name"
        />
        {/* Green dot indicator when nutrition is attached */}
        {row.nutritionPer100g && (
          <span className="ing-nutrition-dot" title="Nutrition data attached" />
        )}
        {showDropdown && suggestions.length > 0 && (
          <div className="ing-dropdown">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="ing-dropdown-item"
                onClick={() => handleSelect(s)}
              >
                <span className="ing-dropdown-name">{s.name}</span>
                <span className="ing-dropdown-cal">
                  {s.calories ? `${Math.round(s.calories)} kcal/100g` : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Remove */}
      <button type="button" className="ing-remove" onClick={onRemove}>
        <X size={14} />
      </button>
    </div>
  )
}

const ingredientRowCSS = `
  .ing-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ing-qty {
    width: 64px; height: 40px; border-radius: 9999px;
    border: 1px solid #E2E8F0; background: #FFFFFF;
    padding: 0 10px; font-size: 14px; text-align: center;
    color: #0F172A; outline: none; flex-shrink: 0;
    font-family: 'Inter', sans-serif;
  }
  .ing-qty:focus { border-color: #99CC33; box-shadow: 0 0 0 2px rgba(153,204,51,0.2); }
  .ing-qty::placeholder { color: #94A3B8; }
  .ing-unit-wrap {
    position: relative; flex-shrink: 0;
  }
  .ing-unit {
    width: 76px; height: 40px; border-radius: 9999px;
    border: 1px solid #E2E8F0; background: #FFFFFF;
    padding: 0 24px 0 10px; font-size: 14px;
    color: #0F172A; appearance: none; outline: none; cursor: pointer;
    font-family: 'Inter', sans-serif;
  }
  .ing-unit:focus { border-color: #99CC33; }
  .ing-unit-icon {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    pointer-events: none; color: #94A3B8;
  }
  .ing-name-wrap {
    flex: 1; position: relative; min-width: 0;
  }
  .ing-name {
    width: 100%; height: 40px; border-radius: 9999px;
    border: 1px solid #E2E8F0; background: #FFFFFF;
    padding: 0 14px; font-size: 14px;
    color: #0F172A; outline: none;
    font-family: 'Inter', sans-serif;
  }
  .ing-name:focus { border-color: #99CC33; box-shadow: 0 0 0 2px rgba(153,204,51,0.2); }
  .ing-name::placeholder { color: #94A3B8; }
  .ing-nutrition-dot {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    width: 8px; height: 8px; border-radius: 50%;
    background: #99CC33; pointer-events: none;
  }
  .ing-dropdown {
    position: absolute; top: 44px; left: 0; right: 0;
    background: #FFFFFF; border: 1px solid #E2E8F0;
    border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    z-index: 50; overflow: hidden;
  }
  .ing-dropdown-item {
    display: flex; justify-content: space-between; align-items: center;
    width: 100%; padding: 10px 14px; border: none;
    background: none; cursor: pointer; text-align: left;
    font-family: 'Inter', sans-serif;
    transition: background 0.1s;
  }
  .ing-dropdown-item:hover { background: #F0F7E6; }
  .ing-dropdown-name {
    font-size: 14px; color: #0F172A; font-weight: 500;
  }
  .ing-dropdown-cal {
    font-size: 12px; color: #94A3B8;
  }
  .ing-remove {
    width: 28px; height: 28px; border-radius: 50%; border: none;
    background: #FEE2E2; color: #EF4444; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.15s;
  }
  .ing-remove:hover { background: #FCA5A5; }
`
