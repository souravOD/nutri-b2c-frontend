"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"
import { account, databases, teams } from "@/lib/appwrite"
import { Permission, Query, Role } from "appwrite"
import { syncProfile, syncHealth } from "@/lib/api";

type AppwriteUser = any
type ProfileDoc = any
type HealthDoc = any

type State = {
  loading: boolean
  error: string | null
  user: AppwriteUser | null
  profile: ProfileDoc | null
  health: HealthDoc | null
  isAuthed: boolean
  isAdminBool: boolean
}

type Ctx = {
  loading: boolean
  error: string | null
  user: AppwriteUser | null
  profile: ProfileDoc | null
  health: HealthDoc | null
  isAuthed: boolean
  /** Always call as a function: isAdmin() */
  isAdmin: () => boolean
  /** True when user lacks a health profile doc */
  needsHealthOnboarding: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
  /** Upserts the health profile using ONLY attributes your schema allows */
  updateUser: (updates: any) => Promise<void>
}

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
const PROFILE_COLL =
  (process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID as string) || "profiles"
const HEALTH_COLL =
  (process.env.NEXT_PUBLIC_APPWRITE_HEALTH_COLLECTION_ID as string) || "health_profiles"
const ADMINS_TEAM_ID = (process.env.NEXT_PUBLIC_APPWRITE_ADMINS_TEAM_ID as string) || ""

const initial: State = {
  loading: true,
  error: null,
  user: null,
  profile: null,
  health: null,
  isAuthed: false,
  isAdminBool: false,
}

function reducer(state: State, next: Partial<State>): State {
  return { ...state, ...next }
}

const UserContext = createContext<Ctx | null>(null)

async function fetchProfile(userId: string) {
  try {
    const doc = await databases.getDocument(DB_ID, PROFILE_COLL, userId)
    return doc
  } catch {
    try {
      const res = await databases.listDocuments(DB_ID, PROFILE_COLL, [
        Query.equal("userId", userId),
        Query.limit(1),
      ])
      return res.documents?.[0] ?? null
    } catch {
      return null
    }
  }
}

async function fetchHealth(userId: string) {
  try {
    const doc = await databases.getDocument(DB_ID, HEALTH_COLL, userId)
    return doc
  } catch {
    try {
      const res = await databases.listDocuments(DB_ID, HEALTH_COLL, [
        Query.equal("userId", userId),
        Query.limit(1),
      ])
      return res.documents?.[0] ?? null
    } catch {
      return null
    }
  }
}

