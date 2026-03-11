"use client"

import { Camera, Upload, Keyboard, ShieldCheck } from "lucide-react"

type Props = {
  onPermissionGranted: () => void
  onFallback: () => void
}

export function CameraPermissionGate({ onPermissionGranted, onFallback }: Props) {
  return (
    <div
      className="min-h-[100dvh] bg-[#F7F8F6] flex flex-col"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <div className="text-center pt-12 pb-6 px-6">
        <h1 className="text-[22px] font-bold text-[#0F172A]">Barcode Scanner</h1>
        <p className="text-[14px] text-[#94A3B8] mt-1.5">
          Scan product barcodes to view nutrition information
        </p>
      </div>

      {/* Main card */}
      <div className="flex-1 flex flex-col items-center px-6">
        <div
          className="w-full max-w-[420px] bg-white rounded-[24px] border border-[#F1F5F9] p-6 space-y-5"
          style={{ boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.06)" }}
        >
          {/* Camera icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#99CC33]/15 flex items-center justify-center">
              <Camera className="w-8 h-8 text-[#538100]" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-[18px] font-bold text-[#0F172A]">
              Camera Access Required
            </h2>
            <p className="text-[14px] text-[#64748B] mt-2 leading-5">
              To scan barcodes with your camera, we need permission to access it.
            </p>
          </div>

          {/* Enable Camera button */}
          <button
            type="button"
            onClick={onPermissionGranted}
            className="w-full h-[52px] bg-[#538100] hover:bg-[#466e00] text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
          >
            <Camera className="w-5 h-5" />
            Enable Camera
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E2E8F0]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-3 text-[#94A3B8] font-medium">
                Or use alternatives
              </span>
            </div>
          </div>

          {/* Alternative buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onFallback}
              className="h-[48px] rounded-2xl border border-[#E2E8F0] bg-white hover:bg-[#F7F8F6] text-[#0F172A] flex items-center justify-center gap-2 text-[14px] font-medium transition-colors"
            >
              <Upload className="w-4 h-4 text-[#538100]" />
              Upload Image
            </button>
            <button
              type="button"
              onClick={onFallback}
              className="h-[48px] rounded-2xl border border-[#E2E8F0] bg-white hover:bg-[#F7F8F6] text-[#0F172A] flex items-center justify-center gap-2 text-[14px] font-medium transition-colors"
            >
              <Keyboard className="w-4 h-4 text-[#538100]" />
              Enter Code
            </button>
          </div>

          {/* Privacy notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#F7F8F6] border border-[#F1F5F9]">
            <ShieldCheck className="w-4 h-4 text-[#538100] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[12px] font-semibold text-[#0F172A] mb-0.5">Privacy Notice</p>
              <p className="text-[11px] text-[#64748B] leading-4">
                Camera access is only used for barcode scanning. No images are stored or transmitted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
