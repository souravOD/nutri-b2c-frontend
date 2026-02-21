// app/login/page.tsx
"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { account } from "@/lib/appwrite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

// Top-level page only renders a Suspense boundary.
// The component that calls useSearchParams() is inside it.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search?.get("next") || null

  const { refresh, isAdmin } = useUser()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      await account.createEmailPasswordSession(email.trim(), password)
      await refresh()
      const dest = next ?? (isAdmin() ? "/admin" : "/")
      router.replace(dest)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please check your credentials and try again."
      toast({
        title: "Sign-in failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Continue with your email and password.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-2.5 p-1 text-muted-foreground"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            <Button type="button" variant="outline" className="w-full" disabled title="SSO coming soon">
              Continue with SSO
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="text-muted-foreground hover:underline">Forgot password?</Link>
              <Link href="/register" className="text-muted-foreground hover:underline">Create account</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
