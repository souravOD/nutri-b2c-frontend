"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, PiggyBank } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useBudgetSnapshot, useCreateBudget, useUpdateBudget } from "@/hooks/use-budget";
import type { BudgetPeriod } from "@/lib/types";

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

export default function BudgetSetupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { snapshot, isLoading } = useBudgetSnapshot({ period: "weekly" });
    const createBudget = useCreateBudget();
    const updateBudget = useUpdateBudget();

    const budget = snapshot?.budget ?? null;
    const isSaving = createBudget.isPending || updateBudget.isPending;

    const [amount, setAmount] = useState("");
    const [period, setPeriod] = useState<BudgetPeriod>("weekly");

    useEffect(() => {
        if (budget) {
            setAmount(String(budget.amount));
            setPeriod(budget.period ?? "weekly");
        }
    }, [budget]);

    const handleSave = () => {
        const parsed = Number.parseFloat(amount);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            toast({ title: "Enter a valid amount", variant: "destructive" });
            return;
        }

        if (budget) {
            updateBudget.mutate(
                { budgetId: budget.id, payload: { amount: parsed, period } },
                {
                    onSuccess: () => {
                        toast({ title: "Budget updated" });
                        router.push("/budget");
                    },
                    onError: (error) =>
                        toast({
                            title: "Update failed",
                            description: getErrorMessage(error, "Unable to update budget."),
                            variant: "destructive",
                        }),
                }
            );
            return;
        }

        createBudget.mutate(
            { amount: parsed, period, budgetType: "grocery", currency: "USD" },
            {
                onSuccess: () => {
                    toast({ title: "Budget created" });
                    router.push("/budget");
                },
                onError: (error) =>
                    toast({
                        title: "Create failed",
                        description: getErrorMessage(error, "Unable to create budget."),
                        variant: "destructive",
                    }),
            }
        );
    };

    if (isLoading && !snapshot) {
        return (
            <div className="min-h-screen bg-[#F7F8F6] pb-[100px] lg:pb-10">
                <div className="w-full max-w-[600px] lg:max-w-[960px] mx-auto px-4 lg:px-6 pt-8">
                    <div className="flex items-center gap-2 text-[14px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F8F6] pb-[100px] lg:pb-10">
            <div className="w-full max-w-[600px] lg:max-w-[960px] mx-auto px-4 lg:px-6">

                {/* ═══ Header ══════════════════════════════════════════════════════ */}
                <header className="pt-6 pb-4">
                    <div className="flex items-center gap-2">
                        <Link href="/budget">
                            <div className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F7F8F6] transition-colors">
                                <ArrowLeft className="w-4 h-4 text-[#0F172A]" />
                            </div>
                        </Link>
                        <h1
                            className="text-[20px] lg:text-[28px] font-bold text-[#0F172A]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Budget Setup
                        </h1>
                    </div>
                </header>

                {/* ═══ Main Content ═════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

                    {/* Left: Hero illustration / empty state */}
                    <div
                        className="bg-white rounded-[20px] border border-[#F1F5F9] p-6 lg:p-8 flex flex-col items-center justify-center text-center min-h-[280px] lg:min-h-[380px]"
                        style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
                    >
                        <div className="w-20 h-20 rounded-full bg-[#ECFCCB] flex items-center justify-center mb-5">
                            <PiggyBank className="w-10 h-10 text-[#538100]" />
                        </div>
                        <h2
                            className="text-[20px] lg:text-[24px] font-bold text-[#0F172A] mb-2"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {budget ? "Update Your Budget" : "Set Your Budget"}
                        </h2>
                        <p
                            className="text-[14px] text-[#64748B] max-w-[280px] leading-5"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {budget
                                ? "Adjust your grocery budget to better match your spending habits."
                                : "Track your grocery spending by setting a weekly or monthly budget target."
                            }
                        </p>
                    </div>

                    {/* Right: Setup form */}
                    <div
                        className="bg-white rounded-[20px] border border-[#F1F5F9] p-5 lg:p-6"
                        style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
                    >
                        {/* Frequency toggle */}
                        <div className="mb-5">
                            <label
                                className="block text-[13px] font-medium text-[#0F172A] mb-2"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                Frequency
                            </label>
                            <div className="flex items-center bg-[#F7F8F6] rounded-full p-1">
                                {(["weekly", "monthly"] as BudgetPeriod[]).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`flex-1 h-9 rounded-full text-[13px] font-medium transition-all ${period === p
                                                ? "bg-[#99CC33] text-white shadow-sm"
                                                : "text-[#64748B] hover:text-[#0F172A]"
                                            }`}
                                        style={{ fontFamily: "Inter, sans-serif" }}
                                    >
                                        {p === "weekly" ? "Weekly" : "Monthly"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount input */}
                        <div className="mb-5">
                            <label
                                htmlFor="budget-amount"
                                className="block text-[13px] font-medium text-[#0F172A] mb-2"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                Target Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px] font-semibold text-[#94A3B8]">$</span>
                                <input
                                    id="budget-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="150.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full h-12 pl-8 pr-3 rounded-[12px] border border-[#E2E8F0] bg-white text-[18px] font-semibold text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-2 focus:ring-[#99CC33]/20"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                />
                            </div>
                        </div>

                        {/* Household sharing note */}
                        <div className="bg-[#F0F9FF] rounded-[12px] border border-[#BAE6FD] p-3 mb-5">
                            <p className="text-[12px] text-[#0284C7] leading-4" style={{ fontFamily: "Inter, sans-serif" }}>
                                💡 This budget is shared across your household. All members' purchases will be tracked against this amount.
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !amount.trim()}
                                className="h-11 w-full rounded-full bg-[#99CC33] text-white text-[14px] font-semibold hover:bg-[#88BB22] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {budget ? "Update Budget" : "Save Budget"}
                            </button>
                            <Link
                                href={budget ? "/budget" : "/grocery-list"}
                                className="h-11 w-full rounded-full border border-[#E2E8F0] text-[#64748B] text-[14px] font-medium hover:bg-[#F7F8F6] transition-colors inline-flex items-center justify-center"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                {budget ? "Cancel" : "Skip for now"}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
