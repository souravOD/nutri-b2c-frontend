"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagsInput } from "@/components/ui/tags-input";

const schema = z.object({
  fullName: z.string().max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  diets: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
});
type OverviewFormValues = z.infer<typeof schema>
type OverviewInitialValues = Partial<OverviewFormValues> | null | undefined

export function OverviewEditDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange(v: boolean): void;
  initial: OverviewInitialValues;
  onSaved(): void;
}) {
  const form = useForm<OverviewFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<OverviewFormValues>,
    defaultValues: {
      ...initial,
      diets: initial?.diets ?? [],
      allergens: initial?.allergens ?? [],
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const { apiUpdateOverview } = await import("@/lib/api");
    await apiUpdateOverview(values);
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Overview</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <Input placeholder="Full name" {...form.register("fullName")} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Email" {...form.register("email")} />
            <Input placeholder="Phone" {...form.register("phone")} />
          </div>

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
