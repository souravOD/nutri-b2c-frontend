"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";

export function QuickScanFAB() {
    return (
        <Link
            href="/recipe-analyzer"
            className="fixed bottom-[148px] right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-[#99CC33] shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
            style={{
                boxShadow: "0px 6px 16px -4px rgba(153,204,51,0.4)",
            }}
            aria-label="Analyze"
        >
            <LayoutGrid className="w-5 h-5 text-white" strokeWidth={2.5} />
        </Link>
    );
}

