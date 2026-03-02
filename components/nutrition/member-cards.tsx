"use client";

import type { NutritionMemberSummaryResponse } from "@/lib/types";

interface MemberCardsProps {
  summary: NutritionMemberSummaryResponse | null;
}

function statusStyle(status: string) {
  if (status === "ok") return { bg: "#F0FDF4", text: "#16A34A", label: "On Track" };
  if (status === "under") return { bg: "#FFFBEB", text: "#D97706", label: "Under" };
  if (status === "over") return { bg: "#FEF2F2", text: "#DC2626", label: "Over" };
  return { bg: "#F8FAFC", text: "#94A3B8", label: "No Data" };
}

export function MemberCards({ summary }: MemberCardsProps) {
  const members = summary?.members ?? [];

  return (
    <section
      className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
      style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
    >
      <h3
        className="text-[14px] font-bold text-[#0F172A] mb-3"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        Household Summary
      </h3>

      {members.length === 0 ? (
        <p className="text-[14px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
          No member summary available.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {members.map((m) => {
            const st = statusStyle(m.status);
            return (
              <div
                key={m.memberId}
                className="rounded-[20px] border border-[#F1F5F9] p-4 flex items-center justify-between"
                style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.03)" }}
              >
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-[14px] font-semibold text-[#0F172A] truncate"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {m.name}
                  </span>
                  <span
                    className="text-[13px] text-[#64748B]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {Math.round(m.calories)} kcal
                    {m.targetCalories ? ` / ${Math.round(m.targetCalories)} kcal` : ""}
                  </span>
                  <span
                    className="text-[12px] text-[#94A3B8]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {m.itemCount} items logged
                  </span>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold shrink-0"
                  style={{ background: st.bg, color: st.text }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
