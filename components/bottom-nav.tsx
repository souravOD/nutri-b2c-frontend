// components/bottom-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart3, CalendarDays, ShoppingCart, User } from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/nutrition", label: "Nutrition", icon: BarChart3 },
  { href: "/meal-plan", label: "Meal Plan", icon: CalendarDays },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingCart },
  { href: "/profile", label: "Profile", icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-[#F1F5F9] lg:hidden"
      style={{
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        backgroundColor: "rgba(255,255,255,0.95)",
      }}
    >
      <ul
        className="flex items-center justify-around max-w-[500px] mx-auto"
        style={{ paddingTop: 9, paddingBottom: 28, paddingLeft: 12, paddingRight: 12 }}
      >
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <li key={item.href} className="flex justify-center">
              <Link
                href={item.href}
                className="flex flex-col items-center gap-1"
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={`w-[18px] h-[18px] ${active ? "text-[#538100]" : "text-[#94A3B8]"}`}
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span
                  className={`text-[10px] leading-[15px] ${active ? "font-bold text-[#538100]" : "font-medium text-[#94A3B8]"
                    }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
