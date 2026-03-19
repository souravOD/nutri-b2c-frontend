"use client"

import { useEffect } from "react"
import { ChevronLeft, ArrowRight, MapPin, Globe } from "lucide-react"
import { useOnboarding, TOTAL_STEPS } from "../onboarding-context"

const COUNTRIES = [
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" },
    { value: "IN", label: "India" },
    { value: "GB", label: "United Kingdom" },
    { value: "AU", label: "Australia" },
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
    { value: "JP", label: "Japan" },
    { value: "BR", label: "Brazil" },
    { value: "MX", label: "Mexico" },
    { value: "OTHER", label: "Other" },
]

const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York",
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
    "West Virginia", "Wisconsin", "Wyoming",
]

const CA_PROVINCES = [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick",
    "Newfoundland and Labrador", "Nova Scotia", "Ontario",
    "Prince Edward Island", "Quebec", "Saskatchewan",
]

const IN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Chandigarh", "Puducherry",
]

const GB_REGIONS = [
    "England", "Scotland", "Wales", "Northern Ireland",
]

function getStatesForCountry(country: string): string[] {
    switch (country) {
        case "US": return US_STATES
        case "CA": return CA_PROVINCES
        case "IN": return IN_STATES
        case "GB": return GB_REGIONS
        default: return []
    }
}

function getStateLabel(country: string): string {
    switch (country) {
        case "US": return "State"
        case "CA": return "Province"
        case "IN": return "State"
        case "GB": return "Region"
        default: return "State / Region"
    }
}

function guessCountryFromTimezone(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (tz.startsWith("America/New_York") || tz.startsWith("America/Chicago") || tz.startsWith("America/Denver") || tz.startsWith("America/Los_Angeles") || tz.startsWith("US/")) return "US"
        if (tz.startsWith("America/Toronto") || tz.startsWith("America/Vancouver") || tz.startsWith("Canada/")) return "CA"
        if (tz.startsWith("Asia/Kolkata") || tz.startsWith("Asia/Calcutta")) return "IN"
        if (tz.startsWith("Europe/London")) return "GB"
        if (tz.startsWith("Australia/")) return "AU"
        if (tz.startsWith("Europe/Berlin")) return "DE"
        if (tz.startsWith("Europe/Paris")) return "FR"
        if (tz.startsWith("Asia/Tokyo")) return "JP"
        if (tz.startsWith("America/Sao_Paulo")) return "BR"
        if (tz.startsWith("America/Mexico_City")) return "MX"
    } catch { /* ignore */ }
    return ""
}

