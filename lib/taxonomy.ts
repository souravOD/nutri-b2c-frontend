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
