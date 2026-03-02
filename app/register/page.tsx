// app/register/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ID, Permission, Role } from "appwrite"
import { account, databases } from "@/lib/appwrite"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, ChevronLeft, Shield } from "lucide-react"
import { syncProfile } from "@/lib/api"

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
const PROFILE_COLL = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID as string

export default function RegisterPage() {
  const router = useRouter()
  const { refresh, needsHealthOnboarding } = useUser()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      await account.create(ID.unique(), email.trim(), password, name.trim())
      await account.createEmailPasswordSession(email.trim(), password)
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
        }, me.$id)
      } catch { /* ignore in client */ }
      await refresh()
      router.replace(needsHealthOnboarding ? "/onboarding" : "/")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please check details and try again."
      toast({ title: "Registration failed", description: message, variant: "destructive" })
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
          Join Nutri
        </span>
        <div className="w-12" />
      </div>

      {/* Hero image */}
      <div className="px-6 py-4">
        <div className="w-full h-[180px] rounded-[48px] overflow-hidden relative" style={{ background: "var(--nutri-green-10)" }}>
          <img src="/images/signup-hero.png" alt="Fresh vegetables" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Heading */}
      <div className="px-6 pt-4 pb-2 text-center">
        <h1 className="text-[28px] font-bold leading-[35px] tracking-[-0.7px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
          Start your journey to<br />better health today.
        </h1>
        <p className="mt-2 text-[14px] leading-[20px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>
          Create your account to personalized nutrition plans.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="px-6 pt-4 space-y-4">
        {/* Name field (required by backend account.create) */}
        <div>
          <label className="block px-1 pb-2 text-[14px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
            Full Name
          </label>
          <input
            id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            required autoComplete="name" placeholder="Enter your name"
            className="w-full h-14 px-6 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)]"
            style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
          />
        </div>
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
          <label className="block px-1 pb-2 text-[14px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
            Create Password
          </label>
          <div className="relative">
            <input
              id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="new-password" placeholder="Enter your password"
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
          {isLoading ? "Creating account..." : "Continue"}
        </button>
      </form>

      {/* Social auth divider */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px" style={{ background: "var(--nutri-border)" }} />
          <span className="text-[12px] font-medium tracking-[0.6px] uppercase" style={{ color: "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}>
            or sign up with
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--nutri-border)" }} />
        </div>

        <div className="space-y-3 pt-4">
          <button
            disabled title="Coming soon"
            className="w-full h-14 rounded-full border bg-white flex items-center justify-center text-[16px] font-semibold disabled:opacity-60"
            style={{ borderColor: "var(--nutri-border)", color: "#334155", fontFamily: "Inter, sans-serif" }}
          >
            Sign up with Google
          </button>
          <button
            disabled title="Coming soon"
            className="w-full h-14 rounded-full border bg-white flex items-center justify-center gap-3 text-[16px] font-semibold disabled:opacity-60"
            style={{ borderColor: "var(--nutri-border)", color: "#334155", fontFamily: "Inter, sans-serif" }}
          >
            <span className="text-[14px]">🍎</span> Sign up with Apple
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
          Already have an account?{" "}
          <Link href="/login" className="font-extrabold no-underline" style={{ color: "var(--nutri-link)" }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
