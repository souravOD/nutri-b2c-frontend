// app/verify-email/page.tsx
"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { account } from "@/lib/appwrite"
import { CheckCircle, Loader2, XCircle } from "lucide-react"

function VerifyEmailClient() {
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const userId = params.get("userId")
    const secret = params.get("secret")
    if (!userId || !secret) { setStatus("success"); return }
    setStatus("verifying")
    account.updateVerification(userId, secret)
      .then(() => setStatus("success"))
      .catch((e) => { setError(e?.message || "Verification failed"); setStatus("error") })
  }, [params])

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--nutri-bg)" }}>
        <Loader2 className="w-12 h-12 animate-spin mb-6" style={{ color: "var(--nutri-green)" }} />
        <h1 className="text-[28px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Verifying your email…</h1>
        <p className="mt-2 text-[14px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>This will only take a moment.</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--nutri-bg)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-red-100">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-[28px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Verification failed</h1>
        <p className="mt-2 text-[14px] text-center" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-8 w-full max-w-xs h-14 rounded-full text-[16px] font-bold text-black"
          style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)" }}
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--nutri-bg)" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: "var(--nutri-green)" }}>
        <CheckCircle className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-[28px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Email verified!</h1>
      <p className="mt-2 text-[14px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>You can now access all features.</p>
      <Link
        href="/"
        className="mt-8 w-full max-w-xs h-14 rounded-full flex items-center justify-center text-[16px] font-bold text-black no-underline"
        style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)" }}
      >
        Continue to App
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--nutri-bg)" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--nutri-green)" }} /></div>}>
      <VerifyEmailClient />
    </Suspense>
  )
}
