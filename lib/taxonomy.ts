export const DIETS = [
  { key: "VEGAN", label: "Vegan" },
  { key: "VEGETARIAN", label: "Vegetarian" },
  { key: "PESCATARIAN", label: "Pescatarian" },
  { key: "KETO", label: "Keto" },
  { key: "PALEO", label: "Paleo" },
  { key: "CELIAC_GLUTEN_FREE", label: "Gluten-Free" },
  { key: "DAIRY_FREE", label: "Dairy-Free" },
] as const

export const ALLERGENS = [
  { key: "Milk_dairy", label: "Milk (dairy)" },
  { key: "Egg", label: "Egg" },
  { key: "Fish_finned", label: "Fish (finned)" },
  { key: "Shellfish_crustaceans", label: "Shellfish — crustaceans" },
  { key: "Tree_nuts", label: "Tree nuts" },
  { key: "Peanut", label: "Peanut" },
  { key: "Wheat_gluten_cereals", label: "Wheat / gluten cereals" },
  { key: "Soy", label: "Soy" },
  { key: "Sesame_seed", label: "Sesame (seed)" },
] as const

/* ── B2C-UX: User-friendly display labels ──────────────────────────
 * Maps raw DB names / codes → simplified labels for the UI.
 * Backend storage & API calls keep using the original values.
 * If a term isn't in the map, displayLabel() returns it unchanged.
 * ─────────────────────────────────────────────────────────────────── */
const DISPLAY_LABELS: Record<string, string> = {
  /* ── Allergens ───────────────────────────────────────────────────── */
  "Alpha-gal syndrome":                   "Red Meat Allergy",
  "Alpha-gal_syndrome":                   "Red Meat Allergy",
  "Buckwheat (pseudo-cereal)":            "Buckwheat",
  "Buckwheat_pseudo-cereal":              "Buckwheat",
  "Corn (maize)":                         "Corn",
  "Corn_maize":                           "Corn",
  "Fish (finned)":                        "Fish",
  "Fish_finned":                          "Fish",
  "Gelatin (bovine/porcine)":             "Gelatin",
  "Gelatin_bovine_porcine":               "Gelatin",
  "Insect (entomophagy; cross-reactive)": "Insect-Based Foods",
  "Insect_entomophagy_cross-reactive":    "Insect-Based Foods",
  "Milk (dairy)":                         "Dairy / Milk",
  "Milk_dairy":                           "Dairy / Milk",
  "Molluscs":                             "Shellfish (Clams, Oysters)",
  "Oral Allergy Syndrome (OAS)":          "Pollen-Related Food Allergy",
  "Oral_Allergy_Syndrome_OAS":            "Pollen-Related Food Allergy",
  "Other legumes":                        "Beans & Lentils",
  "Other_legumes":                        "Beans & Lentils",
  "Seeds (non-sesame)":                   "Seeds (Sunflower, Flax, etc.)",
  "Seeds_non-sesame":                     "Seeds (Sunflower, Flax, etc.)",
  "Sesame (seed)":                        "Sesame",
  "Sesame_seed":                          "Sesame",
  "Shellfish crustaceans":                "Shellfish (Shrimp, Crab)",
  "Shellfish — crustaceans":              "Shellfish (Shrimp, Crab)",
  "Shellfish_crustaceans":                "Shellfish (Shrimp, Crab)",
  "Spices & herbs (rare)":               "Spice & Herb Allergy",
  "Spices_and_herbs_rare":                "Spice & Herb Allergy",
  "Wheat / gluten cereals":               "Wheat / Gluten",
  "Wheat_gluten_cereals":                 "Wheat / Gluten",

  /* ── Dietary Preferences ─────────────────────────────────────────── */
  "Carnivore":                            "Meat-Based (Carnivore)",
  "Flexitarian":                          "Mostly Plant-Based",
  "Jain Vegetarian":                      "Jain (Strict Vegetarian)",
  "Pescatarian":                          "Vegetarian + Seafood",
  "Vegetarian (Lacto-Ovo)":               "Vegetarian (Eggs & Dairy OK)",
  "Whole Foods / Elimination":            "Whole Foods / Clean Eating",

  /* ── Health Conditions ───────────────────────────────────────────── */
  "Celiac Disease":                       "Celiac Disease (Gluten-Free Required)",
  "celiac_disease":                       "Celiac Disease (Gluten-Free Required)",
  "Food Allergy (Other)":                 "Other Food Allergies",
  "food_allergy_other":                   "Other Food Allergies",
  "GERD / Acid Reflux":                   "Acid Reflux (GERD)",
  "gerd":                                 "Acid Reflux (GERD)",
  "Heart Disease / Cardiovascular Disease": "Heart Disease",
  "heart_disease":                        "Heart Disease",
  "Hyperlipidemia / High Cholesterol":    "High Cholesterol",
  "hyperlipidemia":                       "High Cholesterol",
  "Hypertension (High Blood Pressure)":   "High Blood Pressure",
  "hypertension":                         "High Blood Pressure",
  "Irritable Bowel Syndrome (IBS)":       "IBS (Sensitive Stomach)",
  "ibs":                                  "IBS (Sensitive Stomach)",
  "Kidney Disease (Chronic Kidney Disease)": "Kidney Disease",
  "kidney_disease":                       "Kidney Disease",
  "Non-Celiac Gluten Sensitivity":        "Gluten Sensitivity",
  "gluten_sensitivity":                   "Gluten Sensitivity",
  "Oral Allergy Syndrome":                "Pollen-Related Food Allergy",
  "oral_allergy_syndrome":                "Pollen-Related Food Allergy",
}

/**
 * Convert a raw taxonomy name/code to a user-friendly display label.
 * Falls back to the original value if no mapping exists.
 */
export function displayLabel(raw: string): string {
  return DISPLAY_LABELS[raw] ?? raw
}
