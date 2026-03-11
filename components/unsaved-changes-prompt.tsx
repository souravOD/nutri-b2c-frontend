"use client"

import { useEffect } from "react"

interface UnsavedChangesPromptProps {
  hasUnsavedChanges: boolean
}

export function UnsavedChangesPrompt({ hasUnsavedChanges }: UnsavedChangesPromptProps) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    if (hasUnsavedChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload)
      // Note: Next.js App Router doesn't have a built-in way to intercept route changes
      // This is a simplified implementation for the demo
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  return null
}
