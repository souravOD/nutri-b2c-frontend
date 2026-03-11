"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ChevronRight, ChevronLeft, Sparkles, Plus } from "lucide-react";
import { MemberTargets } from "./member-targets";
import { AddMemberForm } from "./add-member-form";
import { useHouseholdMembers, useAddMember } from "@/hooks/use-household";
import { useGeneratePlan } from "@/hooks/use-meal-plan";
import { apiGetCuisines } from "@/lib/api";
import type { MealPlanGenerateParams, MealPlanGenerateResponse } from "@/lib/types";

interface PlanGeneratorProps {
  onPlanGenerated: (result: MealPlanGenerateResponse) => void;
}

const MEAL_OPTIONS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

function getNextMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  return monday.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function PlanGenerator({ onPlanGenerated }: PlanGeneratorProps) {
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState(getNextMonday());
  const [endDate, setEndDate] = useState(addDays(getNextMonday(), 6));
  const [mealsPerDay, setMealsPerDay] = useState(["breakfast", "lunch", "dinner"]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [maxCookTime, setMaxCookTime] = useState("");
  const [selectedCuisineCodes, setSelectedCuisineCodes] = useState<string[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);

  const { members, isLoading: membersLoading } = useHouseholdMembers();
  const addMember = useAddMember();
  const generatePlan = useGeneratePlan();
  const { data: cuisineOptions = [], isLoading: cuisinesLoading } = useQuery({
    queryKey: ["taxonomy", "cuisines"],
    queryFn: () => apiGetCuisines(),
    staleTime: 5 * 60_000,
  });

  const initMembers = useMemo(() => {
    if (selectedMemberIds.length === 0 && members.length > 0 && step >= 1) {
      const ownerIds = members.filter((m) => m.isProfileOwner).map((m) => m.id);
      if (ownerIds.length > 0) return ownerIds;
      return [members[0].id];
    }
    return selectedMemberIds;
  }, [members, selectedMemberIds, step]);

  const effectiveSelectedIds = selectedMemberIds.length > 0 ? selectedMemberIds : initMembers;
  const selectedCuisineLabels = useMemo(() => {
    const map = new Map(cuisineOptions.map((c) => [c.code, c.name || c.code]));
    return selectedCuisineCodes.map((code) => map.get(code) || code);
  }, [cuisineOptions, selectedCuisineCodes]);

  const toggleMeal = (mealId: string) => {
    setMealsPerDay((prev) =>
      prev.includes(mealId) ? prev.filter((m) => m !== mealId) : [...prev, mealId]
    );
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleCuisine = (code: string) => {
    setSelectedCuisineCodes((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  const handleGenerate = async () => {
    const params: MealPlanGenerateParams = {
      startDate,
      endDate,
      memberIds: effectiveSelectedIds,
      mealsPerDay,
      budgetAmount: budget ? parseFloat(budget) : undefined,
      preferences: {
        maxCookTime: maxCookTime ? parseInt(maxCookTime, 10) : undefined,
        cuisines: selectedCuisineCodes.length > 0 ? selectedCuisineCodes : undefined,
      },
    };

    try {
      const result = await generatePlan.mutateAsync(params);
      onPlanGenerated(result);
    } catch {
      // Error handled by mutation state
    }
  };

  const steps = [
    { title: "Date Range & Meals", description: "When and what meals to plan" },
    { title: "Family Members", description: "Who is this plan for" },
    { title: "Preferences", description: "Budget and cooking preferences" },
    { title: "Review & Generate", description: "Confirm and create your plan" },
  ];

  if (generatePlan.isPending) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold">Generating Your Meal Plan</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Our AI is creating a personalized meal plan that respects all dietary needs,
              nutrition targets, and preferences. This may take 10-15 seconds...
            </p>
            <div className="w-full max-w-xs space-y-3 mt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 shrink-0 ${i <= step ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                i < step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i === step
                  ? "border-primary text-primary"
                  : "border-muted"
              }`}
            >
              {i + 1}
            </div>
            <span className="text-xs hidden sm:inline">{s.title}</span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step].title}</CardTitle>
          <p className="text-sm text-muted-foreground">{steps[step].description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 0: Date Range & Meals */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setEndDate(addDays(e.target.value, 6));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meals to Plan</Label>
                <div className="flex flex-wrap gap-3">
                  {MEAL_OPTIONS.map((meal) => (
                    <label
                      key={meal.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={mealsPerDay.includes(meal.id)}
                        onCheckedChange={() => toggleMeal(meal.id)}
                      />
                      <span className="text-sm">{meal.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 1: Family Members */}
          {step === 1 && (
            <>
              {membersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (
                <>
                  <MemberTargets
                    members={members}
                    selectedIds={effectiveSelectedIds}
                    onToggle={toggleMember}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddMember(true)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Family Member
                  </Button>
                </>
              )}
              <AddMemberForm
                open={showAddMember}
                onOpenChange={setShowAddMember}
                onSubmit={(data) => {
                  addMember.mutate(data, {
                    onSuccess: () => setShowAddMember(false),
                  });
                }}
                isSubmitting={addMember.isPending}
              />
            </>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Weekly Budget (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 150"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="pl-7"
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cook-time">Max Cook Time per Meal (minutes, optional)</Label>
                <Input
                  id="cook-time"
                  type="number"
                  placeholder="e.g., 45"
                  value={maxCookTime}
                  onChange={(e) => setMaxCookTime(e.target.value)}
                  min={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Cuisines (optional)</Label>
                {cuisinesLoading ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto rounded-md border p-2">
                    {cuisineOptions.map((cuisine) => (
                      <label
                        key={cuisine.code}
                        className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={selectedCuisineCodes.includes(cuisine.code)}
                          onCheckedChange={() => toggleCuisine(cuisine.code)}
                        />
                        <span className="text-sm">{cuisine.name || cuisine.code}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                <p><strong>Dates:</strong> {startDate} to {endDate}</p>
                <p><strong>Meals:</strong> {mealsPerDay.join(", ")}</p>
                <p>
                  <strong>Members:</strong>{" "}
                  {members
                    .filter((m) => effectiveSelectedIds.includes(m.id))
                    .map((m) => m.fullName)
                    .join(", ") || "None selected"}
                </p>
                {budget && <p><strong>Budget:</strong> ${budget}</p>}
                {maxCookTime && <p><strong>Max cook time:</strong> {maxCookTime} min</p>}
                {selectedCuisineLabels.length > 0 && (
                  <p><strong>Cuisines:</strong> {selectedCuisineLabels.join(", ")}</p>
                )}
              </div>

              {generatePlan.isError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {generatePlan.error?.message || "Failed to generate plan. Please try again."}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {step < steps.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && effectiveSelectedIds.length === 0}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={effectiveSelectedIds.length === 0 || mealsPerDay.length === 0}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Plan
          </Button>
        )}
      </div>
    </div>
  );
}
