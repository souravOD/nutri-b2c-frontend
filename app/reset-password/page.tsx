// app/reset-password/page.tsx
"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { account } from "@/lib/appwrite"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, ChevronLeft, Lock } from "lucide-react"

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--nutri-bg)" }} />}>
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
      toast({ title: "Invalid or expired link", description: "Please request a new password reset email.", variant: "destructive" })
      return
    }
    if (pw1 !== pw2) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--nutri-bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => router.push("/login")} className="flex items-center justify-center w-12 h-12">
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
        </button>
        <span className="text-[18px] font-bold tracking-[-0.45px] pr-12" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
          New Password
        </span>
        <div className="w-12" />
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-12 max-w-md mx-auto w-full">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: "var(--nutri-green-10)" }}>
          <Lock className="w-7 h-7" style={{ color: "var(--nutri-green-dark)" }} />
        </div>
        <h1 className="text-[28px] font-bold leading-[35px] text-center" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
          Create new password
        </h1>
        <p className="mt-2 text-[14px] text-center leading-[20px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>
          Enter a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4 mt-8">
          <div>
            <label className="block px-1 pb-2 text-[14px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
              New Password
            </label>
            <div className="relative">
              <input
                id="pw1" type={showPw ? "text" : "password"} value={pw1} onChange={(e) => setPw1(e.target.value)}
                required minLength={12} autoComplete="new-password" placeholder="Enter new password"
                className="w-full h-14 px-6 pr-12 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)]"
                style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1" aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff className="w-5 h-5" style={{ color: "var(--nutri-placeholder)" }} /> : <Eye className="w-5 h-5" style={{ color: "var(--nutri-placeholder)" }} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block px-1 pb-2 text-[14px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
              Confirm Password
            </label>
            <input
              id="pw2" type={showPw ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)}
              required minLength={12} autoComplete="new-password" placeholder="Confirm new password"
              className="w-full h-14 px-6 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)]"
              style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
            />
          </div>
          <button
            type="submit" disabled={loading || !userId || !secret}
            className="w-full h-14 rounded-full text-[16px] font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)" }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  )
}
