// app/admin/content/recipes/page.tsx
"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users } from "lucide-react"
import DataTable, { type Column } from "@/components/admin/data-table" // default export works too

// Adjust the path if yours differs
import recipesAdmin from "@/app/_mock/admin/recipes-admin.json"

// ----- Types ---------------------------------------------------------------

type PublishStatus = "draft" | "review" | "published"
type Difficulty = "easy" | "medium" | "hard"

export type RecipeAdminRow = {
  id: string
  title: string
  status: PublishStatus
  updatedAt: number | string
  views: number
  saves: number
  difficulty: Difficulty
  timeMins: number
  servings: number
}

type RawRecipeRow = Partial<RecipeAdminRow> & Record<string, unknown>

const columns: Column<RecipeAdminRow>[] = [
  { key: "title", label: "Title", sortable: true },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (v) => {
      const status = String(v ?? "draft") as PublishStatus
      const variant =
        status === "published" ? "default" : status === "review" ? "secondary" : "outline"
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    key: "updatedAt",
    label: "Updated",
    sortable: true,
    render: (v) => {
      const d = typeof v === "number" ? new Date(v) : new Date(String(v))
      return d.toLocaleDateString()
    },
  },
  { key: "views", label: "Views", sortable: true },
  { key: "saves", label: "Saves", sortable: true },
  {
    key: "difficulty",
    label: "Difficulty",
    sortable: true,
    render: (v) => <Badge variant="outline">{String(v ?? "easy")}</Badge>,
  },
  {
    key: "timeMins",
    label: "Time",
    sortable: true,
    render: (v) => (
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" /> {Number(v ?? 0)}m
      </span>
    ),
  },
  {
    key: "servings",
    label: "Servings",
    sortable: true,
    render: (v) => (
      <span className="inline-flex items-center gap-1">
        <Users className="h-3 w-3" /> {Number(v ?? 0)}
      </span>
    ),
  },
]

// ----- Page ----------------------------------------------------------------

export default function AdminRecipesPage() {
  // Robustly read mock data whether it's an array or {recipes: []}
  const rows = useMemo<RecipeAdminRow[]>(() => {
    const raw = recipesAdmin as unknown
    const arr: RawRecipeRow[] = Array.isArray(raw)
      ? (raw as RawRecipeRow[])
      : raw && typeof raw === "object" && Array.isArray((raw as { recipes?: unknown }).recipes)
        ? (((raw as { recipes: unknown[] }).recipes) as RawRecipeRow[])
        : []
    return arr.map((r) => {
      const updatedRaw = r.updatedAt ?? r.updated
      const updatedAt =
        typeof updatedRaw === "number" || typeof updatedRaw === "string" ? updatedRaw : Date.now()

      return {
        id: String(r.id ?? r._id ?? crypto.randomUUID()),
        title: String(r.title ?? "Untitled"),
        status: (r.status ?? "draft") as PublishStatus,
        updatedAt,
        views: Number(r.views ?? 0),
        saves: Number(r.saves ?? r.favorites ?? 0),
        difficulty: (r.difficulty ?? "easy") as RecipeAdminRow["difficulty"],
        timeMins: Number(r.timeMins ?? r.time ?? 0),
        servings: Number(r.servings ?? 0),
      }
    })
  }, [])

  const [selected, setSelected] = useState<RecipeAdminRow[]>([])
  const [sortKey, setSortKey] = useState<keyof RecipeAdminRow>("updatedAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [isLoading] = useState(false)

  const sorted = useMemo(() => {
    const list = [...rows]
    list.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const avComparable = typeof av === "number" ? av : String(av ?? "")
      const bvComparable = typeof bv === "number" ? bv : String(bv ?? "")
      if (avComparable === bvComparable) return 0
      if (avComparable > bvComparable) return sortDir === "asc" ? 1 : -1
      return sortDir === "asc" ? -1 : 1
    })
    return list
  }, [rows, sortKey, sortDir])

  function toggleRow(row: RecipeAdminRow) {
    setSelected((prev) => {
      const exists = prev.find((r) => r.id === row.id)
      return exists ? prev.filter((r) => r.id !== row.id) : [...prev, row]
    })
  }

  function onToggleAll(checked: boolean) {
    setSelected(checked ? sorted : [])
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recipes</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">Export CSV</Button>
          <Button size="sm">New Recipe</Button>
        </div>
      </div>

      <DataTable<RecipeAdminRow>
        columns={columns}
        data={sorted}
        selectedRows={selected}
        onToggleRow={toggleRow}
        onToggleAll={onToggleAll}
        onSort={(k: keyof RecipeAdminRow, d: "asc" | "desc") => {
          setSortKey(k)
          setSortDir(d)
        }}
        sortKey={sortKey}
        sortDirection={sortDir}
        isLoading={isLoading}
      />
    </div>
  )
}
