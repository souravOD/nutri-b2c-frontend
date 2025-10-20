"use client";

import * as React from "react";
import IngredientRowCmp, { type IngredientRow } from "./row";
import DietAllergenPicker from "./DietAllergenPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Embedded preview panel (merged from components/recipe/recipe-details-panel.tsx)
 * UI only — no backend calls here. Actual creation happens via parent onSubmit.
 */

const genId = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

// Show placeholder in the UI but treat empty as 0 when submitting
const toZero = (v: number | "") => (v === "" ? 0 : Number(v) || 0);

// Numeric input change helper: keep "" if cleared, else Number(...)
const onNumChange =
  (set: React.Dispatch<React.SetStateAction<number | "">>) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    set(val === "" ? "" : Number(val));
  };

function RecipeDetailsPanel({
  recipe,
  onBack,
  onSave,
  busy = false,
}: {
  recipe: any;
  onBack: () => void;
  onSave?: () => void;
  busy?: boolean;
}) {
  const n = recipe.nutrition || {};

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          Edit
        </Button>
        {onSave && (
          <Button onClick={onSave} disabled={busy}>
            Save recipe
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          {recipe.imageUrl ? (
            <img
              className="h-48 w-full rounded-md object-cover border"
              src={recipe.imageUrl}
              alt={recipe.title || "Recipe image"}
            />
          ) : (
            <div className="h-48 rounded-md border grid place-items-center text-sm text-muted-foreground">
              No image
            </div>
          )}
          <div className="mt-3 text-sm text-muted-foreground">
            {recipe.cuisine && <span>• {recipe.cuisine} </span>}
            {recipe.course && <span>• {recipe.course} </span>}
            {recipe.difficulty && <span>• {recipe.difficulty}</span>}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <section>
            <h3 className="font-medium">Summary</h3>
            <p className="text-sm text-muted-foreground">
              A {recipe.cuisine || ""} {recipe.course || "dish"} for{" "}
              {recipe.servings || 1} serving(s), about{" "}
              {(recipe.time?.prepMin ?? 0) + (recipe.time?.cookMin ?? 0)} minutes
              total. Fits your preferences.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {recipe.tags?.diets?.map((k: string) => (
                <span
                  key={k}
                  className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                >
                  {k.replace("_", " ")}
                </span>
              ))}
              {recipe.tags?.allergens?.map((k: string) => (
                <span
                  key={k}
                  className="rounded-full bg-amber-500/20 border border-amber-500 px-2 py-0.5 text-xs"
                >
                  {k.replace("_", " ")}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-medium mb-2">Ingredients</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {recipe.ingredients?.map((r: any, i: number) => (
                <li key={i}>
                  {r.qty}
                  {r.unit && ` ${r.unit}`} {r.item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-medium mb-2">Steps</h3>
            <ol className="list-decimal pl-5 text-sm space-y-1">
              {recipe.steps?.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="font-medium mb-2">Nutrition (per serving)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              {Object.entries(n).map(([k, v]) => (
                <div key={k} className="rounded-md border p-2">
                  <div className="font-medium">{k}</div>
                  <div className="text-muted-foreground">{String(v ?? 0)}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** ------------------------- form types -------------------------- */

type IngredientInitial = {
  qty?: number | string | null | undefined;
  unit?: string | null | undefined;
  item?: string | null | undefined;
  name?: string | null | undefined; // tolerated for older shapes
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

export default function RecipeCreateForm({
  initial,
  onSubmit,
  busy = false,
}: {
  initial?: RecipeFormInitial;
  onSubmit: (draft: any) => void | Promise<void>;
  busy?: boolean;
}) {
  // ---- basic form state ----
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );
  const [imageUrl, setImageUrl] = React.useState(initial?.image_url ?? "");
  const [servings, setServings] = React.useState(initial?.servings ?? 2);
  const [prepMin, setPrepMin] = React.useState(
    initial?.prep_time_minutes ?? 10
  );
  const [cookMin, setCookMin] = React.useState(
    initial?.cook_time_minutes ?? 10
  );
  const [cuisine, setCuisine] = React.useState(initial?.cuisine ?? "");
  const [course, setCourse] = React.useState(initial?.meal_type ?? "");
  const [difficulty, setDifficulty] = React.useState(
    initial?.difficulty ?? "easy"
  );
  const [diets, setDiets] = React.useState<string[]>(initial?.diet_tags ?? []);
  const [allergens, setAllergens] = React.useState<string[]>(
    initial?.allergens ?? []
  );
  const seedIngredients: IngredientRow[] =
  Array.isArray(initial?.ingredients) && initial!.ingredients.length
    ? (initial!.ingredients as any[]).map((r: any) => ({
        id: genId(),                      // ensure a stable key
        qty: r?.qty ?? "",
        unit: r?.unit ?? "",
        item: r?.item ?? "",
        note: r?.note ?? "",
      }))
    : [
        {
          id: genId(),
          qty: "",
          unit: "",
          item: "",
        },
      ];

const [ingredients, setIngredients] = React.useState<IngredientRow[]>(seedIngredients);
  const [steps, setSteps] = React.useState<string[]>(
    Array.isArray(initial?.instructions)
      ? (initial!.instructions as any[]).map((x: any) =>
          typeof x === "string" ? x : x?.text ?? ""
        )
      : [""]
  );

  // ---- nutrition (editable, with placeholders) ----
  const [calories, setCalories] = React.useState<number | "">(initial?.calories ?? "");
  const [protein,  setProtein ] = React.useState<number | "">(initial?.protein_g ?? "");
  const [carbs,    setCarbs   ] = React.useState<number | "">(initial?.carbs_g   ?? "");
  const [fat,      setFat     ] = React.useState<number | "">(initial?.fat_g     ?? "");
  const [fiber,    setFiber   ] = React.useState<number | "">(initial?.fiber_g   ?? "");
  const [sodium,   setSodium  ] = React.useState<number | "">(initial?.sodium_mg ?? "");
  const [satFat,   setSatFat  ] = React.useState<number | "">(initial?.saturated_fat_g ?? "");

  // ---- preview wiring ----
  const [mode, setMode] = React.useState<"edit" | "preview">("edit");
  const [previewDraft, setPreviewDraft] = React.useState<any | null>(null);

  const toNumberOrNull = (v: any): number | null => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  function normalizeIngredients(rows: IngredientRow[]): any[] {
    return rows
      .filter((r) => (r.item ?? "").toString().trim().length > 0)
      .map((r) => ({
        qty: r.qty === "" ? "" : Number(r.qty ?? "") || "",
        unit: (r.unit ?? "").trim() || null,
        item: (r.item ?? "").trim(),
        note: (r as any).note ? String((r as any).note).trim() : null,
      }));
  }

  function normalizeSteps(src: string[] | { text: string }[]): any[] {
    if (!Array.isArray(src)) return [];
    return src.map((s: any, i: number) =>
      typeof s === "string"
        ? { order: i + 1, text: s }
        : { order: i + 1, text: s?.text ?? "" }
    );
  }

  function buildDraft() {
    return {
      title: title.trim(),
      description: description?.trim() || null,
      image_url: imageUrl?.trim() || null,
      servings: toNumberOrNull(servings) ?? 1,
      prep_time_minutes: toNumberOrNull(prepMin) ?? 0,
      cook_time_minutes: toNumberOrNull(cookMin) ?? 0,
      total_time_minutes:
        (toNumberOrNull(prepMin) ?? 0) + (toNumberOrNull(cookMin) ?? 0),
      cuisines: cuisine?.trim() ? [cuisine.trim()] : [],
      meal_type: course?.trim() || null,
      difficulty: difficulty || null,
      // cuisines: null,
      diet_tags: diets ?? [],
      allergens: allergens ?? [],
      ingredients: normalizeIngredients(ingredients),
      instructions: normalizeSteps(steps),
      notes: null,
      visibility: "private",
      // nutrition (optional)
      calories:          toZero(calories),
      protein_g:         toZero(protein),
      carbs_g:           toZero(carbs),
      fat_g:             toZero(fat),
      fiber_g:           toZero(fiber),
      sodium_mg:         toZero(sodium),
      saturated_fat_g:   toZero(satFat),
    };
  }

  function draftToPreviewModel(draft: any) {
    return {
      title: draft.title,
      imageUrl: draft.image_url,
      cuisine: Array.isArray(draft.cuisines) && draft.cuisines.length ? draft.cuisines[0] : null,
      course: draft.meal_type,
      difficulty: draft.difficulty,
      servings: draft.servings,
      time: {
        prepMin: draft.prep_time_minutes,
        cookMin: draft.cook_time_minutes,
      },
      tags: { diets: draft.diet_tags ?? [], allergens: draft.allergens ?? [] },
      ingredients: (draft.ingredients ?? []).map((r: any) => ({
        qty: r.qty,
        unit: r.unit,
        item: r.item,
      })),
      steps: (draft.instructions ?? []).map((s: any) => s?.text ?? s),
      nutrition: {
        calories: draft.calories ?? 0,
        protein_g: draft.protein_g ?? 0,
        carbs_g: draft.carbs_g ?? 0,
        fat_g: draft.fat_g ?? 0,
        fiber_g: draft.fiber_g ?? 0,
        sodium_mg: draft.sodium_mg ?? 0,
        saturated_fat_g: draft.saturated_fat_g ?? 0,
      },
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const draft = buildDraft();
    // Go to preview first; Save there triggers parent onSubmit
    setPreviewDraft(draft);
    setMode("preview");
  }

  async function handleSaveFromPreview() {
    if (!previewDraft) return;
    await onSubmit(previewDraft);
  }

  if (mode === "preview" && previewDraft) {
    return (
      <RecipeDetailsPanel
        recipe={draftToPreviewModel(previewDraft)}
        onBack={() => setMode("edit")}
        onSave={handleSaveFromPreview}
        busy={busy}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basics */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">Basics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
            />
            <Input
              placeholder="Course (e.g., Main)"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
            <select
              className="rounded-md border bg-background px-2 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {["easy", "medium", "hard"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Servings & Time
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">Servings & Time</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            type="number"
            min={1}
            value={servings}
            onChange={(e) => setServings(Number(e.target.value) || 1)}
            placeholder="Servings"
          />
          <Input
            type="number"
            min={0}
            value={prepMin}
            onChange={(e) => setPrepMin(Number(e.target.value) || 0)}
            placeholder="Prep (min)"
          />
          <Input
            type="number"
            min={0}
            value={cookMin}
            onChange={(e) => setCookMin(Number(e.target.value) || 0)}
            placeholder="Cook (min)"
          />
        </div>
      </div> */}




      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">Servings & Time</h2>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          {/* Servings */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Servings
            </p>
            <Input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value) || 1)}
              placeholder="Number of servings"
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Time
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                value={prepMin}
                onChange={(e) => setPrepMin(Number(e.target.value) || 0)}
                placeholder="Prep time (mins)"
              />
              <Input
                type="number"
                min={0}
                value={cookMin}
                onChange={(e) => setCookMin(Number(e.target.value) || 0)}
                placeholder="Cook time (secs)"
              />
            </div>
          </div>
        </div>
      </div>





      {/* Diet & Allergens */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">Diet & Allergens</h2>
        <DietAllergenPicker
          diets={diets}
          allergens={allergens}
          onChange={(next) => {
            setDiets(next.diets);
            setAllergens(next.allergens);
          }}
        />
      </div>

      {/* Ingredients */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">Ingredients</h2>

        <div className="space-y-2">
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

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setIngredients((r) => [
              ...r,
              {
                id:
                  globalThis.crypto?.randomUUID?.() ??
                  Math.random().toString(36).slice(2),
                qty: "",
                unit: "",
                item: "",
              },
            ])
          }
        >
          Add ingredient
        </Button>
      </div>

      {/* Steps */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">Steps</h2>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Textarea
                value={s}
                onChange={(e) =>
                  setSteps((curr) =>
                    curr.map((x, idx) => (idx === i ? e.target.value : x))
                  )
                }
                placeholder={`Step ${i + 1}`}
              />
              <Button
                variant="destructive"
                type="button"
                onClick={() =>
                  setSteps((curr) => curr.filter((_, idx) => idx !== i))
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setSteps((s) => [...s, ""])}
          >
            Add step
          </Button>
        </div>
      </div>

      {/* Nutrition */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">Nutrition (per serving)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <Input
            type="number"
            step="any"
            value={calories}
            onChange={(e) =>
              setCalories(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Calories (kcal)"
          />
          <Input
            type="number"
            step="any"
            value={protein}
            onChange={(e) =>
              setProtein(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Protein (g)"
          />
          <Input
            type="number"
            step="any"
            value={carbs}
            onChange={(e) =>
              setCarbs(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Carbs (g)"
          />
          <Input
            type="number"
            step="any"
            value={fat}
            onChange={(e) =>
              setFat(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Fat (g)"
          />
          <Input
            type="number"
            step="any"
            value={fiber}
            onChange={(e) =>
              setFiber(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Fiber (g)"
          />
          <Input
            type="number"
            step="any"
            value={sodium}
            onChange={(e) =>
              setSodium(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Sodium (mg)"
          />
          <Input
            type="number"
            step="any"
            value={satFat}
            onChange={(e) =>
              setSatFat(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Saturated fat (g)"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setMode("preview")}>
          Preview
        </Button>
        <Button type="submit" disabled={busy}>
          Save & Next
        </Button>
      </div>
    </form>
  );
}
