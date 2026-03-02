// app/login/page.tsx
"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { account } from "@/lib/appwrite"
import { Eye, EyeOff, ChevronLeft, Shield } from "lucide-react"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--nutri-bg)" }} />}>
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
      toast({ title: "Sign-in failed", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--nutri-bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link href="/welcome" className="flex items-center justify-center w-12 h-12">
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
        </Link>
        <span className="text-[18px] font-bold tracking-[-0.45px] pr-12" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
          Sign In
        </span>
        <div className="w-12" />
      </div>

      {/* Heading */}
      <div className="px-6 pt-8 pb-2 text-center">
        <h1 className="text-[28px] font-bold leading-[35px] tracking-[-0.7px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
          Welcome back
        </h1>
        <p className="mt-2 text-[14px] leading-[20px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>
          Sign in to continue your nutrition journey.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="px-6 pt-6 space-y-4">
        <div>
          <label className="block px-1 pb-2 text-[14px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
            Email Address
          </label>
          <input
            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email" placeholder="Enter your email"
            className="w-full h-14 px-6 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)]"
            style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
          />
        </div>
        <div>
          <div className="flex items-center justify-between px-1 pb-2">
            <label className="text-[14px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
              Password
            </label>
            <Link href="/forgot-password" className="text-[12px] font-medium no-underline" style={{ color: "var(--nutri-link)", fontFamily: "Inter, sans-serif" }}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="Enter your password"
              className="w-full h-14 px-6 pr-12 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)]"
              style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
            />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1" aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff className="w-5 h-5" style={{ color: "var(--nutri-placeholder)" }} /> : <Eye className="w-5 h-5" style={{ color: "var(--nutri-placeholder)" }} />}
            </button>
          </div>
        </div>

        {/* CTA */}
        <button
          type="submit" disabled={isLoading}
          className="w-full h-14 rounded-full text-[16px] font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)" }}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Social auth divider */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px" style={{ background: "var(--nutri-border)" }} />
          <span className="text-[12px] font-medium tracking-[0.6px] uppercase" style={{ color: "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}>
            or sign in with
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--nutri-border)" }} />
        </div>

        <div className="space-y-3 pt-4">
          <button disabled title="Coming soon" className="w-full h-14 rounded-full border bg-white flex items-center justify-center text-[16px] font-semibold disabled:opacity-60" style={{ borderColor: "var(--nutri-border)", color: "#334155", fontFamily: "Inter, sans-serif" }}>
            Sign in with Google
          </button>
          <button disabled title="Coming soon" className="w-full h-14 rounded-full border bg-white flex items-center justify-center gap-3 text-[16px] font-semibold disabled:opacity-60" style={{ borderColor: "var(--nutri-border)", color: "#334155", fontFamily: "Inter, sans-serif" }}>
            <span className="text-[14px]">🍎</span> Sign in with Apple
          </button>
        </div>
      </div>

      {/* Trust footer */}
      <div className="px-6 py-8 flex flex-col items-center gap-4">
        <div className="w-full rounded-[48px] px-4 py-4 flex items-center gap-3 border" style={{ background: "var(--nutri-green-5)", borderColor: "var(--nutri-green-10)" }}>
          <Shield className="w-4 h-4 shrink-0" style={{ color: "var(--nutri-green-dark)" }} />
          <p className="text-[13px] leading-[18px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>
            Your privacy is our priority. Your data is encrypted and secure.
          </p>
        </div>
        <p className="text-[14px]" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-extrabold no-underline" style={{ color: "var(--nutri-link)" }}>Create account</Link>
        </p>
      </div>
    </div>
  )
}
