"use client";

import { RotateCcw, PenLine } from "lucide-react";

interface ScanErrorSheetProps {
    open: boolean;
    onRetry: () => void;
    onManualEntry: () => void;
}

/**
 * Bottom sheet for "Product Not Found" errors during mobile barcode scanning.
 * Slides up from the bottom with retry and manual entry options.
 * Themed to match the Figma design: green barcode icon with red badge.
 */
export function ScanErrorSheet({ open, onRetry, onManualEntry }: ScanErrorSheetProps) {
    if (!open) return null;

    return (
        <div className="absolute inset-x-0 bottom-0 z-30 animate-in slide-in-from-bottom duration-300">
            <div
                className="bg-white rounded-t-[28px] px-6 pt-5 pb-8"
                style={{ boxShadow: "0 -8px 30px rgba(0,0,0,0.12)", fontFamily: "Inter, sans-serif" }}
            >
                {/* Handle */}
                <div className="flex justify-center mb-5">
                    <div className="w-10 h-1.5 rounded-full bg-[#D1D5DB]" />
                </div>

                {/* Icon — green barcode with red error badge */}
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-[#99CC33]/15 flex items-center justify-center">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="5" width="2" height="14" rx="1" fill="#538100" />
                                <rect x="7" y="5" width="1.5" height="14" rx="0.75" fill="#538100" />
                                <rect x="11" y="5" width="2" height="14" rx="1" fill="#538100" />
                                <rect x="15" y="5" width="1" height="14" rx="0.5" fill="#538100" />
                                <rect x="18" y="5" width="3" height="14" rx="1" fill="#538100" />
                            </svg>
                        </div>
                        {/* Red error badge */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#EF4444] flex items-center justify-center border-2 border-white">
                            <span className="text-white text-[11px] font-bold">!</span>
                        </div>
                    </div>
                </div>

                {/* Title + description */}
                <h3 className="text-[18px] font-bold text-[#0F172A] text-center mb-2">
                    Product Not Found
                </h3>
                <p className="text-[14px] text-[#64748B] text-center mb-6 leading-5 max-w-[300px] mx-auto">
                    We couldn&apos;t recognize this barcode. Please ensure the code is clear and within the frame, or enter the details yourself.
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3 items-center">
                    <button
                        type="button"
                        onClick={onRetry}
                        className="w-full h-[52px] bg-[#99CC33] hover:bg-[#8ABF2A] text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Try Again
                    </button>
                    <button
                        type="button"
                        onClick={onManualEntry}
                        className="flex items-center gap-2 text-[14px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors py-2"
                    >
                        <PenLine className="w-4 h-4" />
                        Add Manually
                    </button>
                </div>
            </div>
        </div>
    );
}
