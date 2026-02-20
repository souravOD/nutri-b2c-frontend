"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

import {
  apiGetMyOverview,
  apiGetMyHealth,
  apiDeleteProfileRows,
  apiDeleteAccount,
  apiUpdateOverview,
  apiUpdateHealth,
  apiGetAllergens,
  apiGetDietaryPreferences,
  apiGetHealthConditions,
} from "@/lib/api";

// 👉 single source of truth lists
import type { TaxonomyOption } from "@/lib/api";

/* If lib/data.ts already exports these, import them instead of defining here */
const activityOptions = [
  { value: "sedentary", label: "Sedentary" },
  { value: "lightly_active", label: "Lightly active" },
  { value: "moderately_active", label: "Moderately active" },
  { value: "very_active", label: "Very active" },
  { value: "extremely_active", label: "Extremely active" },
] as const;

const goalOptions = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "maintain_weight", label: "Maintain weight" },
  { value: "gain_weight", label: "Gain weight" },
  { value: "build_muscle", label: "Build muscle" },
] as const;

// ---------- types ----------
type Overview = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  diets?: string[] | null;
  allergens?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [k: string]: any;
};

type Health = {
  heightCm?: number | null;
  weightKg?: number | null;
  activityLevel?: string | null;
  healthGoal?: string | null;
  targetWeightKg?: number | null;
  targetCalories?: number | null;
  targetProteinG?: number | null;
  targetCarbsG?: number | null;
  targetFatG?: number | null;
  targetFiberG?: number | null;
  targetSodiumMg?: number | null;
  targetSugarG?: number | null;
  intolerances?: string[] | null;
  dislikedIngredients?: string[] | null;
  onboardingComplete?: boolean | null;
  conditions?: string[] | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [k: string]: any;
};

// ---------- helpers ----------
const show = (v: unknown, fallback = "Not set") =>
  v === null || v === undefined || v === "" ? fallback : String(v);

const list = (arr?: string[] | null, fallback = "None specified") =>
  arr && arr.length ? arr.join(", ") : fallback;

