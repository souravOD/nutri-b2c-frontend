"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { PlanGenerator } from "@/components/meal-plan/plan-generator";
import { WeeklyCalendar } from "@/components/meal-plan/weekly-calendar";
import { PlanSummary } from "@/components/meal-plan/plan-summary";
import { SwapModal } from "@/components/meal-plan/swap-modal";
import {
  useMealPlans,
  useMealPlanDetail,
  useActivatePlan,
  useSwapMeal,
  useRegeneratePlan,
  useDeletePlan,
  useLogMealFromPlan,
} from "@/hooks/use-meal-plan";
import { useGenerateGroceryList } from "@/hooks/use-grocery-list";
import { useHouseholdMembers } from "@/hooks/use-household";
import { useToast } from "@/hooks/use-toast";
import type { MealPlanItem, MealPlanGenerateResponse } from "@/lib/types";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  archived: "bg-gray-100 text-gray-800",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function MealPlanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showGenerator, setShowGenerator] = useState(false);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [swapItem, setSwapItem] = useState<MealPlanItem | null>(null);

  const { plans, isLoading: plansLoading, refetch: refetchPlans } = useMealPlans();
  const { members } = useHouseholdMembers();

  const activePlan = plans.find((p) => p.status === "active");
  const selectedPlanId = activePlanId || activePlan?.id || null;
  const { plan: planDetail, items: planItems, isLoading: detailLoading, refetch: refetchDetail } =
    useMealPlanDetail(selectedPlanId);

  const activatePlanMut = useActivatePlan();
  const swapMealMut = useSwapMeal();
  const regenerateMut = useRegeneratePlan();
  const deletePlanMut = useDeletePlan();
  const logMealMut = useLogMealFromPlan();
  const generateGroceryMut = useGenerateGroceryList();

  const handlePlanGenerated = useCallback(
    (result: MealPlanGenerateResponse) => {
      setShowGenerator(false);
      setActivePlanId(result.plan.id);
      refetchPlans();
      toast({
        title: "Plan Generated",
        description: `${result.items.length} meals planned. ${result.summary}`,
      });
    },
    [refetchPlans, toast]
  );

  const handleSwap = useCallback(
    (itemId: string, reason?: string) => {
      if (!selectedPlanId) return;
      swapMealMut.mutate(
        { planId: selectedPlanId, itemId, reason },
        {
          onSuccess: (data) => {
            setSwapItem(null);
            toast({
              title: "Meal Swapped",
              description: data.reasoning,
            });
          },
          onError: (err) => {
            toast({
              title: "Swap Failed",
              description: err.message,
              variant: "destructive",
            });
          },
        }
      );
    },
    [selectedPlanId, swapMealMut, toast]
  );

  const handleLogMeal = useCallback(
    (item: MealPlanItem) => {
      if (!selectedPlanId) return;
      logMealMut.mutate(
        { planId: selectedPlanId, itemId: item.id },
        {
          onSuccess: () => {
            toast({ title: "Logged", description: "Meal added to your daily log." });
            refetchDetail();
          },
          onError: (err) => {
            toast({ title: "Log Failed", description: err.message, variant: "destructive" });
          },
        }
      );
    },
    [selectedPlanId, logMealMut, toast, refetchDetail]
  );

  if (showGenerator) {
    return (
      <main className="container max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create Meal Plan</h1>
          <Button variant="ghost" onClick={() => setShowGenerator(false)}>
            Cancel
          </Button>
        </div>
        <PlanGenerator onPlanGenerated={handlePlanGenerated} />
      </main>
    );
  }

  return (
    <main className="container max-w-5xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Meal Plans
        </h1>
        <Button onClick={() => setShowGenerator(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      {plansLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Meal Plans Yet</h2>
            <p className="text-muted-foreground mb-4">
              Let AI create a personalized weekly meal plan for your family.
            </p>
            <Button onClick={() => setShowGenerator(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Plan</TabsTrigger>
            <TabsTrigger value="history">Plan History</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {!selectedPlanId || !planDetail ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No active plan. Create a new one or activate an existing plan.
                  </p>
                </CardContent>
              </Card>
            ) : detailLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : (
              <>
                {/* Plan header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {planDetail.planName || "Weekly Plan"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {planDetail.startDate} to {planDetail.endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[planDetail.status] || ""}>
                      {planDetail.status}
                    </Badge>
                    {planDetail.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => activatePlanMut.mutate(planDetail.id, {
                          onSuccess: () => {
                            refetchPlans();
                            refetchDetail();
                            toast({ title: "Plan Activated" });
                          },
                        })}
                        disabled={activatePlanMut.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => regenerateMut.mutate(planDetail.id, {
                        onSuccess: (res) => {
                          setActivePlanId(res.plan.id);
                          refetchPlans();
                          toast({ title: "Plan Regenerated" });
                        },
                      })}
                      disabled={regenerateMut.isPending}
                    >
                      {regenerateMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-1" />
                      )}
                      Regenerate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePlanMut.mutate(planDetail.id, {
                        onSuccess: () => {
                          setActivePlanId(null);
                          refetchPlans();
                          toast({ title: "Plan Deleted" });
                        },
                      })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push("/budget")}
                    >
                      Budget
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        generateGroceryMut.mutate(
                          { mealPlanId: planDetail.id },
                          {
                            onSuccess: (result) => {
                              toast({ title: "Grocery List Ready" });
                              router.push(`/grocery-list?listId=${result.list.id}&mealPlanId=${planDetail.id}`);
                            },
                            onError: (err: unknown) => {
                              toast({
                                title: "Grocery Generation Failed",
                                description: getErrorMessage(err, "Try again"),
                                variant: "destructive",
                              });
                            },
                          }
                        )
                      }
                      disabled={generateGroceryMut.isPending}
                    >
                      {generateGroceryMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Grocery List"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Summary */}
                <PlanSummary plan={planDetail} items={planItems} members={members} />

                {/* Calendar */}
                <WeeklyCalendar
                  items={planItems}
                  startDate={planDetail.startDate}
                  endDate={planDetail.endDate}
                  mealsPerDay={planDetail.mealsPerDay || ["breakfast", "lunch", "dinner"]}
                  onSwap={setSwapItem}
                  onLogMeal={handleLogMeal}
                  onViewRecipe={(id) => router.push(`/recipes/${id}`)}
                />

                {/* Swap modal */}
                <SwapModal
                  item={swapItem}
                  open={!!swapItem}
                  onOpenChange={(open) => { if (!open) setSwapItem(null); }}
                  onConfirmSwap={handleSwap}
                  isSwapping={swapMealMut.isPending}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {plans
              .filter((p) => p.status !== "active")
              .map((p) => (
                <Card
                  key={p.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setActivePlanId(p.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{p.planName || "Meal Plan"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.startDate} to {p.endDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={statusColors[p.status] || ""}>
                        {p.status}
                      </Badge>
                      {p.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            activatePlanMut.mutate(p.id, {
                              onSuccess: () => {
                                refetchPlans();
                                toast({ title: "Plan Activated" });
                              },
                            });
                          }}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            {plans.filter((p) => p.status !== "active").length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No plan history yet.
              </p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
