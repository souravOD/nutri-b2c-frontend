"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagsInput } from "@/components/ui/tags-input"; // <-- NEW

const schema = z.object({
  date_of_birth: z.string().optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  activity_level: z.string().optional(),
  goal: z.string().optional(),
  height_cm: z.preprocess(Number, z.number().nonnegative().optional()),
  weight_kg: z.preprocess(Number, z.number().nonnegative().optional()),
  height_display: z.string().optional(),
  weight_display: z.string().optional(),
  onboarding_complete: z.boolean().optional(),
  diets: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  intolerances: z.array(z.string()).optional(),
  disliked_ingredients: z.array(z.string()).optional(),
});
type HealthFormValues = z.infer<typeof schema>
type HealthInitialValues = Partial<HealthFormValues> | null | undefined

export function HealthEditDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange(v: boolean): void;
  initial: HealthInitialValues;
  onSaved(): void;
}) {
  const form = useForm<HealthFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<HealthFormValues>, // <-- cast clears 2719
    defaultValues: {
      ...initial,
      diets: initial?.diets ?? [],
      allergens: initial?.allergens ?? [],
      intolerances: initial?.intolerances ?? [],
      disliked_ingredients: initial?.disliked_ingredients ?? [],
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const { apiUpdateHealth } = await import("@/lib/api");
    await apiUpdateHealth(values);
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Health</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <Input type="date" {...form.register("date_of_birth")} />

          <Select
            onValueChange={(v: string) => form.setValue("sex", v as "male" | "female" | "other")}
            defaultValue={form.getValues("sex") ?? ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Activity level" {...form.register("activity_level")} />
          <Input placeholder="Goal" {...form.register("goal")} />

          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Height (cm)" {...form.register("height_cm")} />
            <Input type="number" placeholder="Weight (kg)" {...form.register("weight_kg")} />
          </div>

          <Input placeholder="Height display (e.g., 5'11)" {...form.register("height_display")} />
          <Input placeholder="Weight display (e.g., 165 lb)" {...form.register("weight_display")} />

          <TagsInput
            label="Diets"
            value={form.watch("diets") ?? []}
            onChange={(v: string[]) => form.setValue("diets", v)}
          />
          <TagsInput
            label="Allergens"
            value={form.watch("allergens") ?? []}
            onChange={(v: string[]) => form.setValue("allergens", v)}
          />
          <TagsInput
            label="Intolerances"
            value={form.watch("intolerances") ?? []}
            onChange={(v: string[]) => form.setValue("intolerances", v)}
          />
          <TagsInput
            label="Disliked ingredients"
            value={form.watch("disliked_ingredients") ?? []}
            onChange={(v: string[]) => form.setValue("disliked_ingredients", v)}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
