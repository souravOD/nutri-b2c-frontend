// app/register/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ID, Permission, Role } from "appwrite"
import { account, databases } from "@/lib/appwrite"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, User as UserIcon } from "lucide-react"
import { syncProfile } from "@/lib/api";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
const PROFILE_COLL = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID as string

export default function RegisterPage() {
  const router = useRouter()
  const { refresh, needsHealthOnboarding } = useUser()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      // 1) Create account (unauth flow)
      await account.create(ID.unique(), email.trim(), password, name.trim())

      // 2) Create session (sign in)
      await account.createEmailPasswordSession(email.trim(), password)

      // 3) Create a minimal profile document that matches your schema
      try {
        const me = await account.get()
        const permissions = [
          Permission.read(Role.user(me.$id)),
          Permission.update(Role.user(me.$id)),
          Permission.delete(Role.user(me.$id)),
        ]

        await databases.createDocument(DB_ID, PROFILE_COLL, me.$id, {
          displayName: me.name ?? name.trim(),
          email: me.email ?? email.trim(),
          image: "",
        }, permissions)
        await syncProfile({
          displayName: me.name,
          email: me.email ?? email.trim(),
          phone: me.phone ?? null,
          country: "USA",
          imageUrl: null,
        }, me.$id);
      } catch { /* ignore in client */ }

      // 4) Refresh context & route
      await refresh()
      router.replace(needsHealthOnboarding ? "/onboarding" : "/")
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err?.message ?? "Please check details and try again.",
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
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Use a strong password (min 12 chars with mixed case, number &amp; symbol).
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  className="pl-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

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
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Already have an account?</span>
              <Link href="/login" className="text-muted-foreground hover:underline">Sign in</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
