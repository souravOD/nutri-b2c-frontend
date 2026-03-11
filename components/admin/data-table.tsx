"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Download } from "lucide-react"

export type Column<T> = {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  /** rows to render */
  data: T[]
  /** current selected rows */
  selectedRows: T[]
  /** toggle a single row */
  onToggleRow: (row: T) => void
  /** toggle all */
  onToggleAll: (checked: boolean) => void
  /** set sorting */
  onSort: (key: keyof T, dir: "asc" | "desc") => void
  sortKey: keyof T
  sortDirection: "asc" | "desc"
  isLoading?: boolean
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  selectedRows,
  onToggleRow,
  onToggleAll,
  onSort,
  sortKey,
  sortDirection,
  isLoading,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedRows.length === data.length
  const someSelected = selectedRows.length > 0 && !allSelected

  function exportCsv() {
    const header = columns.map((c) => c.label).join(",")
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const v = row[col.key]
          const s = v == null ? "" : String(v)
          return `"${s.replace(/"/g, '""')}"`
        })
        .join(","),
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="border rounded-md">
      <div className="flex items-center justify-between p-2">
        <div className="text-sm text-muted-foreground">
          {selectedRows.length} selected
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(v) => onToggleAll(v === true)}
              />
            </TableHead>

            {columns.map((col) => {
              const isSortable = !!col.sortable
              const isActive = isSortable && sortKey === col.key
              return (
                <TableHead
                  key={String(col.key)}
                  className={isSortable ? "cursor-pointer select-none" : undefined}
                  onClick={() => {
                    if (!isSortable) return
                    const next: "asc" | "desc" =
                      isActive && sortDirection === "asc" ? "desc" : "asc"
                    onSort(col.key, next)
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {isActive &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </span>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1}>Loading…</TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1}>No data</TableCell>
            </TableRow>
          ) : (
            data.map((row) => {
              const checked = selectedRows.some((r) => r.id === row.id)
              return (
                <TableRow key={String(row.id)}>
                  <TableCell className="w-10">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleRow(row)}
                    />
                  </TableCell>

                  {columns.map((col) => {
                    const raw = row[col.key]
                    return (
                      <TableCell key={String(col.key)}>
                        {col.render ? col.render(raw, row) : String(raw ?? "")}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

/** Provide both named & default export to avoid import mismatches. */
export default DataTable
