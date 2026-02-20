// components/left-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  Search,
  Heart,
  History,
  User,
  QrCode,
  Settings,
  LayoutDashboard,
  Plus,
  FlaskConical,
  BookOpen,
  UtensilsCrossed,
  CalendarDays,
  ShoppingBasket,
  PiggyBank,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"

interface LeftSidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  className?: string
}

const userNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "Search", href: "/search", icon: Search },
  { label: "Meal Log", href: "/meal-log", icon: UtensilsCrossed },
  { label: "Nutrition", href: "/nutrition", icon: BarChart3 },
  { label: "Meal Plan", href: "/meal-plan", icon: CalendarDays },
  { label: "Grocery List", href: "/grocery-list", icon: ShoppingBasket },
  { label: "Budget", href: "/budget", icon: PiggyBank },
  { label: "Scan", href: "/scan", icon: QrCode },
  { label: "Create Recipe", href: "/create", icon: Plus },
  { label: "My Recipes", href: "/my-recipes", icon: BookOpen },
  { label: "Recipe Analyzer", href: "/recipe-analyzer", icon: FlaskConical },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "History", href: "/history", icon: History },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
]

const adminNav = [{ label: "Admin", href: "/admin", icon: LayoutDashboard }]

export function LeftSidebar({ isCollapsed, onToggleCollapse, className }: LeftSidebarProps) {
  const pathname = usePathname()
  const { isAdmin } = useUser()
  const isAdminBool = isAdmin()

  const items = isAdminBool ? [...userNav, ...adminNav] : userNav

  return (
    <div className={cn("flex h-full flex-col border-r", className)}>
      <div className="flex items-center justify-between p-2">
        <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
          {isCollapsed ? "›" : "‹"}
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed && "px-2",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                  size={isCollapsed ? "icon" : "sm"}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
