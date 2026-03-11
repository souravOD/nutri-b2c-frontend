// lib/admin/fixtures.ts
import analytics from "@/app/_mock/admin/analytics.json"
import audit from "@/app/_mock/admin/audit.json"
import products from "@/app/_mock/admin/products.json"
import recipes from "@/app/_mock/admin/recipes-admin.json"
import collections from "@/app/_mock/admin/collections.json"
import taxonomies from "@/app/_mock/admin/taxonomies.json"
import users from "@/app/_mock/admin/users.json"
import flags from "@/app/_mock/admin/flags.json"
import featureFlags from "@/app/_mock/admin/featureFlags.json"
import announcements from "@/app/_mock/admin/announcements.json"

const OVERRIDES_KEY = "admin_overrides_v1"

type FixtureValue = unknown

const FIXTURES: Record<string, FixtureValue> = {
  analytics,
  audit,
  products,
  recipes,
  collections,
  taxonomies,
  users,
  flags,
  featureFlags,
  announcements,
}

export async function loadFixture(name: keyof typeof FIXTURES) {
  // allow localStorage overrides by key
  const overrides = getOverrides()
  if (overrides[name]) return overrides[name]
  return FIXTURES[name]
}

export function saveOverride(name: keyof typeof FIXTURES, value: FixtureValue) {
  const overrides = getOverrides()
  overrides[name] = value
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides))
}

function getOverrides(): Record<string, FixtureValue> {
  try {
    const parsed = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}") as unknown
    return parsed && typeof parsed === "object" ? (parsed as Record<string, FixtureValue>) : {}
  } catch {
    return {}
  }
}
