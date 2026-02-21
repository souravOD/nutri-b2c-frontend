// components/app-shell.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { LeftSidebar } from "@/components/left-sidebar"
import { BottomNav } from "@/components/bottom-nav"
import AdminAppShell from "@/components/admin/app-shell"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
}

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/verify-email", "/onboarding"]

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const pathname = usePathname()

  const isAuthPage = AUTH_PAGES.includes(pathname)
  const isAdminRoute = pathname?.startsWith("/admin")

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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-[260px]",
        )}
      >
        <LeftSidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out md:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <LeftSidebar isCollapsed={false} onToggleCollapse={() => setMobileSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden pl-0 md:pl-4">
        <AppHeader showMenuButton={true} onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  )
}
