// components/admin/header.tsx
"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { useUser } from "@/hooks/use-user"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  Search,
  Sun,
  Moon,
  Home,
  Settings as SettingsIcon,
  LayoutDashboard,
  LogOut,
} from "lucide-react"

function initials(nameOrEmail?: string) {
  if (!nameOrEmail) return "A"
  const name = nameOrEmail.split("@")[0] ?? nameOrEmail
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "A"
}

export function AdminHeader() {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useUser()
  const displayName = user?.name || user?.prefs?.displayName || user?.email || "Admin"

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        {/* Left: brand */}
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin" className="font-semibold inline-flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Admin Console</span>
          </Link>
        </div>

        {/* Middle: search */}
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search admin…" />
        </div>

        {/* Right: theme toggle + user menu */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2">
                <Avatar className="h-6 w-6">
                  {/* If you have a user image url, put it here */}
                  <AvatarImage src={user?.prefs?.image ?? ""} alt={displayName} />
                  <AvatarFallback>{initials(displayName)}</AvatarFallback>
                </Avatar>
                <span className="ml-2 hidden sm:inline-block max-w-[160px] truncate text-sm">
                  {displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuLabel className="flex flex-col">
                <span className="truncate">{displayName}</span>
                {user?.email && (
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/admin">
                <DropdownMenuItem>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Overview
                </DropdownMenuItem>
              </Link>
              <Link href="/">
                <DropdownMenuItem>
                  <Home className="mr-2 h-4 w-4" />
                  Back to app
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
