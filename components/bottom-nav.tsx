// components/bottom-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Heart, User, LayoutDashboard, Settings, UtensilsCrossed, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"

export function BottomNav() {
  const pathname = usePathname()
  const { isAuthed, isAdmin } = useUser()
  const isAdminBool = isAdmin()

  const items = isAdminBool
    ? [
        { href: "/admin", label: "Admin", icon: LayoutDashboard },
        { href: "/settings", label: "Settings", icon: Settings },
      ]
    : [
        { href: "/", label: "Home", icon: Home },
        { href: "/search", label: "Search", icon: Search },
        ...(isAuthed ? [{ href: "/meal-log", label: "Meal Log", icon: UtensilsCrossed }] : []),
        ...(isAuthed ? [{ href: "/meal-plan", label: "Plan", icon: CalendarDays }] : []),
        ...(isAuthed ? [{ href: "/profile", label: "Profile", icon: User }] : []),
      ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/90 backdrop-blur md:hidden">
      <ul className={cn("grid", `grid-cols-${items.length}`)}>
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-14 flex-col items-center justify-center text-xs transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 mb-1" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
