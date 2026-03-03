"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ImageIcon,
  Plus,
  CirclePlus,
  X,
  Clock,
  Utensils,
  ListOrdered,
  Flame,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  LinkIcon,
} from "lucide-react";
import IngredientRowCmp, { type IngredientRow, type NutritionPer100g } from "./row";
import { DIETS, ALLERGENS } from "@/lib/taxonomy";
import { uploadRecipeImage, fetchRecipeMeta, detectAllergens } from "@/lib/api";
import type { UserRecipe, RecipeMeta } from "@/lib/api";

/* ─── helpers ──────────────────────────────────────────────────────── */

const genId = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
const toZero = (v: number | "") => (v === "" ? 0 : Number(v) || 0);

/**
 * Convert qty + unit → grams for nutrition scaling.
 * Weight units convert directly to grams.
 * Volume units convert to ml then assume ~1 g/ml (water density — approximate for most ingredients).
 * Count/cooking units use rough gram equivalents from the unit_conversions table.
 */
const UNIT_TO_GRAMS: Record<string, number> = {
  // weight → exact
  g: 1,
  kg: 1000,
  mg: 0.001,
  lb: 453.5924,
  oz: 28.3495,
  // volume → ml (assume density ~1 g/ml for approximate conversion)
  ml: 1,
  l: 1000,
  cup: 236.588,
  tbsp: 14.787,
  tsp: 4.929,
  // count/cooking → approx grams
  pcs: 100,    // generic piece ≈ 100g (reasonable default)
  pinch: 0.5,
};

/* ─── types ────────────────────────────────────────────────────────── */

type RecipePreview = {
  title: string;
  imageUrl: string | null;
  cuisine: string | null;
  course: string | null;
  difficulty: string | null;
  servings: number;
  time: { prepMin: number; cookMin: number };
  tags: { diets: string[]; allergens: string[] };
  ingredients: Array<{ qty: number | ""; unit: string | null; item: string }>;
  steps: string[];
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sodium_mg: number;
    saturated_fat_g: number;
  };
};

export type RecipeSubmitDraft = {
  title: string;
  description: string | null;
  image_url: string | null;
  servings: number;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  cuisines: string[];
  meal_type: string | null;
  difficulty: string | null;
  diet_tags: string[];
  allergens: string[];
  ingredients: Array<{
    qty: number | "";
    unit: string | null;
    item: string;
    note: string | null;
  }>;
  instructions: Array<{ order: number; text: string }>;
  notes: null;
  visibility: "private";
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
};

/* ─── form initial ─────────────────────────────────────────────────── */

type IngredientInitial = {
  qty?: number | string | null | undefined;
  unit?: string | null | undefined;
  item?: string | null | undefined;
  name?: string | null | undefined;
  note?: string | null | undefined;
};

export type RecipeFormInitial = Partial<{
  title: string | null;
  description: string | null;
  image_url: string | null;
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  cuisine: string | null;
  meal_type: string | null;
  difficulty: string | null;
  cuisines: string[] | null;
  diet_tags: string[] | null;
  allergens: string[] | null;
  ingredients: IngredientInitial[] | null;
  instructions: { text: string | null }[] | string[] | null;
  notes: string | null;
  visibility: "private" | "public" | "unlisted" | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  saturated_fat_g: number | null;
}>;

/* ─── CSS variables for the design tokens ──────────────────────────── */

const tokens = {
  bg: "#F7F8F6",
  primary: "#99CC33",
  primaryDark: "#538100",
  primaryGlow: "rgba(153,204,51,0.5)",
  primaryTrack: "rgba(153,204,51,0.2)",
  white: "#FFFFFF",
  inputBorder: "#E2E8F0",
  label: "#334155",
  placeholder: "#94A3B8",
  heading: "#0F172A",
  muted: "#475569",
  mutedBg: "#F1F5F9",
  danger: "#EF4444",
  amber: "#F59E0B",
  amberBg: "rgba(245,158,11,0.2)",
};

/* ─── styled input components ──────────────────────────────────────── */

function PillInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, ...rest } = props;
  return (
    <div className="recipe-field">
      {label && <label className="recipe-label">{label}</label>}
      <input className="recipe-input" {...rest} />
    </div>
  );
}

function PillTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, ...rest } = props;
  return (
    <div className="recipe-field">
      {label && <label className="recipe-label">{label}</label>}
      <textarea className="recipe-textarea" {...rest} />
    </div>
  );
}

function PillSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    options: { value: string; label: string }[];
  }
) {
  const { label, options, ...rest } = props;
  return (
    <div className="recipe-field">
      {label && <label className="recipe-label">{label}</label>}
      <div className="recipe-select-wrap">
        <select className="recipe-select" {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="recipe-select-icon" size={16} />
      </div>
    </div>
  );
}

/* ─── progress bar ─────────────────────────────────────────────────── */

const STEP_LABELS = ["Basics", "Servings, Ingredients & Prep", "Nutrition & Review"];

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / 3) * 100);
  return (
    <div className="recipe-progress">
      <div className="recipe-progress-header">
        <span className="recipe-progress-label">
          Step {step} <span style={{ textTransform: "lowercase" }}>of</span> 3:{" "}
          {STEP_LABELS[step - 1]}
        </span>
        <span className="recipe-progress-pct">{pct}%</span>
      </div>
      <div className="recipe-progress-track">
        <div
          className="recipe-progress-bar"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── main form ────────────────────────────────────────────────────── */

export default function RecipeCreateForm({
  initial,
  onSubmit,
  busy = false,
}: {
  initial?: RecipeFormInitial;
  onSubmit: (draft: Partial<UserRecipe>) => void | Promise<void>;
  busy?: boolean;
}) {
  const router = useRouter();

  /* ── wizard step ── */
  const [step, setStep] = React.useState(1);
  const [mode, setMode] = React.useState<"form" | "success">("form");
  const [savedDraft, setSavedDraft] = React.useState<RecipeSubmitDraft | null>(null);

  /* ── form state ── */
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = React.useState(initial?.image_url ?? "");
  const [uploading, setUploading] = React.useState(false);
  const [servings, setServings] = React.useState(initial?.servings ?? 2);
  const [prepMin, setPrepMin] = React.useState(initial?.prep_time_minutes ?? 10);
  const [cookMin, setCookMin] = React.useState(initial?.cook_time_minutes ?? 10);
  const [cuisine, setCuisine] = React.useState(initial?.cuisine ?? "");
  const [course, setCourse] = React.useState(initial?.meal_type ?? "");
  const [difficulty, setDifficulty] = React.useState(initial?.difficulty ?? "easy");
  const [diets, setDiets] = React.useState<string[]>(initial?.diet_tags ?? []);
  const [allergenList, setAllergenList] = React.useState<string[]>(initial?.allergens ?? []);

  const seedIngredients: IngredientRow[] =
    Array.isArray(initial?.ingredients) && initial.ingredients.length
      ? initial.ingredients.map((r) => ({
        id: genId(),
        qty: r?.qty === "" || r?.qty == null ? "" : Number.isFinite(Number(r.qty)) ? Number(r.qty) : "",
        unit: r?.unit ?? "",
        item: r?.item ?? r?.name ?? "",
        note: r?.note ?? "",
      }))
      : [{ id: genId(), qty: "", unit: "", item: "" }];

  const [ingredients, setIngredients] = React.useState<IngredientRow[]>(seedIngredients);
  const [steps, setSteps] = React.useState<string[]>(
    Array.isArray(initial?.instructions)
      ? initial.instructions.map((x) => (typeof x === "string" ? x : x?.text ?? ""))
      : [""]
  );

  /* ── nutrition ── */
  const [calories, setCalories] = React.useState<number | "">(initial?.calories ?? "");
  const [protein, setProtein] = React.useState<number | "">(initial?.protein_g ?? "");
  const [carbs, setCarbs] = React.useState<number | "">(initial?.carbs_g ?? "");
  const [fat, setFat] = React.useState<number | "">(initial?.fat_g ?? "");
  const [fiber, setFiber] = React.useState<number | "">(initial?.fiber_g ?? "");
  const [sodium, setSodium] = React.useState<number | "">(initial?.sodium_mg ?? "");
  const [satFat, setSatFat] = React.useState<number | "">(initial?.saturated_fat_g ?? "");

  /* ── review accordion ── */
  const [reviewOpen, setReviewOpen] = React.useState(false);

  /* ── recipe meta (dropdowns from gold tables) ── */
  const [recipeMeta, setRecipeMeta] = React.useState<RecipeMeta | null>(null);
  const [showAllDiets, setShowAllDiets] = React.useState(false);
  const [showAllAllergens, setShowAllAllergens] = React.useState(false);
  const [detectedAllergenCodes, setDetectedAllergenCodes] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetchRecipeMeta()
      .then(setRecipeMeta)
      .catch((err) => console.warn("Failed to fetch recipe meta:", err));
  }, []);

  /**
   * Auto-calculate nutrition when transitioning Step 2 → Step 3.
   * For each ingredient with nutritionPer100g data:
   *   1. Convert qty + unit → grams using UNIT_TO_GRAMS
   *   2. Scale: value_per_100g × (grams / 100)
   * Sum across all ingredients, then divide by servings.
   */
  function calculateNutrition() {
    let totalCal = 0,
      totalProtein = 0,
      totalCarbs = 0,
      totalFat = 0,
      totalFiber = 0,
      totalSodium = 0,
      totalSatFat = 0;

    for (const row of ingredients) {
      if (!row.nutritionPer100g) continue;
      const qty = typeof row.qty === "number" ? row.qty : 0;
      if (qty <= 0) continue;

      const unitStr = (row.unit ?? "").trim().toLowerCase();
      if (!unitStr && !(unitStr in UNIT_TO_GRAMS)) continue; // skip rows with no unit
      const factor = UNIT_TO_GRAMS[unitStr] ?? 100;
      const grams = qty * factor;
      const scale = grams / 100; // nutrition is per 100g

      const n = row.nutritionPer100g;
      totalCal += (n.calories ?? 0) * scale;
      totalProtein += (n.protein_g ?? 0) * scale;
      totalCarbs += (n.carbs_g ?? 0) * scale;
      totalFat += (n.fat_g ?? 0) * scale;
      totalFiber += (n.fiber_g ?? 0) * scale;
      totalSodium += (n.sodium_mg ?? 0) * scale;
      totalSatFat += (n.saturated_fat_g ?? 0) * scale;
    }

    // Divide by servings for per-serving values
    const srv = Math.max(1, Number(servings) || 1);
    setCalories(Math.round(totalCal / srv));
    setProtein(Math.round((totalProtein / srv) * 10) / 10);
    setCarbs(Math.round((totalCarbs / srv) * 10) / 10);
    setFat(Math.round((totalFat / srv) * 10) / 10);
    setFiber(Math.round((totalFiber / srv) * 10) / 10);
    setSodium(Math.round(totalSodium / srv));
    setSatFat(Math.round((totalSatFat / srv) * 10) / 10);
  }

  /** Advance to next step; auto-calculate nutrition on Step 2 → 3 */
  async function handleNextStep() {
    if (step === 2) {
      calculateNutrition();
      // Auto-detect allergens from ingredients
      const names = ingredients.map((r) => r.item).filter((n) => n && n.trim().length > 0) as string[];
      if (names.length > 0) {
        try {
          const detected = await detectAllergens(names);
          const codes = new Set(detected.map((d) => d.code));
          setDetectedAllergenCodes(codes);
          // Auto-select detected allergens
          setAllergenList((prev) => {
            const merged = new Set(prev);
            codes.forEach((c) => merged.add(c));
            return Array.from(merged);
          });
        } catch (err) {
          console.warn("Allergen detection failed:", err);
        }
      }
    }
    setStep(step + 1);
  }

  /* ── helpers ── */
  const toNumberOrNull = (v: unknown): number | null => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  function normalizeIngredients(rows: IngredientRow[]): RecipeSubmitDraft["ingredients"] {
    return rows
      .filter((r) => (r.item ?? "").toString().trim().length > 0)
      .map((r) => ({
        qty: r.qty === "" ? "" : Number(r.qty ?? "") || "",
        unit: (r.unit ?? "").trim() || null,
        item: (r.item ?? "").trim(),
        note: r.note?.trim() ? r.note.trim() : null,
      }));
  }

  function normalizeSteps(src: string[] | { text: string }[]): RecipeSubmitDraft["instructions"] {
    if (!Array.isArray(src)) return [];
    return src.map((s, i) =>
      typeof s === "string" ? { order: i + 1, text: s } : { order: i + 1, text: s.text ?? "" }
    );
  }

  function buildDraft(): RecipeSubmitDraft {
    return {
      title: title.trim(),
      description: description?.trim() || null,
      image_url: imageUrl?.trim() || null,
      servings: toNumberOrNull(servings) ?? 1,
      prep_time_minutes: toNumberOrNull(prepMin) ?? 0,
      cook_time_minutes: toNumberOrNull(cookMin) ?? 0,
      total_time_minutes: (toNumberOrNull(prepMin) ?? 0) + (toNumberOrNull(cookMin) ?? 0),
      cuisines: cuisine?.trim() ? [cuisine.trim()] : [],
      meal_type: course?.trim() || null,
      difficulty: difficulty || null,
      diet_tags: diets ?? [],
      allergens: allergenList ?? [],
      ingredients: normalizeIngredients(ingredients),
      instructions: normalizeSteps(steps),
      notes: null,
      visibility: "private",
      calories: toZero(calories),
      protein_g: toZero(protein),
      carbs_g: toZero(carbs),
      fat_g: toZero(fat),
      fiber_g: toZero(fiber),
      sodium_mg: toZero(sodium),
      saturated_fat_g: toZero(satFat),
    };
  }

  async function handleSave() {
    const draft = buildDraft();
    setSavedDraft(draft);
    await onSubmit(draft as unknown as Partial<UserRecipe>);
    setMode("success");
  }

  /* ── image upload handler ── */
  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const result = await uploadRecipeImage(file);
      setImageUrl(result.url);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* ── drag-drop ── */
  const [dragOver, setDragOver] = React.useState(false);
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleImageUpload(file);
  }

  /* ─── SUCCESS PAGE ──────────────────────────────────────────────── */

  if (mode === "success" && savedDraft) {
    const totalMins = savedDraft.prep_time_minutes + savedDraft.cook_time_minutes;
    return (
      <div className="recipe-success">
        <style>{recipeFormCSS}</style>
        <h1 className="recipe-success-title">
          Recipe Added
          <br />
          Successfully!
        </h1>
        <div className="recipe-success-check">
          <CheckCircle2 size={64} color={tokens.primary} strokeWidth={1.5} />
        </div>
        <div className="recipe-success-card">
          {savedDraft.image_url && (
            <div className="recipe-success-card-img">
              <Image
                src={savedDraft.image_url}
                alt={savedDraft.title}
                width={360}
                height={200}
                className="recipe-success-card-photo"
              />
              <div className="recipe-success-badges">
                {totalMins > 0 && (
                  <span className="recipe-success-badge">
                    <Clock size={12} /> {totalMins} mins
                  </span>
                )}
                <span className="recipe-success-badge">
                  <Utensils size={12} /> {savedDraft.servings} servings
                </span>
              </div>
            </div>
          )}
          <div className="recipe-success-card-body">
            <h3 className="recipe-success-card-title">{savedDraft.title}</h3>
            {savedDraft.description && (
              <p className="recipe-success-card-desc">{savedDraft.description}</p>
            )}
            <div className="recipe-success-card-footer">
              <div className="recipe-success-tags">
                {savedDraft.diet_tags?.map((d) => (
                  <span key={d} className="recipe-success-tag">
                    {d.replace("_", " ").toUpperCase()}
                  </span>
                ))}
              </div>
              <span className="recipe-success-added">Added to your log and suggestions</span>
            </div>
          </div>
        </div>
        <button
          className="recipe-btn-primary recipe-btn-full"
          onClick={() => router.push("/my-recipes")}
        >
          Back to Recipes
        </button>
        <button
          className="recipe-btn-muted recipe-btn-full"
          onClick={() => router.push("/meal-plan")}
        >
          View in Meal Plan
        </button>
      </div>
    );
  }

  /* ─── STEP 1: BASICS ────────────────────────────────────────────── */

  function renderStep1() {
    return (
      <div className="recipe-step-content">
        <PillInput
          label="Recipe Title"
          placeholder="e.g. Zesty Lemon Pasta"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <PillTextarea
          label="Short Description"
          placeholder="A brief overview of your dish..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="recipe-field">
          <label className="recipe-label">Cover Image</label>
          <div className="recipe-image-url-row">
            <LinkIcon size={16} className="recipe-image-url-icon" />
            <input
              className="recipe-input recipe-input-with-icon"
              placeholder="URL : https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <span className="recipe-or-text">Or</span>

          {/* Drag-drop zone */}
          <div
            className={`recipe-dropzone ${dragOver ? "recipe-dropzone-active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="recipe-dropzone-spinner" />
            ) : imageUrl ? (
              <div className="recipe-dropzone-preview">
                <Image
                  src={imageUrl}
                  alt="Cover"
                  width={120}
                  height={80}
                  className="recipe-dropzone-thumb"
                  unoptimized
                />
                <span className="recipe-dropzone-change">Click or drag to change</span>
              </div>
            ) : (
              <>
                <ImageIcon size={28} color={tokens.primaryDark} />
                <span className="recipe-dropzone-label">
                  Drag & drop an image, or click to browse
                </span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="recipe-file-hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
              }}
            />
          </div>

          <div className="recipe-image-buttons">
            <button
              type="button"
              className="recipe-image-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={16} />
              <span>Take a Photo</span>
            </button>
            <button
              type="button"
              className="recipe-image-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={16} />
              <span>
                Choose from
                <br />
                Gallery
              </span>
            </button>
          </div>
        </div>

        <div className="recipe-row-2">
          {recipeMeta ? (
            <PillSelect
              label="Cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              options={[
                { value: "", label: "Select cuisine" },
                ...recipeMeta.cuisines.map((c) => ({ value: c.name, label: c.name })),
              ]}
            />
          ) : (
            <PillInput
              label="Cuisine"
              placeholder="Loading..."
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
            />
          )}
          {recipeMeta ? (
            <PillSelect
              label="Course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              options={[
                { value: "", label: "Select course" },
                ...recipeMeta.mealTypes.map((m) => ({
                  value: m,
                  label: m.charAt(0).toUpperCase() + m.slice(1),
                })),
              ]}
            />
          ) : (
            <PillInput
              label="Course"
              placeholder="Loading..."
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          )}
        </div>

        <PillSelect
          label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={[
            { value: "", label: "Select difficulty" },
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ]}
        />
      </div>
    );
  }

  /* ─── STEP 2: SERVINGS, INGREDIENTS & PREP ──────────────────────── */

  function renderStep2() {
    return (
      <div className="recipe-step-content">
        {/* Servings & Time */}
        <div className="recipe-section">
          <h3 className="recipe-section-title">
            <Clock size={18} className="recipe-section-icon" />
            Servings & Time
          </h3>
          <div className="recipe-row-3">
            <PillInput
              label="Servings"
              type="number"
              min={1}
              placeholder="e.g. 4"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value) || 1)}
            />
            <PillInput
              label="Prep Time (mins)"
              type="number"
              min={0}
              placeholder="e.g. 15"
              value={prepMin}
              onChange={(e) => setPrepMin(Number(e.target.value) || 0)}
            />
            <PillInput
              label="Cook Time (mins)"
              type="number"
              min={0}
              placeholder="e.g. 30"
              value={cookMin}
              onChange={(e) => setCookMin(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Ingredients */}
        <div className="recipe-section">
          <h3 className="recipe-section-title">
            <Utensils size={18} className="recipe-section-icon" />
            Ingredients
          </h3>
          <div className="recipe-ingredients-list">
            {ingredients.map((row) => (
              <IngredientRowCmp
                key={row.id}
                row={row}
                onChange={(next: IngredientRow) =>
                  setIngredients((rows) =>
                    rows.map((r) => (r.id === row.id ? next : r))
                  )
                }
                onRemove={() =>
                  setIngredients((rows) => rows.filter((r) => r.id !== row.id))
                }
              />
            ))}
          </div>
          <button
            type="button"
            className="recipe-add-btn"
            onClick={() =>
              setIngredients((r) => [
                ...r,
                { id: genId(), qty: "", unit: "", item: "" },
              ])
            }
          >
            <CirclePlus size={16} />
            Add Ingredient
          </button>
        </div>

        {/* Preparation Steps */}
        <div className="recipe-section">
          <h3 className="recipe-section-title">
            <ListOrdered size={18} className="recipe-section-icon" />
            Preparation Steps
          </h3>
          <div className="recipe-steps-list">
            {steps.map((s, i) => (
              <div key={i} className="recipe-step-row">
                <span className="recipe-step-badge">{i + 1}</span>
                <textarea
                  className="recipe-step-textarea"
                  value={s}
                  onChange={(e) =>
                    setSteps((curr) =>
                      curr.map((x, idx) => (idx === i ? e.target.value : x))
                    )
                  }
                  placeholder={i === 0 ? "Describe this step..." : "Next step..."}
                  rows={3}
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    className="recipe-step-remove"
                    onClick={() =>
                      setSteps((curr) => curr.filter((_, idx) => idx !== i))
                    }
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="recipe-add-btn"
            onClick={() => setSteps((s) => [...s, ""])}
          >
            <CirclePlus size={16} />
            Add Step
          </button>
        </div>

        {/* Tip Card */}
        <div className="recipe-tip-card">
          <div className="recipe-tip-dot" />
          <span>Tip: Use fresh, seasonal ingredients for the best flavor profile.</span>
        </div>
      </div>
    );
  }

  /* ─── STEP 3: NUTRITION & REVIEW ────────────────────────────────── */

  function renderStep3() {
    const numField = (
      label: string,
      value: number | "",
      setter: (v: number | "") => void
    ) => (
      <PillInput
        label={label}
        type="number"
        step="any"
        value={value}
        onChange={(e) =>
          setter(e.target.value === "" ? "" : Number(e.target.value))
        }
        placeholder="0"
      />
    );

    const toggleDiet = (k: string) =>
      setDiets((prev) =>
        prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
      );
    const toggleAllergen = (k: string) =>
      setAllergenList((prev) =>
        prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
      );

    return (
      <div className="recipe-step-content">
        {/* Nutrition Facts */}
        <div className="recipe-section">
          <div className="recipe-section-header-row">
            <h3 className="recipe-section-title">
              <Flame size={18} className="recipe-section-icon" />
              Nutrition Facts
            </h3>
            <span className="recipe-per-serving">(per serving)</span>
          </div>
          <div className="recipe-nutrition-grid">
            {numField("Calories (kcal)", calories, setCalories)}
            {numField("Protein (g)", protein, setProtein)}
            {numField("Carbs (g)", carbs, setCarbs)}
            {numField("Fat (g)", fat, setFat)}
            {numField("Fiber (g)", fiber, setFiber)}
            {numField("Sodium (mg)", sodium, setSodium)}
          </div>
          {numField("Saturated Fat (g)", satFat, setSatFat)}
        </div>

        {/* Dietary & Allergens */}
        <div className="recipe-section">
          <h3 className="recipe-section-title">
            <span className="recipe-section-icon-emoji">🍽</span>
            Dietary & Allergens
          </h3>

          <div className="recipe-chips-section">
            <span className="recipe-chips-label">DIETARY PREFERENCE</span>
            <div className="recipe-chips-row">
              {(recipeMeta
                ? (showAllDiets ? recipeMeta.diets : recipeMeta.diets.filter((d) => !d.isMedical).slice(0, 7))
                : DIETS.map((d) => ({ code: d.key, name: d.label }))
              ).map((d) => (
                <button
                  key={d.code}
                  type="button"
                  className={`recipe-chip ${diets.includes(d.code) ? "recipe-chip-diet-active" : ""}`}
                  onClick={() => toggleDiet(d.code)}
                >
                  {d.name}
                </button>
              ))}
              {recipeMeta && recipeMeta.diets.length > 7 && (
                <button
                  type="button"
                  className="recipe-chip recipe-chip-expand"
                  onClick={() => setShowAllDiets(!showAllDiets)}
                >
                  {showAllDiets ? "− Less" : "+ More"}
                </button>
              )}
            </div>
          </div>

          <div className="recipe-chips-section">
            <span className="recipe-chips-label">COMMON ALLERGENS</span>
            <div className="recipe-chips-row">
              {(recipeMeta
                ? (showAllAllergens ? recipeMeta.allergens : recipeMeta.allergens.filter((a) => a.isTop9))
                : ALLERGENS.map((a) => ({ code: a.key, name: a.label }))
              ).map((a) => (
                <button
                  key={a.code}
                  type="button"
                  className={`recipe-chip ${allergenList.includes(a.code) ? "recipe-chip-allergen-active" : ""
                    } ${detectedAllergenCodes.has(a.code) ? "recipe-chip-auto-detected" : ""}`}
                  onClick={() => toggleAllergen(a.code)}
                >
                  {detectedAllergenCodes.has(a.code) && "⚠️ "}{a.name}
                </button>
              ))}
              {recipeMeta && recipeMeta.allergens.length > recipeMeta.allergens.filter((a) => a.isTop9).length && (
                <button
                  type="button"
                  className="recipe-chip recipe-chip-expand"
                  onClick={() => setShowAllAllergens(!showAllAllergens)}
                >
                  {showAllAllergens ? "− Less" : "+ More"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Review Recipe accordion */}
        <div className="recipe-review-accordion">
          <button
            type="button"
            className="recipe-review-header"
            onClick={() => setReviewOpen(!reviewOpen)}
          >
            <span className="recipe-review-title-text">
              <span className="recipe-section-icon-emoji">🔍</span>
              Review Recipe
            </span>
            {reviewOpen ? (
              <ChevronDown size={20} color={tokens.muted} />
            ) : (
              <ChevronRight size={20} color={tokens.muted} />
            )}
          </button>
          {reviewOpen && (
            <div className="recipe-review-body">
              <div className="recipe-review-card">
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={title}
                    width={80}
                    height={80}
                    className="recipe-review-thumb"
                    unoptimized
                  />
                )}
                <div>
                  <h4 className="recipe-review-name">
                    {title || "Untitled Recipe"}
                  </h4>
                  <p className="recipe-review-meta">
                    <Clock size={12} /> {(Number(prepMin) || 0) + (Number(cookMin) || 0)} mins
                    · {servings} servings
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── render ─────────────────────────────────────────────────────── */

  return (
    <>
      <style>{recipeFormCSS}</style>
      <div className="recipe-wizard">
        {/* Header (mobile) */}
        <div className="recipe-wizard-header">
          <button
            type="button"
            className="recipe-back-btn"
            onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="recipe-wizard-title">Create Recipe</h2>
        </div>

        {/* Progress bar */}
        <div className="recipe-wizard-progress">
          <ProgressBar step={step} />
        </div>

        {/* Step content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Navigation buttons */}
        <div className="recipe-wizard-nav">
          {step < 3 ? (
            <button
              type="button"
              className="recipe-btn-primary recipe-btn-full"
              onClick={handleNextStep}
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="recipe-btn-save recipe-btn-full"
              onClick={handleSave}
              disabled={busy || !title.trim()}
            >
              Save Recipe <CheckCircle2 size={16} />
            </button>
          )}
          {step > 1 && (
            <button
              type="button"
              className="recipe-btn-muted recipe-btn-full"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} /> Previous Step
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── CSS ──────────────────────────────────────────────────────────── */

const recipeFormCSS = `
  .recipe-wizard {
    font-family: 'Inter', sans-serif;
    background: ${tokens.bg};
    max-width: 640px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: 90px;
  }
  @media (min-width: 1024px) {
    .recipe-wizard { padding-bottom: 0; }
  }

  /* Header */
  .recipe-wizard-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 16px 12px;
    border-bottom: 1px solid ${tokens.inputBorder};
    position: sticky;
    top: 0;
    background: ${tokens.bg};
    z-index: 10;
  }
  @media (min-width: 1024px) {
    .recipe-wizard-header { display: none; }
    .recipe-wizard { max-width: 720px; min-height: auto; padding: 0 16px; }
  }
  .recipe-back-btn {
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    border: none; background: none; cursor: pointer; color: ${tokens.heading};
  }
  .recipe-wizard-title {
    font-size: 18px; font-weight: 700; color: ${tokens.heading};
    letter-spacing: -0.45px;
  }

  /* Progress */
  .recipe-wizard-progress { padding: 16px 24px 8px; }
  .recipe-progress-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
  }
  .recipe-progress-label {
    font-size: 16px; font-weight: 600; color: ${tokens.heading};
    letter-spacing: 0.7px; text-transform: capitalize;
  }
  .recipe-progress-pct {
    font-size: 14px; color: ${tokens.muted};
  }
  .recipe-progress-track {
    height: 8px; border-radius: 9999px; background: ${tokens.primaryTrack};
    overflow: hidden;
  }
  .recipe-progress-bar {
    height: 100%; border-radius: 9999px; background: ${tokens.primary};
    box-shadow: 0 0 8px ${tokens.primaryGlow};
    transition: width 0.4s ease;
  }

  /* Step content */
  .recipe-step-content {
    padding: 12px 24px 20px;
    display: flex; flex-direction: column; gap: 20px;
    flex: 1;
  }

  /* Fields */
  .recipe-field { display: flex; flex-direction: column; gap: 8px; }
  .recipe-label {
    font-size: 16px; font-weight: 700; color: ${tokens.label};
    line-height: 20px;
  }
  .recipe-input {
    height: 48px; border-radius: 9999px; border: 1px solid ${tokens.inputBorder};
    background: ${tokens.white}; padding: 0 16px; font-size: 16px;
    color: ${tokens.heading}; outline: none; width: 100%;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.2s;
  }
  .recipe-input:focus { border-color: ${tokens.primary}; box-shadow: 0 0 0 2px ${tokens.primaryTrack}; }
  .recipe-input::placeholder { color: ${tokens.placeholder}; }
  .recipe-input-with-icon { padding-left: 44px; }

  .recipe-textarea {
    min-height: 100px; border-radius: 20px; border: 1px solid ${tokens.inputBorder};
    background: ${tokens.white}; padding: 14px 16px; font-size: 16px;
    color: ${tokens.heading}; outline: none; width: 100%; resize: vertical;
    font-family: 'Inter', sans-serif; line-height: 24px;
  }
  .recipe-textarea:focus { border-color: ${tokens.primary}; box-shadow: 0 0 0 2px ${tokens.primaryTrack}; }
  .recipe-textarea::placeholder { color: ${tokens.placeholder}; }

  /* Select */
  .recipe-select-wrap { position: relative; }
  .recipe-select {
    width: 100%; height: 48px; border-radius: 9999px;
    border: 1px solid ${tokens.inputBorder}; background: ${tokens.white};
    padding: 0 40px 0 16px; font-size: 16px; color: ${tokens.heading};
    appearance: none; outline: none; cursor: pointer;
    font-family: 'Inter', sans-serif;
  }
  .recipe-select:focus { border-color: ${tokens.primary}; }
  .recipe-select-icon {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    pointer-events: none; color: ${tokens.muted};
  }

  /* Row layouts */
  .recipe-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .recipe-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  @media (max-width: 520px) { .recipe-row-3 { grid-template-columns: 1fr; } }

  /* Image upload */
  .recipe-image-url-row { position: relative; }
  .recipe-image-url-icon {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    color: ${tokens.placeholder};
  }
  .recipe-or-text { font-size: 14px; color: ${tokens.heading}; }
  .recipe-image-buttons { display: flex; gap: 12px; }
  .recipe-image-btn {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 8px; border: 2px solid ${tokens.primary}; border-radius: 12px;
    background: none; padding: 16px 18px; cursor: pointer;
    font-size: 14px; font-weight: 700; color: ${tokens.primaryDark};
    font-family: 'Inter', sans-serif; text-align: center;
    transition: background 0.15s;
  }
  .recipe-image-btn:hover { background: ${tokens.primaryTrack}; }

  /* Drag-drop zone */
  .recipe-dropzone {
    border: 2px dashed ${tokens.inputBorder}; border-radius: 16px;
    padding: 24px; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 8px; cursor: pointer; min-height: 100px;
    transition: border-color 0.2s, background 0.2s;
    margin-bottom: 8px;
  }
  .recipe-dropzone:hover,
  .recipe-dropzone-active {
    border-color: ${tokens.primary}; background: ${tokens.primaryTrack};
  }
  .recipe-dropzone-label {
    font-size: 13px; color: ${tokens.muted}; text-align: center;
  }
  .recipe-dropzone-preview {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .recipe-dropzone-thumb { border-radius: 12px; object-fit: cover; }
  .recipe-dropzone-change { font-size: 12px; color: ${tokens.muted}; }
  .recipe-dropzone-spinner {
    width: 32px; height: 32px; border: 3px solid ${tokens.inputBorder};
    border-top-color: ${tokens.primary}; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .recipe-file-hidden { display: none; }

  /* Sections */
  .recipe-section { display: flex; flex-direction: column; gap: 12px; }
  .recipe-section-title {
    display: flex; align-items: center; gap: 8px;
    font-size: 16px; font-weight: 700; color: ${tokens.heading};
  }
  .recipe-section-icon { color: ${tokens.primaryDark}; }
  .recipe-section-icon-emoji { font-size: 18px; }
  .recipe-section-header-row {
    display: flex; justify-content: space-between; align-items: center;
  }
  .recipe-per-serving {
    font-size: 14px; font-style: italic; color: ${tokens.muted};
  }

  /* Ingredients list */
  .recipe-ingredients-list { display: flex; flex-direction: column; gap: 8px; }

  /* Add button (dashed) */
  .recipe-add-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    border: 2px dashed ${tokens.primary}; border-radius: 12px;
    background: none; padding: 14px; cursor: pointer;
    font-size: 14px; font-weight: 700; color: ${tokens.primaryDark};
    font-family: 'Inter', sans-serif;
    transition: background 0.15s;
  }
  .recipe-add-btn:hover { background: ${tokens.primaryTrack}; }

  /* Preparation steps */
  .recipe-steps-list { display: flex; flex-direction: column; gap: 12px; }
  .recipe-step-row { display: flex; gap: 8px; align-items: flex-start; }
  .recipe-step-badge {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    background: ${tokens.primary}; color: ${tokens.white};
    font-size: 12px; font-weight: 700; display: flex; align-items: center;
    justify-content: center; margin-top: 8px;
  }
  .recipe-step-textarea {
    flex: 1; min-height: 80px; border-radius: 16px;
    border: 1px solid ${tokens.inputBorder}; background: ${tokens.white};
    padding: 12px 16px; font-size: 14px; color: ${tokens.heading};
    outline: none; resize: vertical; font-family: 'Inter', sans-serif;
    line-height: 20px;
  }
  .recipe-step-textarea:focus {
    border-color: ${tokens.primary}; box-shadow: 0 0 0 2px ${tokens.primaryTrack};
  }
  .recipe-step-textarea::placeholder { color: ${tokens.placeholder}; }
  .recipe-step-remove {
    width: 28px; height: 28px; border-radius: 50%; border: none;
    background: ${tokens.danger}; color: white; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    margin-top: 8px; flex-shrink: 0;
  }

  /* Tip card */
  .recipe-tip-card {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px; border-radius: 16px;
    background: linear-gradient(135deg, #F0F7E6 0%, #E8F5D8 100%);
    font-size: 14px; color: ${tokens.label};
  }
  .recipe-tip-dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: ${tokens.primary}; flex-shrink: 0;
  }

  /* Nutrition grid */
  .recipe-nutrition-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }

  /* Chips */
  .recipe-chips-section { display: flex; flex-direction: column; gap: 8px; }
  .recipe-chips-label {
    font-size: 11px; font-weight: 700; color: ${tokens.primaryDark};
    letter-spacing: 1px; text-transform: uppercase;
  }
  .recipe-chips-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .recipe-chip {
    padding: 8px 16px; border-radius: 9999px;
    border: 1px solid ${tokens.inputBorder}; background: ${tokens.white};
    font-size: 14px; color: ${tokens.heading}; cursor: pointer;
    font-family: 'Inter', sans-serif; transition: all 0.15s;
  }
  .recipe-chip:hover { border-color: ${tokens.primary}; }
  .recipe-chip-diet-active {
    background: ${tokens.primary}; border-color: ${tokens.primary};
    color: white; font-weight: 600;
  }
  .recipe-chip-allergen-active {
    background: ${tokens.amber}; border-color: ${tokens.amber};
    color: white; font-weight: 600;
  }
  .recipe-chip-expand {
    border-style: dashed; border-color: ${tokens.primary};
    color: ${tokens.primaryDark}; font-weight: 600;
    background: ${tokens.primaryTrack};
  }
  .recipe-chip-expand:hover { background: ${tokens.primary}; color: white; }
  .recipe-chip-auto-detected {
    border-color: ${tokens.amber}; box-shadow: 0 0 0 2px ${tokens.amberBg};
  }

  /* Review accordion */
  .recipe-review-accordion {
    border: 1px solid ${tokens.inputBorder}; border-radius: 16px;
    overflow: hidden; background: ${tokens.white};
  }
  .recipe-review-header {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 16px 20px; border: none; background: none;
    cursor: pointer; font-family: 'Inter', sans-serif;
  }
  .recipe-review-title-text {
    display: flex; align-items: center; gap: 8px;
    font-size: 16px; font-weight: 700; color: ${tokens.heading};
  }
  .recipe-review-body { padding: 0 20px 20px; }
  .recipe-review-card {
    display: flex; align-items: center; gap: 16px;
    padding: 12px; border-radius: 12px; background: ${tokens.bg};
  }
  .recipe-review-thumb { border-radius: 10px; object-fit: cover; }
  .recipe-review-name { font-size: 16px; font-weight: 700; color: ${tokens.heading}; }
  .recipe-review-meta {
    display: flex; align-items: center; gap: 4px;
    font-size: 13px; color: ${tokens.muted}; margin-top: 4px;
  }

  /* Navigation buttons */
  .recipe-wizard-nav {
    padding: 12px 24px 24px; display: flex; flex-direction: column; gap: 12px;
  }
  .recipe-btn-full { width: 100%; }
  .recipe-btn-primary {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 16px 24px; border-radius: 12px; border: none;
    background: ${tokens.primary}; color: ${tokens.heading};
    font-size: 18px; font-weight: 700; cursor: pointer;
    font-family: 'Public Sans', 'Inter', sans-serif;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    transition: opacity 0.15s;
  }
  .recipe-btn-primary:hover { opacity: 0.9; }
  .recipe-btn-save {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 16px 24px; border-radius: 12px; border: none;
    background: ${tokens.primary}; color: ${tokens.heading};
    font-size: 18px; font-weight: 700; cursor: pointer;
    font-family: 'Public Sans', 'Inter', sans-serif;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    transition: opacity 0.15s;
  }
  .recipe-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
  .recipe-btn-muted {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 24px; border-radius: 12px; border: none;
    background: ${tokens.mutedBg}; color: ${tokens.muted};
    font-size: 16px; font-weight: 600; cursor: pointer;
    font-family: 'Public Sans', 'Inter', sans-serif;
    transition: background 0.15s;
  }
  .recipe-btn-muted:hover { background: #E2E8F0; }

  /* Success page */
  .recipe-success {
    font-family: 'Inter', sans-serif;
    max-width: 440px; margin: 0 auto; padding: 48px 24px 120px;
    display: flex; flex-direction: column; align-items: center;
    text-align: center; gap: 20px;
  }
  @media (min-width: 1024px) {
    .recipe-success { padding-bottom: 48px; }
  }
  .recipe-success-title {
    font-size: 28px; font-weight: 800; color: ${tokens.heading};
    line-height: 1.2;
  }
  .recipe-success-check {
    animation: popIn 0.5s ease;
  }
  @keyframes popIn {
    0% { transform: scale(0); opacity: 0; }
    70% { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
  }
  .recipe-success-card {
    width: 100%; border-radius: 16px; overflow: hidden;
    background: ${tokens.white}; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  .recipe-success-card-img { position: relative; }
  .recipe-success-card-photo {
    width: 100%; height: 200px; object-fit: cover;
  }
  .recipe-success-badges {
    position: absolute; top: 12px; left: 12px;
    display: flex; gap: 8px;
  }
  .recipe-success-badge {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 12px; border-radius: 9999px;
    background: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600;
    color: ${tokens.heading}; backdrop-filter: blur(4px);
  }
  .recipe-success-card-body { padding: 16px 20px; text-align: left; }
  .recipe-success-card-title {
    font-size: 18px; font-weight: 700; color: ${tokens.heading};
    margin-bottom: 4px;
  }
  .recipe-success-card-desc {
    font-size: 14px; color: ${tokens.muted}; line-height: 1.5;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .recipe-success-card-footer {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 12px;
  }
  .recipe-success-tags { display: flex; gap: 6px; }
  .recipe-success-tag {
    padding: 4px 10px; border-radius: 9999px;
    border: 1px solid ${tokens.inputBorder}; font-size: 11px;
    font-weight: 600; color: ${tokens.muted}; letter-spacing: 0.5px;
  }
  .recipe-success-added {
    font-size: 12px; color: ${tokens.muted}; text-align: right;
  }
`;
