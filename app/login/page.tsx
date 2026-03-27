// app/login/page.tsx
"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { account } from "@/lib/appwrite"
import { setAuthCookie } from "@/lib/auth-cookie"
import { Eye, EyeOff, ChevronLeft, Shield } from "lucide-react"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--nutri-bg)" }} />}>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search?.get("next") || search?.get("redirect") || null

  const { refresh, isAdmin } = useUser()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      await account.createEmailPasswordSession(email.trim(), password)
      setAuthCookie() // B2C-032: Signal auth state to Next.js middleware
      await refresh()
      const dest = next ?? (isAdmin() ? "/admin" : "/")
      router.replace(dest)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please check your credentials and try again."
      toast({ title: "Sign-in failed", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ── Mobile header ── */}
      <div className="login-mobile-header">
        <Link href="/welcome" className="login-back-link">
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
        </Link>
        <span className="login-page-title">Sign In</span>
        <div style={{ width: 48 }} />
      </div>

      {/* ── Desktop header ── */}
      <div className="login-desktop-header">
        <h1 className="login-desktop-title">Welcome Back</h1>
      </div>

      {/* ── Desktop 2-col | Mobile single col ── */}
      <div className="login-body">
        {/* LEFT: image + tagline */}
        <div className="login-left">
          <div className="login-hero-img">
            <img src="/images/signup-hero.png" alt="Fresh vegetables" />
          </div>
          <div className="login-tagline">
            <h2 className="login-tagline-h">
              Welcome back to<br />your health journey.
            </h2>
            <p className="login-tagline-p">
              Sign in to continue your nutrition journey.
            </p>
          </div>
        </div>

        {/* RIGHT: form + social + trust */}
        <div className="login-right">
          {/* Mobile-only heading */}
          <div className="login-mobile-heading">
            <h1 className="login-mobile-h1">Welcome back</h1>
            <p className="login-mobile-sub">Sign in to continue your nutrition journey.</p>
          </div>

          {/* ── Form (inlined) ── */}
          <form onSubmit={handleLogin} className="login-form">
            <div>
              <label className="login-label">Email Address</label>
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="Enter your email"
                className="login-input"
              />
            </div>
            <div>
              <div className="login-label-row">
                <label className="login-label" style={{ padding: 0 }}>Password</label>
                <Link href="/forgot-password" className="login-forgot" style={{ color: "var(--nutri-link)" }}>
                  Forgot password?
                </Link>
              </div>
              <div className="login-pw-wrap">
                <input
                  id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="Enter your password"
                  className="login-input login-input-pw"
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="login-pw-toggle" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff className="w-5 h-5" style={{ color: "var(--nutri-placeholder)" }} /> : <Eye className="w-5 h-5" style={{ color: "var(--nutri-placeholder)" }} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="login-cta">
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* ── Social auth (inlined) ── */}
          <div className="login-social">
            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">or sign in with</span>
              <div className="login-divider-line" />
            </div>
            <div className="login-social-btns">
              <button disabled title="Coming soon" className="login-social-btn">Sign in with Google</button>
              <button disabled title="Coming soon" className="login-social-btn">
                <span style={{ fontSize: 14 }}>🍎</span> Sign in with Apple
              </button>
            </div>
          </div>

          {/* ── Trust footer (inlined) ── */}
          <div className="login-trust">
            <div className="login-trust-badge">
              <Shield className="w-4 h-4 shrink-0" style={{ color: "var(--nutri-green-dark)" }} />
              <p className="login-trust-text">Your privacy is our priority. Your data is encrypted and secure.</p>
            </div>
            <p className="login-link-text">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-extrabold no-underline" style={{ color: "var(--nutri-link)" }}>Create account</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh; background: var(--nutri-bg, #F5F5F0);
        }

        /* Mobile header */
        .login-mobile-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 16px 8px;
        }
        .login-back-link { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; }
        .login-page-title { font-size: 18px; font-weight: 700; letter-spacing: -0.45px; color: var(--nutri-heading); }

        /* Desktop header (hidden on mobile) */
        .login-desktop-header { display: none; }
        .login-desktop-title { font-size: 28px; font-weight: 800; letter-spacing: -0.7px; color: var(--nutri-heading); text-align: center; margin: 0; }

        .login-body { display: flex; flex-direction: column; }

        /* Left panel (hidden on mobile) */
        .login-left { display: none; }
        .login-hero-img { width: 100%; height: 360px; border-radius: 48px; overflow: hidden; background: var(--nutri-green-10); }
        .login-hero-img img { width: 100%; height: 100%; object-fit: cover; }
        .login-tagline { padding: 24px 0 0 0; }
        .login-tagline-h { font-size: 28px; font-weight: 700; line-height: 35px; letter-spacing: -0.7px; color: var(--nutri-heading); margin: 0; }
        .login-tagline-p { margin-top: 8px; font-size: 14px; line-height: 20px; color: var(--nutri-body); }

        /* Mobile heading */
        .login-mobile-heading { text-align: center; padding: 32px 0 8px; }
        .login-mobile-h1 { font-size: 28px; font-weight: 700; line-height: 35px; letter-spacing: -0.7px; color: var(--nutri-heading); margin: 0; }
        .login-mobile-sub { margin-top: 8px; font-size: 14px; line-height: 20px; color: var(--nutri-body); }

        /* Right panel */
        .login-right { padding: 0 24px; }

        /* Form */
        .login-form { display: flex; flex-direction: column; gap: 16px; padding-top: 24px; }
        .login-label { display: block; padding: 0 4px 8px; font-size: 14px; font-weight: 600; color: var(--nutri-heading); }
        .login-label-row { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 8px; }
        .login-forgot { font-size: 12px; font-weight: 500; text-decoration: none; }
        .login-input {
          width: 100%; height: 56px; padding: 0 24px; border-radius: 9999px;
          border: 1px solid var(--nutri-border); background: white;
          font-size: 16px; color: var(--nutri-heading); outline: none;
          font-family: Inter, sans-serif; transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .login-input:focus { border-color: var(--nutri-green); }
        .login-input-pw { padding-right: 48px; }
        .login-pw-wrap { position: relative; }
        .login-pw-toggle { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); padding: 4px; background: none; border: none; cursor: pointer; }
        .login-cta {
          width: 100%; height: 56px; border-radius: 9999px; border: none;
          background: var(--nutri-green); font-size: 16px; font-weight: 700;
          color: #0F172A; cursor: pointer; font-family: Inter, sans-serif;
          box-shadow: 0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2);
          transition: opacity 0.15s;
        }
        .login-cta:hover { opacity: 0.9; }
        .login-cta:disabled { opacity: 0.5; }

        /* Social */
        .login-social { padding: 24px 0 0; }
        .login-divider { display: flex; align-items: center; gap: 16px; padding: 8px 0; }
        .login-divider-line { flex: 1; height: 1px; background: var(--nutri-border); }
        .login-divider-text { font-size: 12px; font-weight: 500; letter-spacing: 0.6px; text-transform: uppercase; color: var(--nutri-placeholder); white-space: nowrap; }
        .login-social-btns { display: flex; flex-direction: column; gap: 12px; padding-top: 16px; }
        .login-social-btn {
          width: 100%; height: 56px; border-radius: 9999px;
          border: 1px solid var(--nutri-border); background: white;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          font-size: 16px; font-weight: 600; color: #334155; cursor: pointer;
          font-family: Inter, sans-serif;
        }
        .login-social-btn:disabled { opacity: 0.6; }

        /* Trust */
        .login-trust { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px 0; }
        .login-trust-badge {
          width: 100%; border-radius: 48px; padding: 16px;
          display: flex; align-items: center; gap: 12px;
          background: var(--nutri-green-5); border: 1px solid var(--nutri-green-10);
          box-sizing: border-box;
        }
        .login-trust-text { font-size: 13px; line-height: 18px; color: var(--nutri-body); margin: 0; }
        .login-link-text { font-size: 14px; color: var(--nutri-body-light); margin: 0; }

        /* ═══ DESKTOP ═══ */
        @media (min-width: 1024px) {
          .login-mobile-header { display: none; }
          .login-mobile-heading { display: none; }
          .login-desktop-header {
            display: flex; justify-content: center; align-items: center;
            padding: 49px 61px 0; max-width: 1280px; margin: 0 auto;
          }
          .login-body {
            flex-direction: row; gap: 0;
            max-width: 1280px; margin: 28px auto 0; padding: 0 61px;
          }
          .login-left { display: block; flex: 0 0 54%; padding: 0 0 0 54px; }
          .login-hero-img { width: 550px; height: 360px; }
          .login-right { flex: 0 0 46%; padding: 24px 32px 0; }
          .login-form { padding-top: 0; }
          .login-input { border-radius: 16px; padding: 0 25px; }
          .login-input-pw { padding-right: 48px; }
          .login-cta { border-radius: 16px; margin-top: 8px; }
          .login-social-btn { border-radius: 16px; }
          .login-trust-badge { border-radius: 12px; max-width: 340px; margin: 0 auto; }
        }
      `}</style>
    </div>
  )
}