async function computeIsAdmin(user: any, profile: any): Promise<boolean> {
  // Preferred: Teams membership
  try {
    if (ADMINS_TEAM_ID) {
      const teamList = await teams.list()
      if (teamList?.teams?.some((t: any) => t.$id === ADMINS_TEAM_ID)) return true
      if (teamList?.teams?.some((t: any) => String(t.name).toLowerCase() === "admins")) return true
    }
  } catch {
    // ignore and fallback to profile-based role
  }
  // Fallback: profile role(s)
  const role = (profile?.role ?? user?.prefs?.role ?? "").toString().toLowerCase()
  const roles = Array.isArray(profile?.roles)
    ? profile.roles.map((r: any) => String(r).toLowerCase())
    : []
  return role === "admin" || roles.includes("admin")
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, set] = useReducer(reducer, initial)

  const load = useCallback(async () => {
    set({ loading: true, error: null })
    try {
      const user = await account.get().catch(() => null)
      if (!user) {
        set({
          loading: false,
          isAuthed: false,
          user: null,
          profile: null,
          health: null,
          isAdminBool: false,
        })
        return
      }

      const [profile, health] = await Promise.all([fetchProfile(user.$id), fetchHealth(user.$id)])
      const isAdminBool = await computeIsAdmin(user, profile)

      set({
        loading: false,
        isAuthed: true,
        user,
        profile,
        health,
        isAdminBool,
      })
    } catch (err: any) {
      set({
        loading: false,
        error: err?.message ?? "Failed to load user",
        isAuthed: false,
        user: null,
        profile: null,
        health: null,
        isAdminBool: false,
      })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  const signOut = useCallback(async () => {
    try {
      await account.deleteSession("current")
    } finally {
      if (typeof window !== "undefined") window.location.href = "/login"
    }
  }, [])

  // Save only attributes your health_profiles schema allows
  const updateUser = useCallback(
    async (updates: any) => {
      if (!state.user) throw new Error("Not signed in")
      const uid = state.user.$id

      const asArray = (v: any) =>
        Array.isArray(v)
          ? v
          : typeof v === "string"
          ? v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : []

      const payload: any = {
        dateOfBirth: updates.dateOfBirth ?? undefined,
        sex: updates.sex ?? undefined,
        activityLevel: updates.activityLevel ?? undefined,
        goal: updates.goal ?? undefined,
        diets: updates.diets !== undefined ? asArray(updates.diets) : undefined,
        allergens: updates.allergens !== undefined ? asArray(updates.allergens) : undefined,
        intolerances: updates.intolerances !== undefined ? asArray(updates.intolerances) : undefined,
        dislikedIngredients:
          updates.dislikedIngredients !== undefined ? asArray(updates.dislikedIngredients) : undefined,
        major_conditions:
          updates.major_conditions !== undefined
            ? asArray(updates.major_conditions)
            : updates.majorConditions !== undefined
              ? asArray(updates.majorConditions)
              : undefined,
        diet_codes: updates.diet_codes !== undefined ? asArray(updates.diet_codes) : undefined,
        diet_ids: updates.diet_ids !== undefined ? asArray(updates.diet_ids) : undefined,
        allergen_codes: updates.allergen_codes !== undefined ? asArray(updates.allergen_codes) : undefined,
        allergen_ids: updates.allergen_ids !== undefined ? asArray(updates.allergen_ids) : undefined,
        condition_codes: updates.condition_codes !== undefined ? asArray(updates.condition_codes) : undefined,
        condition_ids: updates.condition_ids !== undefined ? asArray(updates.condition_ids) : undefined,
        onboardingComplete: true,
        ...(updates.height
          ? typeof updates.height === "string"
            ? { height: updates.height }
            : { height: `${updates.height.value} ${updates.height.unit}` }
          : {}),
        ...(updates.weight
          ? typeof updates.weight === "string"
            ? { weight: updates.weight }
            : { weight: `${updates.weight.value} ${updates.weight.unit}` }
          : {}),
      }

      // Strip undefined keys so we only send what the UI provided
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

      try {
        const updated = await databases.updateDocument(DB_ID, HEALTH_COLL, uid, payload)
        set({ health: updated })
        try { await syncHealth(payload, uid) } catch (e) {
          console.error("[sync] Health sync to Supabase failed:", e)
        }
        return
      } catch {
        const permissions = [
          Permission.read(Role.user(uid)),
          Permission.update(Role.user(uid)),
          Permission.delete(Role.user(uid)),
        ]
        const created = await databases.createDocument(DB_ID, HEALTH_COLL, uid, payload, permissions)
        set({ health: created })
        try { await syncHealth(payload, uid) } catch (e) {
          console.error("[sync] Health sync to Supabase failed:", e)
        }
      }
    },
    [state.user],
  )

  const isAdminFn = useCallback(() => state.isAdminBool, [state.isAdminBool])
  const needsHealthOnboarding = useMemo(() => !state.health, [state.health])

  const value: Ctx = useMemo(
    () => ({
      loading: state.loading,
      error: state.error,
      user: state.user,
      profile: state.profile,
      health: state.health,
      isAuthed: state.isAuthed,
      isAdmin: isAdminFn,
      needsHealthOnboarding,
      refresh,
      signOut,
      updateUser,
    }),
    [
      state.loading,
      state.error,
      state.user,
      state.profile,
      state.health,
      state.isAuthed,
      isAdminFn,
      needsHealthOnboarding,
      refresh,
      signOut,
      updateUser,
    ],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser(): Ctx {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used within a UserProvider")
  return ctx
}
