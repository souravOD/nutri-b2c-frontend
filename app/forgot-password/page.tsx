// app/forgot-password/page.tsx
"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { account } from "@/lib/appwrite"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Check, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      await account.createRecovery(email, `${baseUrl}/reset-password`)
      setEmailSent(true)
      toast({ title: "Reset link sent", description: "Check your inbox for the reset link." })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : ""
      toast({ title: "Failed to send reset link", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--nutri-bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link href="/login" className="flex items-center justify-center w-12 h-12">
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
        </Link>
        <span className="text-[18px] font-bold tracking-[-0.45px] pr-12" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
          Reset Password
        </span>
        <div className="w-12" />
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-12">
        {emailSent ? (
          <div className="text-center space-y-4 w-full max-w-md">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--nutri-green)" }}>
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-[28px] font-bold leading-[35px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
              Check your email
            </h1>
            <p className="text-[14px] leading-[20px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
            </p>
            <Link
              href="/login"
              className="flex items-center justify-center w-full h-14 rounded-full text-[16px] font-bold text-black no-underline mt-8"
              style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)" }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--nutri-green-10)" }}>
                <Mail className="w-7 h-7" style={{ color: "var(--nutri-green-dark)" }} />
              </div>
              <h1 className="text-[28px] font-bold leading-[35px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
                Forgot password?
              </h1>
              <p className="mt-2 text-[14px] leading-[20px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>
                Enter your email to receive a password reset link.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block px-1 pb-2 text-[14px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
                  Email Address
                </label>
                <input
                  id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email"
                  className="w-full h-14 px-6 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)]"
                  style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
                />
              </div>
              <button
                type="submit" disabled={isLoading}
                className="w-full h-14 rounded-full text-[16px] font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)" }}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <div className="text-center">
              <Link href="/login" className="text-[14px] no-underline" style={{ color: "var(--nutri-link)", fontFamily: "Inter, sans-serif" }}>
                ← Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
