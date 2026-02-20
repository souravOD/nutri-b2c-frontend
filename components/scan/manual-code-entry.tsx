"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Keyboard } from "lucide-react"
import { validateBarcode } from "@/lib/barcode"

export function ManualCodeEntry({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!validateBarcode(code)) {
      setError("Please enter a valid UPC/EAN (8, 12, or 13 digits)")
      return
    }
    setError(null)
    onSubmit(code) // Parent handles the API call
    setCode("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Keyboard className="w-4 h-4" /> Enter code manually
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="0123456789013"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Button onClick={submit}>Look Up</Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </CardContent>
    </Card>
  )
}
