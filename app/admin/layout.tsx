// app/admin/layout.tsx
import type { ReactNode } from "react"
import AdminGuard from "@/components/admin/admin-guard"

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Root layout already wraps with AppShell; this only gates the subtree
  return <AdminGuard>{children}</AdminGuard>
}
