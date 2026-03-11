"use client"
import { useState } from "react"
import { Keyboard, Search } from "lucide-react"
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
    <section
      className="bg-white rounded-[20px] border border-[#F1F5F9] overflow-hidden"
      style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)", fontFamily: "Inter, sans-serif" }}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F1F5F9]">
        <Keyboard className="w-4 h-4 text-[#538100]" />
        <h3 className="text-[15px] font-bold text-[#0F172A]">Enter code manually</h3>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="0123456789013"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="flex-1 h-[44px] rounded-xl border border-[#E2E8F0] bg-[#F7F8F6] px-4 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33] transition-colors"
          />
          <button
            type="button"
            onClick={submit}
            className="h-[44px] px-3 lg:px-5 bg-[#538100] hover:bg-[#466e00] text-white rounded-xl text-[14px] font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
          >
            <Search className="w-5 h-5 lg:w-4 lg:h-4" />
            <span className="hidden lg:inline">Look Up</span>
          </button>
        </div>
        {error && <p className="text-[12px] text-[#EF4444]">{error}</p>}
      </div>
    </section>
  )
}
