"use client";

interface BudgetRingProps {
  spent: number;
  budgetAmount: number | null;
  remaining: number | null;
  utilizationPct: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function BudgetRing({ spent, budgetAmount, remaining, utilizationPct }: BudgetRingProps) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const pct = clamp(utilizationPct ?? 0, 0, 100);
  const offset = circumference - (pct / 100) * circumference;
  const overBudget = budgetAmount != null && spent > budgetAmount;

  return (
    <div
      className="bg-white rounded-[16px] border border-[#F1F5F9] p-4 lg:p-5 flex flex-col items-center"
      style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
    >
      <h3 className="text-[14px] font-medium text-[#64748B] mb-3 self-start" style={{ fontFamily: "Inter, sans-serif" }}>
        Budget Utilization
      </h3>

      {/* Large ring */}
      <div className="relative mb-4">
        <svg width="192" height="192" viewBox="0 0 192 192">
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="14"
          />
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke={overBudget ? "#EF4444" : "#99CC33"}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 96 96)"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p
            className="text-[36px] font-bold text-[#0F172A]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {Math.round(utilizationPct ?? 0)}%
          </p>
          <p
            className="text-[13px] text-[#94A3B8]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {overBudget ? "over budget" : "used"}
          </p>
        </div>
      </div>

      {/* Spent vs Budget side-by-side */}
      <div className="w-full grid grid-cols-2 gap-3">
        <div className="bg-[#F7F8F6] rounded-[12px] p-3 text-center">
          <p className="text-[11px] text-[#94A3B8] mb-0.5" style={{ fontFamily: "Inter, sans-serif" }}>Spent</p>
          <p className="text-[18px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
            ${spent.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#F7F8F6] rounded-[12px] p-3 text-center">
          <p className="text-[11px] text-[#94A3B8] mb-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            {overBudget ? "Over" : "Remaining"}
          </p>
          <p
            className={`text-[18px] font-bold ${overBudget ? "text-[#EF4444]" : "text-[#538100]"}`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {remaining == null ? "-" : `$${Math.abs(remaining).toFixed(2)}`}
          </p>
        </div>
      </div>
    </div>
  );
}
