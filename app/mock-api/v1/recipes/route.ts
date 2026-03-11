import { NextResponse } from "next/server"
import { searchRecipesData, type SearchFilters } from "@/lib/data"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""
  const filtersStr = searchParams.get("filters")
  let filters: Partial<SearchFilters> | undefined
  if (filtersStr) {
    try {
      const parsedFilters: unknown = JSON.parse(filtersStr)
      if (parsedFilters && typeof parsedFilters === "object") {
        filters = parsedFilters as Partial<SearchFilters>
      }
    } catch {
      // ignore
    }
  }
  const results = await searchRecipesData(q, filters)
  return NextResponse.json(results)
}
