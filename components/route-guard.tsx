"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"

/**
 * Guards routes for auth, onboarding, and admin default.
 * - Guests -> only public routes
 * - Authed w/out health -> /onboarding (except when already there)
 * - Admins -> "/" becomes "/admin" (default dashboard)
 */
export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthed, loading, needsHealthOnboarding, isAdmin } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const lastRedirect = useRef<string | null>(null)

  const isPublicPath =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/welcome" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email"

  const isOnboardingPath = pathname?.startsWith("/onboarding") ?? false

  useEffect(() => {
    const go = (dest: string) => {
      if (lastRedirect.current === dest) return
      lastRedirect.current = dest
      router.replace(dest)
    }

    if (loading) return

    if (!isAuthed) {
      if (!isPublicPath) go("/login")
      return
    }

    // Authed: onboarding gate for regular users
    const needs = !!needsHealthOnboarding
    if (needs && !isOnboardingPath) {
      go("/onboarding")
      return
    }

    // Admin default dashboard: when on "/", send to /admin
    if (pathname === "/" && isAdmin()) {
      go("/admin")
      return
    }

    // Block auth pages for authed users
    if (pathname === "/login" || pathname === "/register") {
      go("/")
      return
    }

    lastRedirect.current = null
  }, [loading, isAuthed, pathname, isPublicPath, isOnboardingPath, needsHealthOnboarding, isAdmin, router])

  return <>{children}</>
}
