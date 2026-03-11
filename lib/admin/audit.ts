// lib/admin/audit.ts
const KEY = "admin_audit_v1"

export type AuditEntry = {
  ts: string
  actor: string
  action: string
  target?: string
  summary?: string
  diff?: unknown
}

export function listAudit(): AuditEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown
    return Array.isArray(parsed) ? (parsed as AuditEntry[]) : []
  } catch {
    return []
  }
}

export function appendAudit(entry: AuditEntry) {
  const all = listAudit()
  all.unshift(entry)
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 500)))
}
