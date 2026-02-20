"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddItemModal } from "@/components/grocery/add-item-modal";
import { CostSummary } from "@/components/grocery/cost-summary";
import { ListView } from "@/components/grocery/list-view";
import {
  useAddGroceryItem,
  useDeleteGroceryItem,
  useGenerateGroceryList,
  useGroceryListDetail,
  useGroceryLists,
  useUpdateGroceryListStatus,
  useUpdateGroceryItem,
} from "@/hooks/use-grocery-list";
import { useMealPlans } from "@/hooks/use-meal-plan";
import { useToast } from "@/hooks/use-toast";

function n(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "string" ? parseFloat(value) || 0 : value;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function GroceryListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const initialMealPlanId = searchParams.get("mealPlanId") || undefined;
  const initialListId = searchParams.get("listId");

  const { lists, isLoading: listsLoading } = useGroceryLists();
  const { plans } = useMealPlans();

  const [selectedListId, setSelectedListId] = useState<string | null>(initialListId ?? null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(initialMealPlanId);
  const [showAddModal, setShowAddModal] = useState(false);

  const activeList = useMemo(
    () => lists.find((list) => list.status === "active") ?? null,
    [lists]
  );

  useEffect(() => {
    if (!selectedListId) {
      setSelectedListId(activeList?.id ?? lists[0]?.id ?? null);
    }
  }, [activeList, lists, selectedListId]);

  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      const activePlan = plans.find((plan) => plan.status === "active");
      setSelectedPlanId(activePlan?.id ?? plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const { list, items, estimatedTotal, summary, isLoading: detailLoading } = useGroceryListDetail(selectedListId);

  const generateList = useGenerateGroceryList();
  const updateItem = useUpdateGroceryItem(selectedListId);
  const addItem = useAddGroceryItem(selectedListId);
  const deleteItem = useDeleteGroceryItem(selectedListId);
  const updateListStatus = useUpdateGroceryListStatus(selectedListId);

  const handleGenerate = () => {
    generateList.mutate(
      selectedPlanId ? { mealPlanId: selectedPlanId } : {},
      {
        onSuccess: (result) => {
          setSelectedListId(result.list.id);
          toast({
            title: "Grocery list generated",
            description: `${result.items.length} items created from meal plan.`,
          });
        },
        onError: (error: unknown) => {
          toast({
            title: "Generation failed",
            description: getErrorMessage(error, "Unable to generate list"),
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleTogglePurchased = (itemId: string, checked: boolean) => {
    updateItem.mutate({
      itemId,
      payload: { isPurchased: checked },
    });
  };

  const handleUpdateActualPrice = (itemId: string, price?: number) => {
    updateItem.mutate({
      itemId,
      payload: { ...(price != null ? { actualPrice: price } : {}) },
    });
  };

  const handleApplySubstitution = (itemId: string, productId: string) => {
    updateItem.mutate(
      {
        itemId,
        payload: { substitutedProductId: productId },
      },
      {
        onSuccess: () => {
          toast({ title: "Substitution applied" });
        },
      }
    );
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItem.mutate(itemId, {
      onSuccess: () => toast({ title: "Item removed" }),
      onError: (error: unknown) =>
        toast({
          title: "Delete failed",
          description: getErrorMessage(error, "Unable to delete item"),
          variant: "destructive",
        }),
    });
  };

  const handleAddItem = (payload: {
    itemName: string;
    quantity: number;
    unit?: string;
    category?: string;
    estimatedPrice?: number;
  }) => {
    addItem.mutate(payload, {
      onSuccess: () => {
        setShowAddModal(false);
        toast({ title: "Item added" });
      },
      onError: (error: unknown) =>
        toast({
          title: "Add failed",
          description: getErrorMessage(error, "Unable to add item"),
          variant: "destructive",
        }),
    });
  };

  const handleCompleteList = () => {
    if (!list) return;
    updateListStatus.mutate("purchased", {
      onSuccess: () => toast({ title: "Shopping completed" }),
      onError: (error: unknown) =>
        toast({
          title: "Unable to complete list",
          description: getErrorMessage(error, "Try again"),
          variant: "destructive",
        }),
    });
  };

  const handleReopenList = () => {
    if (!list) return;
    updateListStatus.mutate("active", {
      onSuccess: () => toast({ title: "List reopened" }),
      onError: (error: unknown) =>
        toast({
          title: "Unable to reopen list",
          description: getErrorMessage(error, "Try again"),
          variant: "destructive",
        }),
    });
  };

  if (listsLoading && !list) {
    return (
      <main className="container mx-auto max-w-4xl px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading grocery lists...
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl space-y-4 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShoppingBasket className="h-6 w-6" />
          Grocery List
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/budget")}>
            Budget
          </Button>
          <Select value={selectedPlanId} onValueChange={(v) => setSelectedPlanId(v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select meal plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.planName || `${plan.startDate} to ${plan.endDate}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleGenerate} disabled={generateList.isPending}>
            {generateList.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate List
          </Button>
        </div>
      </div>

      {lists.length > 0 && (
        <Select value={selectedListId ?? undefined} onValueChange={(v) => setSelectedListId(v)}>
          <SelectTrigger className="w-full sm:w-[320px]">
            <SelectValue placeholder="Select grocery list" />
          </SelectTrigger>
          <SelectContent>
            {lists.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.listName || "Grocery List"} · {entry.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!list ? (
        <div className="rounded-md border p-6 text-sm text-muted-foreground">
          No grocery list available yet. Generate one from a meal plan.
        </div>
      ) : (
        <>
          <CostSummary estimatedTotal={n(estimatedTotal)} summary={summary} />

          <div className="flex flex-wrap justify-end gap-2">
            {list.status === "active" && (
              <Button
                variant="default"
                onClick={handleCompleteList}
                disabled={updateListStatus.isPending}
              >
                Complete Shopping
              </Button>
            )}
            {list.status === "purchased" && (
              <Button
                variant="secondary"
                onClick={handleReopenList}
                disabled={updateListStatus.isPending}
              >
                Reopen List
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Custom Item
            </Button>
          </div>

          {detailLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Refreshing list...
            </div>
          ) : (
            <ListView
              listId={list.id}
              items={items}
              onTogglePurchased={handleTogglePurchased}
              onUpdateActualPrice={handleUpdateActualPrice}
              onApplySubstitution={handleApplySubstitution}
              onDelete={handleDeleteItem}
            />
          )}
        </>
      )}

      <AddItemModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={handleAddItem}
        isSubmitting={addItem.isPending}
      />
    </main>
  );
}

