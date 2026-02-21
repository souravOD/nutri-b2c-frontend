// app/forgot-password/page.tsx
"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { account } from "@/lib/appwrite"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4 text-center">
              <p>We’ve sent a password reset link to <strong>{email}</strong>.</p>
              <Button asChild className="w-full">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
              <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
