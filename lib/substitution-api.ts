// Substitution API client for PRD-18

export interface SubstitutionItem {
    ingredient_id?: string
    product_id?: string
    name: string
    reason: string
    category?: string
    brand?: string
    price?: number
    savings?: number
    allergenSafe?: boolean
    confidence?: number
    nutritionComparison?: {
        original: { calories_per_100g: number; protein_g: number }
        substitute: { calories_per_100g: number; protein_g: number }
    }
}

export async function fetchIngredientSubstitutions(
    ingredientId: string,
    memberId?: string
): Promise<{ substitutions: SubstitutionItem[] }> {
    const params = new URLSearchParams()
    if (memberId) params.set("memberId", memberId)
    const res = await fetch(
        `/api/v1/substitutions/ingredient/${ingredientId}?${params}`,
        { credentials: "include" }
    )
    if (!res.ok) return { substitutions: [] }
    return res.json()
}

export async function fetchProductSubstitutions(
    productId: string,
    memberId?: string
): Promise<{ substitutions: SubstitutionItem[] }> {
    const params = new URLSearchParams()
    if (memberId) params.set("memberId", memberId)
    const res = await fetch(
        `/api/v1/substitutions/product/${productId}?${params}`,
        { credentials: "include" }
    )
    if (!res.ok) return { substitutions: [] }
    return res.json()
}
