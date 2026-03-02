"use client"

import { useState } from "react"
import { X, Check } from "lucide-react"

const SORT_OPTIONS = [
    { value: "relevance", label: "Relevance" },
    { value: "time", label: "Cooking Time" },
    { value: "calories", label: "Calories" },
    { value: "protein", label: "Protein" },
] as const

export type SortValue = (typeof SORT_OPTIONS)[number]["value"]

interface SortSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    value: SortValue
    onSelect: (value: SortValue) => void
}

export function SortSheet({ open, onOpenChange, value, onSelect }: SortSheetProps) {
    if (!open) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-50"
                onClick={() => onOpenChange(false)}
            />

            {/* Desktop: centered dropdown card */}
            <div className="hidden lg:block fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] bg-white rounded-2xl shadow-2xl">
                <div className="px-6 py-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[18px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                            Sort by
                        </h3>
                        <button type="button" onClick={() => onOpenChange(false)} className="p-1 rounded-lg hover:bg-[#F1F5F9]">
                            <X className="w-4 h-4 text-[#64748B]" />
                        </button>
                    </div>

                    <div className="space-y-1">
                        {SORT_OPTIONS.map((option) => {
                            const isSelected = value === option.value
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onSelect(option.value)
                                        onOpenChange(false)
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${isSelected ? "bg-[#F0F7E6]" : "hover:bg-[#F8FAFC]"
                                        }`}
                                >
                                    <span className={`text-[15px] ${isSelected ? "font-bold text-[#0F172A]" : "font-medium text-[#475569]"}`}>
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <span className="w-6 h-6 rounded-full bg-[#99CC33] flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile: bottom sheet */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[20px] shadow-2xl animate-in slide-in-from-bottom duration-300">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-[#CBD5E1]" />
                </div>

                <div className="px-6 pb-6">
                    <h3 className="text-[20px] font-bold text-[#0F172A] mb-5" style={{ fontFamily: "Inter, sans-serif" }}>
                        Sort by
                    </h3>

                    <div className="space-y-1">
                        {SORT_OPTIONS.map((option) => {
                            const isSelected = value === option.value
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onSelect(option.value)
                                        onOpenChange(false)
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-4 rounded-[14px] text-left transition-colors ${isSelected ? "bg-[#F0F7E6]" : "hover:bg-[#F8FAFC]"
                                        }`}
                                >
                                    <span className={`text-[16px] ${isSelected ? "font-bold text-[#0F172A]" : "font-medium text-[#475569]"}`}>
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <span className="w-6 h-6 rounded-full bg-[#99CC33] flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-full mt-4 py-3.5 rounded-[14px] bg-[#F1F5F9] text-[#475569] text-[16px] font-semibold hover:bg-[#E2E8F0] transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </>
    )
}
