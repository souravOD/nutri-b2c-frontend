"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const router = useRouter()
  useEffect(() => { router.replace("/onboarding/personal-info") }, [router])
  return <div className="min-h-screen" style={{ background: "var(--nutri-bg)" }} />
}
