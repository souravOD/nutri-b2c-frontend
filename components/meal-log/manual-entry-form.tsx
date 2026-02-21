"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManualEntryFormProps {
  onSubmit: (data: {
    customName: string;
    customBrand?: string;
    servings: number;
    nutrition: {
      calories?: number;
      proteinG?: number;
      carbsG?: number;
      fatG?: number;
      fiberG?: number;
      sugarG?: number;
      sodiumMg?: number;
    };
  }) => void;
  onCancel: () => void;
}

export function ManualEntryForm({ onSubmit, onCancel }: ManualEntryFormProps) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servings, setServings] = useState(1);
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [fiber, setFiber] = useState<string>("");
  const [sugar, setSugar] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      customName: name.trim(),
      customBrand: brand.trim() || undefined,
      servings,
      nutrition: {
        calories: calories ? Number(calories) : undefined,
        proteinG: protein ? Number(protein) : undefined,
        carbsG: carbs ? Number(carbs) : undefined,
        fatG: fat ? Number(fat) : undefined,
        fiberG: fiber ? Number(fiber) : undefined,
        sugarG: sugar ? Number(sugar) : undefined,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Food name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Greek yogurt with honey"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="servings">Servings</Label>
          <Input
            id="servings"
            type="number"
            min={0.25}
            step={0.25}
            value={servings}
            onChange={(e) => setServings(Number(e.target.value) || 1)}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Nutrition per serving (optional)</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cal" className="text-xs">Calories</Label>
          <Input id="cal" type="number" min={0} value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="kcal" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="prot" className="text-xs">Protein (g)</Label>
          <Input id="prot" type="number" min={0} step={0.1} value={protein} onChange={(e) => setProtein(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="carb" className="text-xs">Carbs (g)</Label>
          <Input id="carb" type="number" min={0} step={0.1} value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fatf" className="text-xs">Fat (g)</Label>
          <Input id="fatf" type="number" min={0} step={0.1} value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fib" className="text-xs">Fiber (g)</Label>
          <Input id="fib" type="number" min={0} step={0.1} value={fiber} onChange={(e) => setFiber(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sug" className="text-xs">Sugar (g)</Label>
          <Input id="sug" type="number" min={0} step={0.1} value={sugar} onChange={(e) => setSugar(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()} className="flex-1">
          Add Item
        </Button>
      </div>
    </form>
  );
}
