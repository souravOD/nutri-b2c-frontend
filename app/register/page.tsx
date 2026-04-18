// app/register/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { ID, Permission, Role } from "appwrite"
import { account, databases } from "@/lib/appwrite"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, ChevronLeft, Shield } from "lucide-react"
import { syncProfile } from "@/lib/api"
import { setAuthCookie } from "@/lib/auth-cookie"
import { safeRedirect } from "@/lib/utils/safeRedirect"

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string
const PROFILE_COLL = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID as string

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--nutri-bg)" }} />}>
      <RegisterInner />
    </Suspense>
  )
}
function RegisterInner() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search?.get("next") || search?.get("redirect") || null
  const { refresh, needsHealthOnboarding } = useUser()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [consent, setConsent] = useState(false)

  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || ""

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      await account.create(ID.unique(), email.trim(), password, name.trim())
      await account.createEmailPasswordSession(email.trim(), password)
      try {
        const me = await account.get()
        const permissions = [
          Permission.read(Role.user(me.$id)),
          Permission.update(Role.user(me.$id)),
          Permission.delete(Role.user(me.$id)),
        ]
        await databases.createDocument(DB_ID, PROFILE_COLL, me.$id, {
          displayName: me.name ?? name.trim(),
          email: me.email ?? email.trim(),
          image: "",
        }, permissions)
        await syncProfile({
          displayName: me.name,
          email: me.email ?? email.trim(),
          phone: me.phone ?? null,
          country: "USA",
          imageUrl: null,
        }, me.$id)
      } catch (syncErr) {
        console.warn("[register] Sync to Supabase failed — will auto-provision on next request:", syncErr)
      }
      await setAuthCookie() // B2C-032: HttpOnly auth signal cookie
      await refresh()
      // SEC-2: Redirect to ?next= if present (validated), else default flow
      const dest = next
        ? safeRedirect(next, needsHealthOnboarding ? "/onboarding" : "/")
        : (needsHealthOnboarding ? "/onboarding" : "/")
      router.replace(dest)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please check details and try again."
      toast({ title: "Registration failed", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="reg-page" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ── Mobile header (hidden on desktop) ── */}
      <div className="reg-mobile-header">
        <Link href="/welcome" className="reg-back-link">
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
        </Link>
        <span className="reg-page-title">Join Nutri</span>
        <div style={{ width: 48 }} />
      </div>

      {/* ── Desktop header ── */}
      <div className="reg-desktop-header">
        <h1 className="reg-desktop-title">Join Nutri</h1>
      </div>

      {/* ── Desktop: 2-column layout | Mobile: single column ── */}
      <div className="reg-body">
        {/* LEFT PANEL: image + tagline */}
        <div className="reg-left">
          <div className="reg-hero-img">
            <img src="/images/signup-hero.png" alt="Fresh vegetables" />
          </div>
          <div className="reg-tagline">
            <h2 className="reg-tagline-h">
              Start your journey to<br />better health today.
            </h2>
            <p className="reg-tagline-p">
              Create your account to personalized nutrition plans.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: form + social + trust (ALL INLINED) */}
        <div className="reg-right">
          {/* ── Form ── */}
          <form onSubmit={handleRegister} className="reg-form">
            <div>
              <label className="reg-label">Full Name</label>
              <input
                id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                required autoComplete="name" placeholder="Enter your name"
                className="reg-input"
              />
            </div>
            <div>
              <label className="reg-label">Email Address</label>
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="Enter your email"
                className="reg-input"
              />
            </div>
            <div>
              <label className="reg-label">Create Password</label>
              <div className="reg-pw-wrap">
                <input
                  id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="new-password" placeholder="Enter your password"
                  className="reg-input reg-input-pw"
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="reg-pw-toggle" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff className="w-5 h-5" style={{ color: "var(--nutri-placeholder)" }} /> : <Eye className="w-5 h-5" style={{ color: "var(--nutri-placeholder)" }} />}
                </button>
              </div>
            </div>

            {/* ── Consent ── */}
            <label className="reg-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
                className="reg-consent-check"
              />
              <span className="reg-consent-text">
                I agree to the{" "}
                {marketingUrl ? (
                  <>
                    <a href={`${marketingUrl}/terms`} target="_blank" rel="noopener noreferrer"
                       className="reg-consent-link" style={{ color: "var(--nutri-link)" }}>
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href={`${marketingUrl}/privacy`} target="_blank" rel="noopener noreferrer"
                       className="reg-consent-link" style={{ color: "var(--nutri-link)" }}>
                      Privacy Policy
                    </a>
                  </>
                ) : (
                  "Terms of Service and Privacy Policy"
                )}
              </span>
            </label>

            <button type="submit" disabled={isLoading} className="reg-cta">
              {isLoading ? "Creating account..." : "Continue"}
            </button>
          </form>

          {/* ── Social auth ── */}
          <div className="reg-social">
            <div className="reg-divider">
              <div className="reg-divider-line" />
              <span className="reg-divider-text">or sign up with</span>
              <div className="reg-divider-line" />
            </div>
            <div className="reg-social-btns">
              <button disabled title="Coming soon" className="reg-social-btn">Sign up with Google</button>
              <button disabled title="Coming soon" className="reg-social-btn">
                <span style={{ fontSize: 14 }}>🍎</span> Sign up with Apple
              </button>
            </div>
          </div>

          {/* ── Trust footer ── */}
          <div className="reg-trust">
            <div className="reg-trust-badge">
              <Shield className="w-4 h-4 shrink-0" style={{ color: "var(--nutri-green-dark)" }} />
              <p className="reg-trust-text">See our Privacy Policy for how we handle your data.</p>
            </div>
            <p className="reg-login-link">
              Already have an account?{" "}
              <Link href="/login" className="font-extrabold no-underline" style={{ color: "var(--nutri-link)" }}>Log in</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ── Design tokens ── */
        .reg-page {
          min-height: 100vh;
          background: var(--nutri-bg, #F5F5F0);
        }

        /* ── Mobile header ── */
        .reg-mobile-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 16px 8px;
        }
        .reg-back-link {
          display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;
        }
        .reg-page-title {
          font-size: 18px; font-weight: 700; letter-spacing: -0.45px;
          color: var(--nutri-heading);
        }

        /* ── Desktop header ── */
        .reg-desktop-header { display: none; }
        .reg-desktop-title {
          font-size: 28px; font-weight: 800; letter-spacing: -0.7px;
          color: var(--nutri-heading); text-align: center; margin: 0;
        }

        /* ── Body / layout ── */
        .reg-body { display: flex; flex-direction: column; }

        /* ── Left panel ── */
        .reg-left { padding: 0 24px 16px; }
        .reg-hero-img {
          width: 100%; height: 180px; border-radius: 48px; overflow: hidden;
          background: var(--nutri-green-10); position: relative;
        }
        .reg-hero-img img { width: 100%; height: 100%; object-fit: cover; }
        .reg-tagline { text-align: center; padding: 16px 0 8px; }
        .reg-tagline-h {
          font-size: 28px; font-weight: 700; line-height: 35px;
          letter-spacing: -0.7px; color: var(--nutri-heading); margin: 0;
        }
        .reg-tagline-p {
          margin-top: 8px; font-size: 14px; line-height: 20px;
          color: var(--nutri-body);
        }

        /* ── Right panel ── */
        .reg-right { padding: 0 24px; }

        /* ── Form ── */
        .reg-form { display: flex; flex-direction: column; gap: 16px; }
        .reg-label {
          display: block; padding: 0 4px 8px; font-size: 14px; font-weight: 600;
          color: var(--nutri-heading);
        }
        .reg-input {
          width: 100%; height: 56px; padding: 0 24px; border-radius: 9999px;
          border: 1px solid var(--nutri-border); background: white;
          font-size: 16px; color: var(--nutri-heading); outline: none;
          font-family: Inter, sans-serif;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .reg-input:focus { border-color: var(--nutri-green); }
        .reg-input-pw { padding-right: 48px; }
        .reg-pw-wrap { position: relative; }
        .reg-pw-toggle {
          position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
          padding: 4px; background: none; border: none; cursor: pointer;
        }
        .reg-cta {
          width: 100%; height: 56px; border-radius: 9999px; border: none;
          background: var(--nutri-green); font-size: 16px; font-weight: 700;
          color: #0F172A; cursor: pointer;
          box-shadow: 0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2);
          transition: opacity 0.15s;
          font-family: Inter, sans-serif;
        }
        .reg-cta:hover { opacity: 0.9; }
        .reg-cta:disabled { opacity: 0.5; }

        /* ── Social ── */
        .reg-social { padding: 24px 0 0; }
        .reg-divider { display: flex; align-items: center; gap: 16px; padding: 8px 0; }
        .reg-divider-line { flex: 1; height: 1px; background: var(--nutri-border); }
        .reg-divider-text {
          font-size: 12px; font-weight: 500; letter-spacing: 0.6px;
          text-transform: uppercase; color: var(--nutri-placeholder); white-space: nowrap;
        }
        .reg-social-btns { display: flex; flex-direction: column; gap: 12px; padding-top: 16px; }
        .reg-social-btn {
          width: 100%; height: 56px; border-radius: 9999px;
          border: 1px solid var(--nutri-border); background: white;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          font-size: 16px; font-weight: 600; color: #334155; cursor: pointer;
          font-family: Inter, sans-serif;
        }
        .reg-social-btn:disabled { opacity: 0.6; }

        /* ── Trust ── */
        .reg-trust {
          display: flex; flex-direction: column; align-items: center; gap: 16px;
          padding: 32px 0;
        }
        .reg-trust-badge {
          width: 100%; border-radius: 48px; padding: 16px;
          display: flex; align-items: center; gap: 12px;
          background: var(--nutri-green-5); border: 1px solid var(--nutri-green-10);
          box-sizing: border-box;
        }
        .reg-trust-text {
          font-size: 13px; line-height: 18px; color: var(--nutri-body); margin: 0;
        }
        .reg-login-link {
          font-size: 14px; color: var(--nutri-body-light); margin: 0;
        }

        /* ═══════════════════════════════════════════════════════
           DESKTOP (≥1024px) — 2-column split layout
           ═══════════════════════════════════════════════════════ */
        @media (min-width: 1024px) {
          .reg-mobile-header { display: none; }
          .reg-desktop-header {
            display: flex; justify-content: center; align-items: center;
            padding: 49px 61px 0; max-width: 1280px; margin: 0 auto;
          }
          .reg-desktop-title { font-size: 28px; }

          .reg-body {
            flex-direction: row; gap: 0;
            max-width: 1280px; margin: 28px auto 0; padding: 0 61px;
          }
          .reg-left {
            flex: 0 0 54%; padding: 0;
          }
          .reg-hero-img {
            width: 550px; height: 360px; border-radius: 48px;
            margin: 16px 0 0 54px;
          }
          .reg-tagline {
            text-align: left; padding: 0; margin: 0 0 0 54px;
          }
          .reg-tagline-h {
            font-size: 28px; line-height: 35px; margin-top: 24px;
          }
          .reg-tagline-p { margin-top: 8px; }

          .reg-right {
            flex: 0 0 46%; padding: 24px 32px 0;
          }
          .reg-input { border-radius: 16px; padding: 0 25px; }
          .reg-input-pw { padding-right: 48px; }
          .reg-cta { border-radius: 16px; margin-top: 8px; }
          .reg-social-btn { border-radius: 16px; }
          .reg-trust-badge {
            border-radius: 12px; max-width: 340px; margin: 0 auto;
          }
        }

        /* ── Consent ── */
        .reg-consent {
          display: flex; align-items: flex-start; gap: 12px;
          cursor: pointer; padding: 4px 0;
        }
        .reg-consent-check {
          width: 20px; height: 20px; margin-top: 2px;
          accent-color: var(--nutri-green);
          flex-shrink: 0;
        }
        .reg-consent-text {
          font-size: 13px; line-height: 18px;
          color: var(--nutri-body);
        }
        .reg-consent-link { text-decoration: underline; font-weight: 600; }
      `}</style>
    </div>
  )
}
