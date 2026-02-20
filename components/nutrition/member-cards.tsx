"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NutritionMemberSummaryResponse } from "@/lib/types";

interface MemberCardsProps {
  summary: NutritionMemberSummaryResponse | null;
}

function statusVariant(status: string): "default" | "outline" | "secondary" | "destructive" {
  if (status === "ok") return "default";
  if (status === "under") return "secondary";
  if (status === "over") return "destructive";
  return "outline";
}

export function MemberCards({ summary }: MemberCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Household Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {(summary?.members ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No member summary available.</p>
        ) : (
          summary!.members.map((member) => (
            <div key={member.memberId} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">{member.name}</p>
                <Badge variant={statusVariant(member.status)}>{member.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round(member.calories)} kcal
                {member.targetCalories ? ` / ${Math.round(member.targetCalories)} kcal` : ""}
              </p>
              <p className="text-xs text-muted-foreground">{member.itemCount} items logged</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

