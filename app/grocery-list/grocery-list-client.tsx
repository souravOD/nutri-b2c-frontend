"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Share2, ShoppingBasket } from "lucide-react";
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
import { useBudgetSnapshot } from "@/hooks/use-budget";
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
  const { snapshot: budgetSnapshot } = useBudgetSnapshot({ period: "weekly" });

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
    updateItem.mutate({ itemId, payload: { isPurchased: checked } });
  };

  const handleUpdateActualPrice = (itemId: string, price?: number) => {
    updateItem.mutate({ itemId, payload: { ...(price != null ? { actualPrice: price } : {}) } });
  };

  const handleApplySubstitution = (itemId: string, productId: string) => {
    updateItem.mutate(
      { itemId, payload: { substitutedProductId: productId } },
      { onSuccess: () => toast({ title: "Substitution applied" }) }
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

  const handleShare = async () => {
    const text = items
      .map((i) => `${i.isPurchased ? "✅" : "⬜"} ${i.itemName} (${i.quantity} ${i.unit || ""})`)
      .join("\n");
    const shareData = { title: "Grocery List", text };
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "List copied to clipboard" });
      } catch { /* clipboard failed */ }
    } else {
      toast({ title: "Sharing not available" });
    }
  };

  // Computed values
  const totalItems = summary?.totalItems ?? items.length;
  const purchasedItems = summary?.purchasedItems ?? items.filter((i) => i.isPurchased).length;
  const budgetSpent = budgetSnapshot?.spent ?? 0;
  const budgetAmount = budgetSnapshot?.budget?.amount ?? 0;
  const budgetPct = budgetSnapshot?.utilizationPct ?? 0;

  if (listsLoading && !list) {
    return (
      <div className="min-h-screen bg-[#F7F8F6] pb-[100px] lg:pb-10">
        <div className="w-full max-w-[600px] lg:max-w-[960px] mx-auto px-4 lg:px-6 pt-8">
          <div className="flex items-center gap-2 text-[14px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>
            <Loader2 className="h-4 w-4 animate-spin" /> Loading grocery lists...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F6] pb-[100px] lg:pb-10">
      <div className="w-full max-w-[600px] lg:max-w-[960px] mx-auto px-4 lg:px-6">

        {/* ═══ Header ══════════════════════════════════════════════════════ */}
        <header className="pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#99CC33] flex items-center justify-center lg:hidden">
                <ShoppingBasket className="w-4 h-4 text-white" />
              </div>
              <h1
                className="text-[20px] lg:text-[28px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Grocery & Budget
              </h1>
            </div>

            {/* Desktop: list selector */}
            <div className="hidden lg:flex items-center gap-2">
              {lists.length > 1 && (
                <select
                  value={selectedListId ?? ""}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20 max-w-[220px] truncate"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {lists.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.listName || "Grocery List"} · {entry.status}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Mobile: list selector */}
          {lists.length > 1 && (
            <div className="mt-3 lg:hidden">
              <select
                value={selectedListId ?? ""}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {lists.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.listName || "Grocery List"} · {entry.status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* ═══ Section 1: Overview Cards ════════════════════════════════════ */}
        <section className="space-y-4 pt-2">

          {/* Grocery List Summary Card */}
          <div
            className="bg-white rounded-[16px] border border-[#F1F5F9] p-4 lg:p-5"
            style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[12px] bg-[#ECFCCB] flex items-center justify-center flex-shrink-0">
                <ShoppingBasket className="w-7 h-7 lg:w-8 lg:h-8 text-[#538100]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] lg:text-[18px] font-semibold text-[#0F172A] truncate" style={{ fontFamily: "Inter, sans-serif" }}>
                  {list?.listName || "Smart Grocery List"}
                </h3>
                <p className="text-[13px] text-[#64748B] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                  {totalItems} items · {purchasedItems} purchased
                </p>
                {!list ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <select
                      value={selectedPlanId ?? ""}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="h-8 px-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] text-[#0F172A] focus:outline-none w-full truncate"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      <option value="">Select meal plan</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.planName || `${plan.startDate} to ${plan.endDate}`}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleGenerate}
                      disabled={generateList.isPending}
                      className="h-8 px-4 rounded-full bg-[#99CC33] text-white text-[13px] font-medium hover:bg-[#88BB22] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 w-full"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {generateList.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Generate List
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => document.getElementById("smart-list-section")?.scrollIntoView({ behavior: "smooth" })}
                    className="mt-2 h-8 px-4 rounded-full bg-[#99CC33] text-white text-[13px] font-medium hover:bg-[#88BB22] transition-colors"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    View Smart List ↓
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Budget Tracker Card */}
          <div
            className="bg-white rounded-[16px] border border-[#F1F5F9] p-4 lg:p-5"
            style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Mini budget ring */}
              <div className="w-14 h-14 lg:w-16 lg:h-16 flex-shrink-0 relative">
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#E2E8F0" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke={budgetSpent > budgetAmount && budgetAmount > 0 ? "#EF4444" : "#99CC33"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - Math.min(budgetPct, 100) / 100)}`}
                    transform="rotate(-90 32 32)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {Math.round(budgetPct)}%
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] lg:text-[18px] font-semibold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                  Budget Tracker
                </h3>
                <p className="text-[13px] text-[#64748B] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                  ${budgetSpent.toFixed(0)} / {budgetAmount > 0 ? `$${budgetAmount.toFixed(0)}` : "Not set"}
                </p>
                <button
                  onClick={() => router.push("/budget")}
                  className="mt-2 h-8 px-4 rounded-full border border-[#99CC33] text-[#538100] text-[13px] font-medium hover:bg-[#ECFCCB] transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  View Budget →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="bg-white rounded-[16px] border border-[#F1F5F9] p-3 lg:p-4 text-center"
              style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
            >
              <p className="text-[24px] lg:text-[28px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                {totalItems}
              </p>
              <p className="text-[12px] text-[#64748B] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                Total Items
              </p>
            </div>
            <div
              className="bg-white rounded-[16px] border border-[#F1F5F9] p-3 lg:p-4 text-center"
              style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
            >
              <p className="text-[24px] lg:text-[28px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                ${n(estimatedTotal).toFixed(0)}
              </p>
              <p className="text-[12px] text-[#64748B] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                Estimated Total
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Section 2: Smart List ════════════════════════════════════════ */}
        {list && (
          <section id="smart-list-section" className="pt-6 pb-4">
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-[18px] lg:text-[22px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Your Smart List
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-[#F1F5F9] transition-colors"
                  aria-label="Share list"
                >
                  <Share2 className="w-4 h-4 text-[#64748B]" />
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="h-8 px-3 rounded-full bg-[#99CC33] text-white text-[13px] font-medium hover:bg-[#88BB22] transition-colors flex items-center gap-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
            </div>

            {/* Status actions */}
            {list.status === "purchased" && (
              <div
                className="bg-[#ECFCCB] rounded-[12px] p-3 mb-3 flex items-center justify-between"
              >
                <p className="text-[13px] text-[#538100] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                  ✅ Shopping completed
                </p>
                <button
                  onClick={handleReopenList}
                  disabled={updateListStatus.isPending}
                  className="text-[13px] text-[#538100] font-medium underline hover:no-underline"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Reopen
                </button>
              </div>
            )}

            {/* Category sections */}
            {detailLoading ? (
              <div className="flex items-center gap-2 text-[14px] text-[#64748B] py-6" style={{ fontFamily: "Inter, sans-serif" }}>
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
          </section>
        )}

        {/* No list available */}
        {!list && !listsLoading && (
          <section className="pt-6">
            <div
              className="bg-white rounded-[16px] border border-[#F1F5F9] p-8 text-center"
              style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div className="w-16 h-16 rounded-full bg-[#ECFCCB] flex items-center justify-center mx-auto mb-4">
                <ShoppingBasket className="w-8 h-8 text-[#538100]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                No Grocery List Yet
              </h3>
              <p className="text-[13px] text-[#64748B] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                Generate one from a meal plan to get started.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generateList.isPending}
                className="h-10 px-6 rounded-full bg-[#99CC33] text-white text-[14px] font-medium hover:bg-[#88BB22] transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {generateList.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate Smart List
              </button>
            </div>
          </section>
        )}

        {/* Floating total bar */}
        {list && list.status === "active" && (
          <div className="fixed bottom-[72px] lg:bottom-4 left-0 right-0 z-40 px-4 lg:px-0">
            <div className="max-w-[600px] lg:max-w-[960px] mx-auto">
              <div
                className="bg-[#0F172A] rounded-[16px] px-5 py-3 flex items-center justify-between"
                style={{ boxShadow: "0px 4px 16px rgba(0,0,0,0.16)" }}
              >
                <div>
                  <p className="text-[13px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                    Estimated Total
                  </p>
                  <p className="text-[20px] font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                    ${n(estimatedTotal).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {purchasedItems}/{totalItems} done
                  </span>
                  <button
                    onClick={handleCompleteList}
                    disabled={updateListStatus.isPending}
                    className="h-9 px-4 rounded-full bg-[#99CC33] text-white text-[13px] font-medium hover:bg-[#88BB22] transition-colors disabled:opacity-50"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddItemModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={handleAddItem}
        isSubmitting={addItem.isPending}
      />
    </div>
  );
}
