// components/app-header.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Search,
  Menu,
  Moon,
  Sun,
  Settings,
  Shield,
  LogOut,
  User,
  Heart,
  Clock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/hooks/use-user"

type Props = {
  showMenuButton?: boolean
  onToggleSidebar?: () => void
}

export function AppHeader({ showMenuButton = false, onToggleSidebar }: Props) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, isAuthed, signOut, isAdmin: isAdminFn } = useUser()
  const isAdmin = isAdminFn()
  const userRecord = user && typeof user === "object" ? (user as Record<string, unknown>) : null

  const [searchQuery, setSearchQuery] = useState("")

  // Cmd/Ctrl + K focuses the search box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const withMeta = e.ctrlKey || e.metaKey
      if (withMeta && e.key.toLowerCase() === "k") {
        e.preventDefault()
        const input = document.getElementById("global-search") as HTMLInputElement | null
        input?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const displayName =
    user?.name ||
    (userRecord && typeof userRecord.displayName === "string" ? userRecord.displayName : undefined) ||
    user?.email ||
    "You"
  const avatarImage =
    (userRecord && typeof userRecord.image === "string" ? userRecord.image : undefined) ||
    user?.prefs?.image ||
    ""

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-3 sm:px-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Brand */}
        <Link href="/" className="hidden font-semibold sm:inline-flex">
          NutriFind
        </Link>

        {/* Search */}
        <form onSubmit={onSearchSubmit} className="ml-auto mr-2 flex min-w-0 flex-1 sm:ml-4">
          <div className="relative flex w-full items-center">
            <Search className="pointer-events-none absolute left-2 h-4 w-4 text-muted-foreground" />
            <Input
              id="global-search"
              className="pl-8"
              placeholder="Search recipes... (Press ⌘/Ctrl + K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-1 h-9 px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarImage} alt={displayName} />
                <AvatarFallback>{String(displayName).slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{displayName}</span>
                {isAuthed && user?.email && (
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/favorites")}>
              <Heart className="mr-2 h-4 w-4" />
              Favorites
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/history")}>
              <Clock className="mr-2 h-4 w-4" />
              History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>

            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Console
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default AppHeader