function normalizeOverview(row: any): Overview {
  if (!row) return {};
  return {
    fullName: row.fullName ?? row.full_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    dateOfBirth: row.dateOfBirth ?? row.date_of_birth ?? null,
    gender: row.gender ?? row.sex ?? null,
    diets: row.diets ?? [],
    allergens: row.allergens ?? [],
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function normalizeHealth(row: any): Health {
  if (!row) return {};
  return {
    heightCm: row.heightCm ?? row.height_cm ?? null,
    weightKg: row.weightKg ?? row.weight_kg ?? null,
    activityLevel: row.activityLevel ?? row.activity_level ?? null,
    healthGoal: row.healthGoal ?? row.health_goal ?? row.goal ?? null,
    targetWeightKg: row.targetWeightKg ?? row.target_weight_kg ?? null,
    targetCalories: row.targetCalories ?? row.target_calories ?? null,
    targetProteinG: row.targetProteinG ?? row.target_protein_g ?? null,
    targetCarbsG: row.targetCarbsG ?? row.target_carbs_g ?? null,
    targetFatG: row.targetFatG ?? row.target_fat_g ?? null,
    targetFiberG: row.targetFiberG ?? row.target_fiber_g ?? null,
    targetSodiumMg: row.targetSodiumMg ?? row.target_sodium_mg ?? null,
    targetSugarG: row.targetSugarG ?? row.target_sugar_g ?? null,
    intolerances: row.intolerances ?? [],
    dislikedIngredients: row.dislikedIngredients ?? row.disliked_ingredients ?? [],
    onboardingComplete: row.onboardingComplete ?? row.onboarding_complete ?? null,
    conditions: row.conditions ?? row.majorConditions ?? row.major_conditions ?? [],
    dateOfBirth: row.dateOfBirth ?? row.date_of_birth ?? null,
    gender: row.gender ?? row.sex ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function ageFromISO(iso?: string | null) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function bmiFrom(heightCm?: number | null, weightKg?: number | null) {
  if (!heightCm || !weightKg) return undefined;
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  return Math.round(bmi * 10) / 10;
}

// chip group used for multi-select lists
function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (item: string) =>
    onChange(value.includes(item) ? value.filter((x) => x !== item) : [...value, item]);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Button
          key={opt}
          type="button"
          variant={value.includes(opt) ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => toggle(opt)}
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}

// ---------- page ----------
export default function ProfilePage() {
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [health, setHealth] = React.useState<Health | null>(null);

  const [editOverview, setEditOverview] = React.useState(false);
  const [editHealth, setEditHealth] = React.useState(false);

  const [dietOptions, setDietOptions] = React.useState<string[]>([]);
  const [allergenOptions, setAllergenOptions] = React.useState<string[]>([]);
  const [conditionOptions, setConditionOptions] = React.useState<string[]>([]);

  // local editable copies (arrays, not CSV)
  const [ovForm, setOvForm] = React.useState<any>({});
  const [hpForm, setHpForm] = React.useState<any>({});

  async function load() {
    try {
      setLoading(true);
      const [ovRaw, hpRaw] = await Promise.all([apiGetMyOverview(), apiGetMyHealth()]);
      const ov = normalizeOverview(ovRaw);
      const hp = normalizeHealth(hpRaw);
      setOverview(ov);
      setHealth(hp);

      // seed edit state with arrays & scalars
      setOvForm({
        fullName: ov.fullName ?? "",
        email: ov.email ?? "",
        phone: ov.phone ?? "",
        diets: ov.diets ?? [],
        allergens: ov.allergens ?? [],
      });
      setHpForm({
        dateOfBirth: hp.dateOfBirth ?? "",
        gender: hp.gender ?? "",
        activityLevel: hp.activityLevel ?? "",
        healthGoal: hp.healthGoal ?? "",
        heightCm: hp.heightCm ?? "",
        weightKg: hp.weightKg ?? "",
        targetWeightKg: hp.targetWeightKg ?? "",
        targetCalories: hp.targetCalories ?? "",
        targetProteinG: hp.targetProteinG ?? "",
        targetCarbsG: hp.targetCarbsG ?? "",
        targetFatG: hp.targetFatG ?? "",
        targetFiberG: hp.targetFiberG ?? "",
        targetSodiumMg: hp.targetSodiumMg ?? "",
        targetSugarG: hp.targetSugarG ?? "",
        intolerances: hp.intolerances ?? [],
        dislikedIngredients: hp.dislikedIngredients ?? [],
        conditions: hp.conditions ?? [],
        onboardingComplete: !!hp.onboardingComplete,
      });
    } catch (e) {
      console.error("profile load error", e);
      toast({ description: "Failed to load profile.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadTaxonomy() {
    try {
      const [dietsRes, allergensRes, conditionsRes] = await Promise.all([
        apiGetDietaryPreferences(),
        apiGetAllergens(),
        apiGetHealthConditions(),
      ]);

      const toNames = (items: TaxonomyOption[]) =>
        (items || []).map((item) => item.name || item.code).filter(Boolean);

      setDietOptions(toNames(dietsRes));
      setAllergenOptions(toNames(allergensRes));
      setConditionOptions(toNames(conditionsRes));
    } catch (e) {
      console.error("taxonomy load error", e);
      setDietOptions([]);
      setAllergenOptions([]);
      setConditionOptions([]);
    }
  }

  React.useEffect(() => {
    load();
    loadTaxonomy();
  }, []);

  const completeness = React.useMemo(() => {
    const fields = [
      overview?.fullName,
      overview?.email,
      health?.heightCm,
      health?.weightKg,
      health?.activityLevel,
      health?.healthGoal,
    ];
    const have = fields.filter((f) => !(f === null || f === undefined || f === "")).length;
    return Math.round((have / fields.length) * 100) || 0;
  }, [overview, health]);

  async function onDeleteRows() {
    if (!confirm("Delete profile rows in Supabase (overview & health)?")) return;
    try {
      await apiDeleteProfileRows();
      await load();
      toast({ description: "Profile rows deleted." });
    } catch (e) {
      console.error(e);
      toast({ description: "Delete failed.", variant: "destructive" });
    }
  }

  async function onDeleteAccount() {
    if (!confirm("This permanently deletes your account and all data. Continue?")) return;
    try {
      await apiDeleteAccount();
      window.location.href = "/login";
    } catch (e) {
      console.error(e);
      toast({ description: "Delete account failed.", variant: "destructive" });
    }
  }

  // ----- saves (arrays, not CSV) -----
  async function saveOverviewInline() {
    try {
      const body = {
        email: ovForm.email || null,
        phone: ovForm.phone || null,
        fullName: ovForm.fullName || null,
        diets: ovForm.diets || [],
        allergens: ovForm.allergens || [],
      };
      const r = await apiUpdateOverview(body);
      if (!r.ok) throw new Error(`overview save ${r.status}`);
      toast({ description: "Overview saved." });
      setEditOverview(false);
      await load();
    } catch (e) {
      console.error(e);
      toast({ description: "Failed to save overview.", variant: "destructive" });
    }
  }

  async function saveHealthInline() {
    try {
      const body = {
        dateOfBirth: hpForm.dateOfBirth || null,
        gender: hpForm.gender || null,
        activityLevel: hpForm.activityLevel || null,
        healthGoal: hpForm.healthGoal || null,
        heightCm: hpForm.heightCm === "" ? null : Number(hpForm.heightCm),
        weightKg: hpForm.weightKg === "" ? null : Number(hpForm.weightKg),
        targetWeightKg: hpForm.targetWeightKg === "" ? null : Number(hpForm.targetWeightKg),
        targetCalories: hpForm.targetCalories === "" ? null : Number(hpForm.targetCalories),
        targetProteinG: hpForm.targetProteinG === "" ? null : Number(hpForm.targetProteinG),
        targetCarbsG: hpForm.targetCarbsG === "" ? null : Number(hpForm.targetCarbsG),
        targetFatG: hpForm.targetFatG === "" ? null : Number(hpForm.targetFatG),
        targetFiberG: hpForm.targetFiberG === "" ? null : Number(hpForm.targetFiberG),
        targetSodiumMg: hpForm.targetSodiumMg === "" ? null : Number(hpForm.targetSodiumMg),
        targetSugarG: hpForm.targetSugarG === "" ? null : Number(hpForm.targetSugarG),
        intolerances: hpForm.intolerances || [],
        dislikedIngredients: hpForm.dislikedIngredients || [],
        conditions: hpForm.conditions || [],
        onboardingComplete: !!hpForm.onboardingComplete,
      };
      const r = await apiUpdateHealth(body);
      if (!r.ok) throw new Error(`health save ${r.status}`);
      toast({ description: "Health saved." });
      setEditHealth(false);
      await load();
    } catch (e) {
      console.error(e);
      toast({ description: "Failed to save health.", variant: "destructive" });
    }
  }

  // derived display fallbacks
  const dietsDisplay = React.useMemo(() => {
    return (overview?.diets ?? []) as string[];
  }, [overview?.diets]);

  const allergiesDisplay = React.useMemo(() => {
    return (overview?.allergens ?? []) as string[];
  }, [overview?.allergens]);

  const bmiEdit =
    hpForm && hpForm.heightCm && hpForm.weightKg
      ? bmiFrom(Number(hpForm.heightCm), Number(hpForm.weightKg))
      : undefined;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and health information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={editOverview ? "secondary" : "default"} onClick={() => setEditOverview((v) => !v)}>
            {editOverview ? "Cancel Overview" : "Edit Overview"}
          </Button>
          <Button variant={editHealth ? "secondary" : "default"} onClick={() => setEditHealth((v) => !v)}>
            {editHealth ? "Cancel Health" : "Edit Health"}
          </Button>
          <Button variant="destructive" onClick={onDeleteRows}>
            Delete Profile Rows
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* ---------------- Overview ---------------- */}
        <TabsContent value="overview">
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback>
                    {(overview?.fullName || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-semibold text-lg truncate">
                    {editOverview ? (ovForm.fullName || "") : show(overview?.fullName)}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {editOverview ? (ovForm.email || "") : show(overview?.email)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profile Completeness</span>
                  <span className="text-muted-foreground">{completeness}%</span>
                </div>
                <Progress value={completeness} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>Age: {ageFromISO(health?.dateOfBirth) ?? "Age not set"}</div>
                <div>Gender: {show(health?.gender, "Not Specified")}</div>
                <div>Height: {health?.heightCm ? `${health.heightCm} cm` : "Not set"}</div>
                <div>Weight: {health?.weightKg ? `${health.weightKg} kg` : "Not set"}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Health Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  {(() => {
                    const bmi = bmiFrom(health?.heightCm, health?.weightKg);
                    return bmi ? `BMI ${bmi}` : "Complete height and weight to see BMI";
                  })()}
                </div>
                <div>Activity Level: {show(health?.activityLevel, "Not Set")}</div>
                <div>Goal: {show(health?.healthGoal, "Not Set")}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dietary Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {!editOverview && (
                  <>
                    <div><span className="font-medium">Diets: </span>{list(dietsDisplay)}</div>
                    <div><span className="font-medium">Allergies: </span>{list(allergiesDisplay)}</div>
                  </>
                )}
                {editOverview && (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1 block">Diets</Label>
                      <ChipGroup
                        options={dietOptions}
                        value={ovForm.diets || []}
                        onChange={(next) => setOvForm((s: any) => ({ ...s, diets: next }))}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Allergies</Label>
                      <ChipGroup
                        options={allergenOptions}
                        value={ovForm.allergens || []}
                        onChange={(next) => setOvForm((s: any) => ({ ...s, allergens: next }))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {!editOverview && (
                  <>
                    <div>Full Name: {show(overview?.fullName)}</div>
                    <div>Email: {show(overview?.email)}</div>
                    <div>Phone: {show(overview?.phone)}</div>
                  </>
                )}
                {editOverview && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="col-span-2">
                      <Label htmlFor="ov-full-name">Full name</Label>
                      <Input id="ov-full-name" value={ovForm.fullName} onChange={(e) => setOvForm((s: any) => ({...s, fullName: e.target.value}))} />
                    </div>
                    <div>
                      <Label htmlFor="ov-email">Email</Label>
                      <Input id="ov-email" type="email" value={ovForm.email} onChange={(e) => setOvForm((s: any) => ({...s, email: e.target.value}))} />
                    </div>
                    <div>
                      <Label htmlFor="ov-phone">Phone</Label>
                      <Input id="ov-phone" value={ovForm.phone} onChange={(e) => setOvForm((s: any) => ({...s, phone: e.target.value}))} />
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <Button onClick={saveOverviewInline}>Save</Button>
                      <Button variant="secondary" onClick={() => (setEditOverview(false), load())}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------- Health ---------------- */}
        <TabsContent value="health">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {!editHealth && (
                  <>
                    <div>DOB: {show(health?.dateOfBirth)}</div>
                    <div>Gender: {show(health?.gender, "Not Specified")}</div>
                    <div>Activity Level: {show(health?.activityLevel, "Not Set")}</div>
                    <div>Goal: {show(health?.healthGoal, "Not Set")}</div>
                  </>
                )}
                {editHealth && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="hp-dob">Date of Birth</Label>
                      <Input id="hp-dob" type="date" value={hpForm.dateOfBirth} onChange={(e) => setHpForm((s: any) => ({...s, dateOfBirth: e.target.value}))} />
                    </div>
                    <div>
                      <Label htmlFor="hp-gender">Gender</Label>
                      <Input id="hp-gender" placeholder="male | female | other" value={hpForm.gender} onChange={(e) => setHpForm((s: any) => ({...s, gender: e.target.value}))} />
                    </div>

                    <div>
                      <Label>Activity Level</Label>
                      <Select
                        value={hpForm.activityLevel ?? ""}
                        onValueChange={(v) => setHpForm((s: any) => ({ ...s, activityLevel: v }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select activity level" />
                        </SelectTrigger>
                        <SelectContent>
                          {activityOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Goal</Label>
                      <Select
                        value={hpForm.healthGoal ?? ""}
                        onValueChange={(v) => setHpForm((s: any) => ({ ...s, healthGoal: v }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          {goalOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Measurements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {!editHealth && (
                  <>
                    <div>Height: {health?.heightCm ? `${health.heightCm} cm` : "Not set"}</div>
                    <div>Weight: {health?.weightKg ? `${health.weightKg} kg` : "Not set"}</div>
                    <div>
                      BMI: {(() => {
                        const bmi = bmiFrom(health?.heightCm, health?.weightKg);
                        return bmi ? bmi : "—";
                      })()}
                    </div>
                  </>
                )}
                {editHealth && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor="hp-hcm">Height (cm)</Label>
                      <Input id="hp-hcm" type="number" value={hpForm.heightCm} onChange={(e) => setHpForm((s: any) => ({...s, heightCm: e.target.value}))} />
                    </div>
                    <div>
                      <Label htmlFor="hp-wkg">Weight (kg)</Label>
                      <Input id="hp-wkg" type="number" value={hpForm.weightKg} onChange={(e) => setHpForm((s: any) => ({...s, weightKg: e.target.value}))} />
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      BMI (live): {bmiEdit ?? "—"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Restrictions & Intolerances</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
                {!editHealth && (
                  <>
                    <div>
                      <div className="font-medium">Major Health Conditions</div>
                      <div>{list(health?.conditions)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Intolerances</div>
                      <div>{list(health?.intolerances)}</div>
                    </div>
                    <div className="md:col-span-3">
                      <div className="font-medium">Disliked Ingredients</div>
                      <div>{list(health?.dislikedIngredients)}</div>
                    </div>
                  </>
                )}
                {editHealth && (
                  <>
                    <div className="md:col-span-3 space-y-2">
                      <Label>Major Health Conditions</Label>
                      <ChipGroup
                        options={conditionOptions}
                        value={hpForm.conditions || []}
                        onChange={(next) => setHpForm((s: any) => ({ ...s, conditions: next }))}
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label>Intolerances (CSV quick entry)</Label>
                      <Input
                        placeholder="e.g., lactose, sorbitol"
                        value={(hpForm.intolerances || []).join(", ")}
                        onChange={(e) =>
                          setHpForm((s: any) => ({
                            ...s,
                            intolerances: e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean),
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label>Disliked Ingredients (CSV quick entry)</Label>
                      <Input
                        placeholder="e.g., cilantro, olives"
                        value={(hpForm.dislikedIngredients || []).join(", ")}
                        onChange={(e) =>
                          setHpForm((s: any) => ({
                            ...s,
                            dislikedIngredients: e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean),
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-3 flex items-center gap-2">
                      <Checkbox id="hp-onboard" checked={!!hpForm.onboardingComplete} onCheckedChange={(v) => setHpForm((s: any) => ({...s, onboardingComplete: !!v}))} />
                      <Label htmlFor="hp-onboard">Onboarding Complete</Label>
                    </div>
                    <div className="md:col-span-3 flex gap-2">
                      <Button onClick={saveHealthInline}>Save</Button>
                      <Button variant="secondary" onClick={() => (setEditHealth(false), load())}>Cancel</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------- Security ---------------- */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data from Supabase and Appwrite.
              </p>
              <div>
                <Button variant="destructive" onClick={onDeleteAccount}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
    </div>
  );
}


