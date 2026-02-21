// lib/admin/defaults.ts
const ADMIN_DEFAULTS_KEY = "admin_reco_defaults_v1"
const ADMIN_APPLY_KEY = "admin_apply_defaults_v1"

export function getAdminDefaults<T = unknown>(): T | null {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_DEFAULTS_KEY) || "null") as T | null
  } catch {
    return null
  }
}

export function setAdminDefaults(value: unknown) {
  localStorage.setItem(ADMIN_DEFAULTS_KEY, JSON.stringify(value))
}

export function isAdminApplyEnabled() {
  return localStorage.getItem(ADMIN_APPLY_KEY) === "1"
}

export function setAdminApplyEnabled(enabled: boolean) {
  localStorage.setItem(ADMIN_APPLY_KEY, enabled ? "1" : "0")
}