export default function LocationPage() {
    const { data, setData, goNext, goBack, stepLabel, stepNumber, progress } = useOnboarding()

    // Auto-detect country on first render
    useEffect(() => {
        if (!data.country) {
            const guess = guessCountryFromTimezone()
            if (guess) setData((d) => ({ ...d, country: guess }))
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const states = getStatesForCountry(data.country)
    const stateLabel = getStateLabel(data.country)
    const showState = states.length > 0
    const showZip = ["US", "CA", "IN", "GB", "AU", "DE", "FR"].includes(data.country)

    return (
        <div className="ob-page min-h-screen flex flex-col" style={{ background: "var(--nutri-bg)" }}>
            {/* Header */}
            <div className="ob-header px-4 pt-4">
                <div className="ob-nav flex items-center justify-between">
                    <button onClick={goBack} className="ob-back flex items-center justify-center w-10 h-10 rounded-full" style={{ background: "rgba(226,232,240,0.5)" }}>
                        <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
                    </button>
                    <span className="ob-title text-[18px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Onboarding</span>
                    <div className="ob-spacer w-10" />
                </div>
                <div className="ob-progress mt-6 space-y-3 px-2">
                    <div className="flex items-end justify-between">
                        <span className="text-[16px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>{stepLabel}</span>
                        <span className="text-[14px] font-medium" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>Step {stepNumber} of {TOTAL_STEPS}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "var(--nutri-green-20)" }}>
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--nutri-green)" }} />
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className="ob-main flex-1 px-6 pt-6 pb-[160px] space-y-8 max-w-[480px] mx-auto w-full">
                <div className="ob-heading space-y-3 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--nutri-green-10)" }}>
                        <Globe className="w-8 h-8" style={{ color: "var(--nutri-green-dark)" }} />
                    </div>
                    <h1 className="text-[28px] font-bold leading-[35px] tracking-[-0.6px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
                        Where are you located?
                    </h1>
                    <p className="text-[14px] leading-[20px]" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>
                        Used for regional food recommendations, seasonal recipes, and local product pricing.
                    </p>
                </div>

                <div className="space-y-5">
                    {/* Country Select */}
                    <div className="space-y-2">
                        <label className="block px-1 text-[14px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Country</label>
                        <div className="relative">
                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--nutri-placeholder)" }} />
                            <select
                                value={data.country}
                                onChange={(e) => setData((d) => ({ ...d, country: e.target.value, state: "" }))}
                                className="ob-input w-full h-14 pl-12 pr-6 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)] appearance-none cursor-pointer"
                                style={{ background: "white", borderColor: "var(--nutri-border)", color: data.country ? "var(--nutri-heading)" : "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}
                            >
                                <option value="">Select your country</option>
                                {COUNTRIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                            <ChevronLeft className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none -rotate-90" style={{ color: "var(--nutri-placeholder)" }} />
                        </div>
                    </div>

                    {/* State/Province Select */}
                    {showState && (
                        <div className="space-y-2">
                            <label className="block px-1 text-[14px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>{stateLabel}</label>
                            <div className="relative">
                                <select
                                    value={data.state}
                                    onChange={(e) => setData((d) => ({ ...d, state: e.target.value }))}
                                    className="ob-input w-full h-14 px-6 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)] appearance-none cursor-pointer"
                                    style={{ background: "white", borderColor: "var(--nutri-border)", color: data.state ? "var(--nutri-heading)" : "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}
                                >
                                    <option value="">Select {stateLabel.toLowerCase()}</option>
                                    {states.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <ChevronLeft className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none -rotate-90" style={{ color: "var(--nutri-placeholder)" }} />
                            </div>
                        </div>
                    )}

                    {/* ZIP / Postal Code */}
                    {showZip && (
                        <div className="space-y-2">
                            <label className="block px-1 text-[14px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
                                {data.country === "CA" ? "Postal Code" : "ZIP / Postal Code"}
                                <span className="ml-1 text-[12px] font-normal" style={{ color: "var(--nutri-body-light)" }}>(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={data.zipCode}
                                onChange={(e) => setData((d) => ({ ...d, zipCode: e.target.value }))}
                                placeholder={data.country === "US" ? "e.g. 94105" : data.country === "IN" ? "e.g. 400001" : "e.g. SW1A 1AA"}
                                maxLength={10}
                                className="ob-input w-full h-14 px-6 rounded-full border text-[16px] outline-none transition-colors focus:border-[var(--nutri-green)]"
                                style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
                            />
                        </div>
                    )}
                </div>

                {/* Info callout */}
                <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "var(--nutri-green-5)", border: "1px solid var(--nutri-green-10)" }}>
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--nutri-green-dark)" }} />
                    <p className="text-[13px] leading-[18px]" style={{ color: "var(--nutri-body)", fontFamily: "Inter, sans-serif" }}>
                        Your location helps us recommend seasonal ingredients, regional dishes, and nearby grocery prices. You can change this anytime in Settings.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="ob-footer fixed bottom-0 left-0 right-0 px-6 py-6 max-w-[480px] mx-auto" style={{ background: "var(--nutri-bg)", backdropFilter: "blur(6px)" }}>
                <button
                    onClick={goNext}
                    className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[16px] font-bold text-black transition-opacity hover:opacity-90"
                    style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.25), 0px 4px 6px -4px rgba(153,204,51,0.25)" }}
                >
                    Continue <ArrowRight className="w-4 h-4" />
                </button>
                <p className="ob-terms text-center text-[12px] leading-[16px] mt-4" style={{ color: "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}>
                    You can skip this step — location is optional but recommended.
                </p>
            </div>

            <style jsx>{`
                @media (min-width: 1024px) {
                    .ob-header { max-width: 1160px; margin: 0 auto; padding: 16px 60px 0; width: 100%; box-sizing: border-box; }
                    .ob-nav { justify-content: flex-start; gap: 12px; }
                    .ob-spacer { display: none; }
                    .ob-title { font-size: 22px; font-weight: 700; }
                    .ob-main { max-width: 1160px; padding: 24px 60px 40px; box-sizing: border-box; }
                    .ob-heading { text-align: left; }
                    .ob-input { border-radius: 16px !important; }
                    .ob-footer {
                        position: static; max-width: 480px; margin: 0 auto;
                        padding: 0 60px 32px;
                    }
                }
            `}</style>
        </div>
    )
}
