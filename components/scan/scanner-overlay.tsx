"use client";

/**
 * Full-screen scanner overlay for mobile: dark semi-transparent mask with
 * a transparent cutout, green corner brackets, and an animated scan line.
 */
export function ScannerOverlay() {
    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {/* Semi-transparent dark overlay with central cutout via SVG */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                    <mask id="scanner-cutout">
                        <rect width="100%" height="100%" fill="white" />
                        {/* Cutout: centered square with rounded corners */}
                        <rect
                            x="12%"
                            y="28%"
                            width="76%"
                            height="30%"
                            rx="16"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.55)"
                    mask="url(#scanner-cutout)"
                />
            </svg>

            {/* Green corner brackets */}
            <div
                className="absolute"
                style={{ left: "12%", top: "28%", width: "76%", height: "30%" }}
            >
                {/* Top-left corner */}
                <div className="absolute top-0 left-0 w-6 h-6">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-[#99CC33] rounded-full" />
                    <div className="absolute top-0 left-0 h-full w-[3px] bg-[#99CC33] rounded-full" />
                </div>
                {/* Top-right corner */}
                <div className="absolute top-0 right-0 w-6 h-6">
                    <div className="absolute top-0 right-0 w-full h-[3px] bg-[#99CC33] rounded-full" />
                    <div className="absolute top-0 right-0 h-full w-[3px] bg-[#99CC33] rounded-full" />
                </div>
                {/* Bottom-left corner */}
                <div className="absolute bottom-0 left-0 w-6 h-6">
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#99CC33] rounded-full" />
                    <div className="absolute bottom-0 left-0 h-full w-[3px] bg-[#99CC33] rounded-full" />
                </div>
                {/* Bottom-right corner */}
                <div className="absolute bottom-0 right-0 w-6 h-6">
                    <div className="absolute bottom-0 right-0 w-full h-[3px] bg-[#99CC33] rounded-full" />
                    <div className="absolute bottom-0 right-0 h-full w-[3px] bg-[#99CC33] rounded-full" />
                </div>

                {/* Animated scan line */}
                <div
                    className="absolute left-[10%] right-[10%] h-[2px] bg-[#99CC33] shadow-[0_0_12px_#99CC33]"
                    style={{
                        animation: "scanLine 2.5s ease-in-out infinite",
                    }}
                />
            </div>

            {/* Scan line animation */}
            <style jsx>{`
        @keyframes scanLine {
          0%, 100% { top: 5%; }
          50% { top: 90%; }
        }
      `}</style>
        </div>
    );
}
