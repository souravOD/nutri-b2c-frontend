// components/app-shell.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { LeftSidebar } from "@/components/left-sidebar"
import { BottomNav } from "@/components/bottom-nav"
import AdminAppShell from "@/components/admin/app-shell"
import { cn } from "@/lib/utils"
import {
  Home,
  Search,
  BarChart3,
  CalendarDays,
  ShoppingCart,
  User,
  Settings,
  UtensilsCrossed,
  PiggyBank,
  QrCode,
  FlaskConical,
  Sparkles,
  Plus,
  Bell,
  ChevronDown,
  LogOut,
  Heart,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from "@/hooks/use-user"
import { useUnreadCount, useAutoEvaluate } from "@/hooks/use-notifications"
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications"
import { useNps } from "@/hooks/use-nps"
import { NpsSurveyModal } from "@/components/nps/nps-survey-modal"

interface AppShellProps {
  children: React.ReactNode
}

const AUTH_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/welcome", "/onboarding"]

// Pages that use the new Figma navigation shell (exact match)
const FIGMA_NAV_ROUTES = ["/", "/meal-plan", "/search", "/nutrition", "/meal-log", "/grocery-list", "/budget", "/scan", "/recipe-analyzer", "/create", "/favorites", "/history", "/profile", "/settings", "/my-recipes", "/saved", "/notifications"]

// Pages that use the Figma navigation shell (prefix match)
const FIGMA_NAV_PREFIXES = ["/recipes/", "/meal-plan/", "/grocery-list/", "/budget/", "/recipe-analyzer/", "/scan/", "/profile/", "/notifications/"]

const MAIN_NAV = [
  { label: "Home", href: "/", icon: Home },
  { label: "Search", href: "/search", icon: Search },
  { label: "Meal Log", href: "/meal-log", icon: UtensilsCrossed },
  { label: "Nutrition", href: "/nutrition", icon: BarChart3 },
  { label: "Meal Plan", href: "/meal-plan", icon: CalendarDays },
  { label: "Grocery List", href: "/grocery-list", icon: ShoppingCart },
  { label: "Budget", href: "/budget", icon: PiggyBank },
  { label: "Favorites", href: "/favorites", icon: Heart },
]

const TOOLS_NAV = [
  { label: "Scan", href: "/scan", icon: QrCode },
  { label: "Recipe Analyzer", href: "/recipe-analyzer", icon: FlaskConical },
  { label: "AI planner", href: "/meal-plan/ai-planner", icon: Sparkles },
  { label: "Create Recipe", href: "/create", icon: Plus },
]

const BOTTOM_NAV = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
]

