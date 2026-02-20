"use client"
import { Button } from "@/components/ui/button"

export default function RecipeDetailsPanel({
  recipe, onBack, onSave, mode = "preview",
}: { recipe: any; onBack: () => void; onSave?: () => void; mode?: "preview" | "saved" }) {
  const n = recipe.nutrition || {}
  const isPreview = mode === "preview"
  const cuisineLabel =
    typeof recipe.cuisine === "string"
      ? recipe.cuisine
      : recipe.cuisine?.name ?? recipe.cuisine?.code ?? null;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {isPreview && <Button variant="outline" onClick={onBack}>Edit</Button>}
        {isPreview && onSave && <Button onClick={onSave}>Save recipe</Button>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          {recipe.imageUrl ? (
            <img className="h-48 w-full rounded-md object-cover border" src={recipe.imageUrl} alt={recipe.title} />
          ) : (
            <div className="h-48 rounded-md border grid place-items-center text-sm text-muted-foreground">No image</div>
          )}
          <div className="mt-3 text-sm text-muted-foreground">
            {cuisineLabel && <span>• {cuisineLabel} </span>}
            {recipe.course && <span>• {recipe.course} </span>}
            {recipe.difficulty && <span>• {recipe.difficulty}</span>}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <section>
            <h3 className="font-medium">Summary</h3>
            <p className="text-sm text-muted-foreground">
              A {cuisineLabel || ""} {recipe.course || "dish"} for {recipe.servings || 1} serving(s),
              about {(recipe.time?.prepMin ?? 0) + (recipe.time?.cookMin ?? 0)} minutes total.
              Fits your preferences.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {recipe.tags?.diets?.map((k: string) => (
                <span key={k} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{k.replace("_"," ")}</span>
              ))}
              {recipe.tags?.allergens?.map((k: string) => (
                <span key={k} className="rounded-full bg-amber-500/20 border border-amber-500 px-2 py-0.5 text-xs">
                  {k.replace("_"," ")}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-medium mb-2">Ingredients</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {recipe.ingredients?.map((r: any, i: number) => (
                <li key={i}>{r.qty}{r.unit && ` ${r.unit}`} {r.item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-medium mb-2">Steps</h3>
            <ol className="list-decimal pl-5 text-sm space-y-1">
              {recipe.steps?.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ol>
          </section>

          <section>
            <h3 className="font-medium mb-2">Nutrition (per serving)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              {Object.entries(n).map(([k, v]) => (
                <div key={k} className="rounded-md border p-2">
                  <div className="font-medium">{k}</div>
                  <div className="text-muted-foreground">{String(v)}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
