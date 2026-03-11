"use client";

import { AlertTriangle, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HouseholdMember } from "@/lib/types";

interface MemberTargetsProps {
  members: HouseholdMember[];
  selectedIds: string[];
  onToggle: (memberId: string) => void;
}

export function MemberTargets({ members, selectedIds, onToggle }: MemberTargetsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Family Members</h3>
      <p className="text-xs text-muted-foreground">
        Select which members this plan is for. The AI will respect each member&apos;s dietary restrictions.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {members.map((member) => {
          const selected = selectedIds.includes(member.id);
          const hp = member.healthProfile;
          const hasNoProfile = !hp || (!hp.targetCalories && hp.allergens.length === 0 && hp.diets.length === 0);

          return (
            <Card
              key={member.id}
              className={`cursor-pointer transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              }`}
              onClick={() => onToggle(member.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      selected ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.householdRole?.replace("_", " ")}
                        {member.age ? `, ${member.age}y` : ""}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggle(member.id)}
                    className="mt-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {hp && !hasNoProfile && (
                  <div className="mt-2 space-y-1">
                    {hp.targetCalories && (
                      <p className="text-xs text-muted-foreground">
                        Target: {hp.targetCalories} cal/day
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {hp.allergens.map((a) => (
                        <Badge key={a.id} variant="destructive" className="text-[10px] h-4">
                          {a.name}
                        </Badge>
                      ))}
                      {hp.diets.map((d) => (
                        <Badge key={d.id} variant="secondary" className="text-[10px] h-4">
                          {d.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {hasNoProfile && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    No health profile set
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