function FigmaSidebar({ pathname }: { pathname: string }) {
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const NavItem = ({ item }: { item: { label: string; href: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> } }) => {
    const Icon = item.icon
    const active = isActive(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-4 px-4 py-3 rounded-xl text-[16px] font-normal transition-colors",
          active
            ? "bg-[#262626] text-white font-medium"
            : "text-[#9CA3AF] hover:bg-[#1A1A1A] hover:text-white"
        )}
        style={{ fontFamily: "Inter, sans-serif" }}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
        {item.label}
      </Link>
    )
  }

  return (
    <aside className="hidden lg:flex flex-col w-[256px] h-screen fixed top-0 left-0 z-30 bg-[#0C0C0C] overflow-hidden">
      {/* Brand */}
      <div className="flex gap-2 items-center p-6">
        <div className="w-8 h-8 rounded-full bg-[#99CC33] flex items-center justify-center">
          <span className="text-white font-bold text-[18px]" style={{ fontFamily: "Inter, sans-serif" }}>N</span>
        </div>
        <span
          className="text-[24px] font-bold text-white leading-8"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Nutri
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col gap-1 px-4 overflow-auto">
        {MAIN_NAV.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}

        {/* Tools section */}
        <div className="mt-4 pt-4">
          <span
            className="block px-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-[1px] mb-4"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Tools
          </span>
          <div className="flex flex-col gap-1">
            {TOOLS_NAV.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col gap-1 px-4 py-4">
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}

        {/* B2C-COMPLIANCE: Legal links footer */}
        <div className="mt-3 pt-3 flex flex-wrap gap-x-3 gap-y-1 px-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Cookies", href: "/cookies" },
            { label: "Help", href: "/help" },
          ].map((link) => (
            <a
              key={link.label}
              href={`${process.env.NEXT_PUBLIC_MARKETING_URL || ""}${link.href}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] transition-colors"
              style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#FFFFFF" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#6B7280" }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}

function FigmaTopBar() {
  const { user, signOut } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const firstName = user?.name?.split(" ")[0] ?? "User"
  const { data: unreadCount = 0 } = useUnreadCount()
  useAutoEvaluate()
  useRealtimeNotifications()
  const isSearchPage = pathname === "/search" || pathname?.startsWith("/search?")

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  // Cmd/Ctrl + K focuses the search box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const withMeta = e.ctrlKey || e.metaKey
      if (withMeta && e.key.toLowerCase() === "k") {
        e.preventDefault()
        const input = document.getElementById("global-search-figma") as HTMLInputElement | null
        input?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch { }
    window.location.href = "/login"
  }

  return (
    <div
      className="hidden lg:flex items-center justify-between h-16 px-8 sticky top-0 z-20"
      style={{
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(245,245,240,0.85)",
        borderBottom: "1px solid var(--nutri-border, #E8E8E0)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Search bar — hidden on /search page to avoid duplicate */}
      {!isSearchPage && (
        <form onSubmit={onSearchSubmit} className="flex-1 max-w-[448px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none" style={{ color: "var(--nutri-placeholder, #9CA3AF)" }} />
            <input
              id="global-search-figma"
              className="w-full h-10 pl-11 pr-4 rounded-full text-[14px] outline-none transition-all"
              placeholder="Search recipes, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "white",
                border: "1px solid var(--nutri-border, #E8E8E0)",
                color: "var(--nutri-heading, #1A1A2E)",
                fontFamily: "Inter, sans-serif",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--nutri-green, #99CC33)" }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--nutri-border, #E8E8E0)" }}
            />
          </div>
        </form>
      )}
      {isSearchPage && <div className="flex-1" />}

      {/* Right side: bell + User dropdown */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Link
          href="/notifications"
          className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors"
          style={{ background: "transparent" }}
          aria-label="Notifications"
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--nutri-green-5, rgba(153,204,51,0.05))" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
        >
          <Bell className="w-5 h-5" style={{ color: "var(--nutri-heading, #1A1A2E)" }} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
              style={{ background: "#EF4444", lineHeight: 1, fontFamily: "Inter, sans-serif" }}
            >
              {unreadCount > 5 ? "5+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="w-px h-8" style={{ background: "var(--nutri-border, #E8E8E0)" }} />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full px-3 py-1.5 cursor-pointer transition-colors outline-none"
              style={{ background: "var(--nutri-green-5, rgba(153,204,51,0.05))", border: "1px solid var(--nutri-green-10, rgba(153,204,51,0.1))" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--nutri-green-10, rgba(153,204,51,0.1))" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--nutri-green-5, rgba(153,204,51,0.05))" }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--nutri-green, #99CC33)" }}>
                <span className="text-white text-[11px] font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
                  {firstName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className="text-[14px] font-medium leading-5"
                style={{ color: "var(--nutri-heading, #1A1A2E)", fontFamily: "Inter, sans-serif" }}
              >
                {firstName}
              </span>
              <ChevronDown className="w-3 h-3" style={{ color: "var(--nutri-body-light, #64748B)" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl border shadow-lg p-1" style={{ background: "white", borderColor: "var(--nutri-border, #E8E8E0)", fontFamily: "Inter, sans-serif", ["--accent" as string]: "rgba(153,204,51,0.08)", ["--accent-foreground" as string]: "var(--nutri-heading, #1A1A2E)" }}>
            <DropdownMenuItem onClick={() => router.push("/profile")} className="rounded-lg cursor-pointer" style={{ color: "var(--nutri-heading, #1A1A2E)" }}>
              <User className="mr-2 h-4 w-4" style={{ color: "var(--nutri-heading, #1A1A2E)" }} /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")} className="rounded-lg cursor-pointer" style={{ color: "var(--nutri-heading, #1A1A2E)" }}>
              <Settings className="mr-2 h-4 w-4" style={{ color: "var(--nutri-heading, #1A1A2E)" }} /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ background: "var(--nutri-border, #E8E8E0)" }} />
            <DropdownMenuItem onClick={handleSignOut} className="rounded-lg cursor-pointer" style={{ color: "#E74C3C" }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { showNps, setShowNps } = useNps()

  const isAuthPage = AUTH_PREFIXES.some((p) => pathname === p || pathname?.startsWith(p + "/"))
  const isAdminRoute = pathname?.startsWith("/admin")
  const useFigmaNav = FIGMA_NAV_ROUTES.includes(pathname) || FIGMA_NAV_PREFIXES.some((p) => pathname?.startsWith(p))

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (isAuthPage) {
    return <>{children}</>
  }

  if (isAdminRoute) {
    return <AdminAppShell>{children}</AdminAppShell>
  }

  // Figma navigation shell:
  // Desktop (lg+): dark left sidebar + top bar + content
  // Mobile/Tablet (<lg): bottom tab bar + content
  if (useFigmaNav) {
    return (
      <div className="min-h-screen bg-white">
        {/* Desktop sidebar (lg+) — dark, fixed */}
        <FigmaSidebar pathname={pathname} />

        {/* Main content area — offset for fixed sidebar on lg */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-[256px]">
          {/* Desktop top bar */}
          <FigmaTopBar />
          <main className="flex-1 overflow-auto [&>div]:bg-white [&>div]:text-[#0F172A]">{children}</main>
        </div>

        {/* Mobile/tablet bottom nav (hidden on lg+) */}
        <BottomNav />

        {/* B2C-026: NPS survey modal */}
        <NpsSurveyModal open={showNps} onOpenChange={setShowNps} />
      </div>
    )
  }

  // Legacy shell for pages not yet migrated to Figma design
  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          "hidden md:flex transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-[260px]",
        )}
      >
        <LeftSidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out md:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <LeftSidebar isCollapsed={false} onToggleCollapse={() => setMobileSidebarOpen(false)} />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden pl-0 md:pl-4">
        <AppHeader showMenuButton={true} onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <BottomNav />
    </div>
  )
}
