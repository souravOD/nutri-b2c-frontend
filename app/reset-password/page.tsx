// app/reset-password/page.tsx
"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { account } from "@/lib/appwrite"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

// Wrap the reader of useSearchParams in Suspense
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <ResetPasswordClient />
    </Suspense>
  )
}

function ResetPasswordClient() {
  const params = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [pw1, setPw1] = useState("")
  const [pw2, setPw2] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setUserId(params.get("userId"))
    setSecret(params.get("secret"))
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId || !secret) {
      toast({
        title: "Invalid or expired link",
        description: "Please request a new password reset email.",
        variant: "destructive",
      })
      return
    }

    if (pw1 !== pw2) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      // Appwrite: userId, secret, newPassword
      await account.updateRecovery(userId, secret, pw1)
      toast({ title: "Password updated", description: "You can now sign in with your new password." })
      router.replace("/login")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : ""
      toast({ title: "Reset failed", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw1">New password</Label>
              <div className="relative">
                <Input
                  id="pw1"
                  type={showPw ? "text" : "password"}
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  className="pr-10"
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

            <div className="space-y-2">
              <Label htmlFor="pw2">Confirm new password</Label>
              <Input
                id="pw2"
                type={showPw ? "text" : "password"}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !userId || !secret}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
