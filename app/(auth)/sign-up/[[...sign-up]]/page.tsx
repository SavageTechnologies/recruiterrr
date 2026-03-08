'use client'

import { useState, useEffect, Suspense } from 'react'
import { SignUp, useAuth } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import '../../../(site)/site.css'

const mono  = "'DM Mono', monospace"
const bebas = "'Bebas Neue', sans-serif"
const sans  = "'DM Sans', sans-serif"

const BYPASS_DOMAINS = ['hfgagents.com', 'amhomelife.com', 'unlinsurance.com']
function isHeartland(email: string) {
  return BYPASS_DOMAINS.some(d => email.toLowerCase().trim().endsWith(`@${d}`))
}

const clerkAppearance = {
  variables: {
    colorPrimary:         '#e84d1c',
    colorBackground:      '#f7f5f2',
    colorInputBackground: '#ffffff',
    colorInputText:       '#111010',
    colorText:            '#111010',
    colorTextSecondary:   '#7a7571',
    colorNeutral:         '#e0dbd5',
    borderRadius:         '4px',
    fontFamily:           "'DM Mono', monospace",
  },
  elements: {
    card:                     { background: 'transparent', border: 'none', boxShadow: 'none', padding: '0' },
    rootBox:                  { width: '100%' },
    header:                   { display: 'none' },
    formButtonPrimary:        { background: '#e84d1c', fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '2px', padding: '14px 0', border: 'none', boxShadow: '0 2px 12px rgba(232,77,28,0.28)' },
    formFieldInput:           { background: '#ffffff', border: '1px solid #e0dbd5', color: '#111010', fontFamily: "'DM Mono', monospace", fontSize: '13px', padding: '12px 14px' },
    formFieldLabel:           { fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7a7571' },
    footerActionLink:         { color: '#e84d1c', fontFamily: "'DM Mono', monospace", fontSize: '11px' },
    footerActionText:         { fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#b8b3ae' },
    footer:                   { background: 'transparent' },
    dividerLine:              { background: '#e0dbd5' },
    dividerText:              { color: '#b8b3ae', fontFamily: "'DM Mono', monospace", fontSize: '10px' },
    socialButtonsBlockButton: { background: '#ffffff', border: '1px solid #e0dbd5', color: '#3d3a38', fontFamily: "'DM Mono', monospace", fontSize: '11px' },
    alertText:                { fontFamily: "'DM Mono', monospace", fontSize: '11px' },
  },
}

type Step = 'email' | 'payment' | 'clerk'

function SignUpInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [step, setStep]               = useState<Step>('email')
  const [email, setEmail]             = useState('')
  const [emailError, setEmailError]   = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

  // Already signed in — send to dashboard
  useEffect(() => {
    if (isSignedIn) router.replace('/dashboard')
  }, [isSignedIn, router])

  useEffect(() => {
    const checkout = searchParams.get('checkout')
    const prefill  = searchParams.get('email')
    if (prefill) setEmail(decodeURIComponent(prefill))

    if (checkout === 'success') {
      const stored = localStorage.getItem('pendingCheckoutEmail')
      if (stored) setEmail(stored)
      localStorage.removeItem('pendingCheckoutEmail')
      setStep('clerk')
    }
    if (checkout === 'cancelled') setStep('email')
  }, [searchParams])

  function handleEmailSubmit() {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) { setEmailError('Enter a valid email address.'); return }
    setEmailError('')
    setStep(isHeartland(trimmed) ? 'clerk' : 'payment')
  }

  async function handleCheckout() {
    setCheckingOut(true)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.url) {
        localStorage.setItem('pendingCheckoutEmail', email.trim().toLowerCase())
        window.location.href = data.url
      }
    } catch { setCheckingOut(false) }
  }

  // ── Right panel (same on all steps) ──────────────────────────────────────
  const rightPanel = (
    <div style={{ background: 'var(--site-orange)', padding: '48px 44px' }}>
      <h1 style={{ fontFamily: bebas, fontSize: 56, letterSpacing: 2, lineHeight: 0.92, color: 'white', marginBottom: 24 }}>
        RECRUIT ON<br />INTELLIGENCE,<br />
        <span style={{ color: 'rgba(255,255,255,0.42)' }}>NOT INSTINCT.</span>
      </h1>
      <p style={{ fontFamily: sans, fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, marginBottom: 36 }}>
        Real-time data on every independent producer in any market. Two tools. One platform. Built for recruiters who move fast.
      </p>
      {[
        { name: 'Agent Search', desc: 'Every independent producer in any US market — scored HOT, WARM, or COLD with YouTube, hiring, and carrier signals.' },
        { name: 'Prometheus',   desc: 'FMO & IMO competitive intelligence. Know their carriers, trips, and recruiting pitch before you compete.' },
      ].map(t => (
        <div key={t.name} style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, marginBottom: 10 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'white', letterSpacing: 2, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            {t.name}
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 2 }}>LIVE</span>
          </div>
          <div style={{ fontFamily: sans, fontSize: 12, color: 'rgba(255,255,255,0.58)', lineHeight: 1.65 }}>{t.desc}</div>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden', marginTop: 36 }}>
        {[['320K+','Producers'],['50','States'],['< 90s','Full Scan']].map(([n,l]) => (
          <div key={l} style={{ padding: '16px 12px', background: 'rgba(0,0,0,0.18)', textAlign: 'center' }}>
            <div style={{ fontFamily: bebas, fontSize: 24, color: 'white', lineHeight: 1 }}>{n}</div>
            <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="site-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <nav style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', borderBottom: '1px solid var(--site-border)',
        background: 'var(--site-white)', flexShrink: 0,
      }}>
        <a href="/" style={{ fontFamily: bebas, fontSize: 20, letterSpacing: 3, color: 'var(--site-ink)', textDecoration: 'none' }}>
          RECRUITERRR<span style={{ color: 'var(--site-orange)' }}>.</span>
        </a>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/" style={{
            fontFamily: mono, fontSize: 10, letterSpacing: 1.5, padding: '7px 16px',
            background: 'none', border: '1px solid var(--site-border)',
            borderRadius: 4, color: 'var(--site-ink-3)', textDecoration: 'none',
          }}>← BACK</a>
          <a href="/sign-in" style={{
            fontFamily: mono, fontSize: 10, letterSpacing: 1.5, padding: '7px 16px',
            background: 'none', border: '1px solid var(--site-border)',
            borderRadius: 4, color: 'var(--site-ink-3)', textDecoration: 'none',
          }}>SIGN IN</a>
        </div>
      </nav>

      {/* SPLIT BODY */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'stretch' }}>

        {/* LEFT */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 44px', background: 'var(--site-paper)',
          borderRight: '1px solid var(--site-border)',
        }}>
          <div style={{ width: '100%', maxWidth: 400 }}>

            {/* ── STEP 1: Email ── */}
            {step === 'email' && (
              <>
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontFamily: bebas, fontSize: 40, letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 6 }}>GET STARTED.</div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2 }}>ENTER YOUR WORK EMAIL TO CONTINUE</div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2, marginBottom: 8 }}>WORK EMAIL</div>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                    placeholder="you@company.com"
                    type="email"
                    style={{
                      width: '100%', padding: '14px',
                      background: 'var(--site-white)',
                      border: `1px solid ${emailError ? 'var(--site-orange)' : 'var(--site-border)'}`,
                      borderRadius: 4, color: 'var(--site-ink)',
                      fontFamily: mono, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                {emailError && <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-orange)', letterSpacing: 1, marginBottom: 12 }}>{emailError}</div>}
                <button onClick={handleEmailSubmit} style={{
                  width: '100%', padding: '16px', background: 'var(--site-orange)',
                  border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 16,
                  fontFamily: bebas, fontSize: 20, letterSpacing: 3, color: 'white',
                  boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
                }}>CONTINUE</button>
                <div style={{ marginTop: 20, textAlign: 'center', fontFamily: mono, fontSize: 10, color: 'var(--site-ink-4)', letterSpacing: 1 }}>
                  Already have an account?{' '}
                  <a href="/sign-in" style={{ color: 'var(--site-orange)', textDecoration: 'none' }}>Sign in →</a>
                </div>
              </>
            )}

            {/* ── STEP 2: Payment ── */}
            {step === 'payment' && (
              <div style={{ border: '1px solid var(--site-border)', borderRadius: 4, overflow: 'hidden', background: 'var(--site-white)' }}>
                <div style={{ height: 3, background: 'var(--site-orange)' }} />
                <div style={{ padding: '36px' }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-3)', letterSpacing: 2, marginBottom: 6 }}>ONE PLAN · FULL ACCESS</div>
                  <div style={{ fontFamily: bebas, fontSize: 32, letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 4 }}>OPERATOR</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 4 }}>
                    <span style={{ fontFamily: bebas, fontSize: 44, color: 'var(--site-orange)', lineHeight: 1 }}>{process.env.NEXT_PUBLIC_PRO_PRICE_WHOLE || '499'}</span>
                    <span style={{ fontFamily: bebas, fontSize: 22, color: 'var(--site-orange)', marginTop: 5 }}>.95</span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 1, marginBottom: 24 }}>PER MONTH · CANCEL ANYTIME</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                    {['Agent search — 15/hr', 'Up to 50 results/search', 'HOT / WARM / COLD scoring', 'Prometheus — 20 scans/hr', 'Persistent agent database'].map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: 'var(--site-orange)', fontSize: 10, flexShrink: 0 }}>◆</span>
                        <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--site-ink-2)', letterSpacing: 0.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 1, marginBottom: 16, padding: '10px 14px', background: 'var(--site-paper)', border: '1px solid var(--site-border)', borderRadius: 4 }}>
                    Subscribing as: <span style={{ color: 'var(--site-ink-2)' }}>{email}</span>
                  </div>
                  <button onClick={handleCheckout} disabled={checkingOut} style={{
                    width: '100%', padding: '16px', background: 'var(--site-orange)',
                    border: 'none', borderRadius: 4, cursor: checkingOut ? 'default' : 'pointer',
                    fontFamily: bebas, fontSize: 18, letterSpacing: 3, color: 'white',
                    opacity: checkingOut ? 0.7 : 1, boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
                  }}>
                    {checkingOut ? 'REDIRECTING...' : `ACTIVATE OPERATOR — ${process.env.NEXT_PUBLIC_PRO_PRICE_DISPLAY || '499.95'}/MO`}
                  </button>
                  <button onClick={() => setStep('email')} style={{
                    width: '100%', padding: '10px', background: 'transparent', border: 'none',
                    cursor: 'pointer', marginTop: 8, fontFamily: mono, fontSize: 10,
                    letterSpacing: 2, color: 'var(--site-ink-3)',
                  }}>← USE DIFFERENT EMAIL</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Clerk signup (post-payment) ── */}
            {step === 'clerk' && (
              <>
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontFamily: bebas, fontSize: 40, letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 6 }}>CREATE ACCOUNT.</div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2 }}>FINISH SETTING UP YOUR ACCOUNT</div>
                </div>
                <SignUp
                  forceRedirectUrl="/dashboard/activate"
                  initialValues={{ emailAddress: email }}
                  appearance={clerkAppearance}
                />
              </>
            )}

          </div>
        </div>

        {rightPanel}
      </div>

      {/* FOOTER */}
      <footer style={{ background: 'var(--site-white)', borderTop: '1px solid var(--site-border)', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-4)', letterSpacing: 1 }}>© 2026 InsuraSafe, LLC. All rights reserved.</div>
        <div style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-5)', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          ALL SYSTEMS NOMINAL
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 4, height: 4, background: 'var(--site-orange)', borderRadius: '50%' }} />
            <div style={{ width: 4, height: 4, background: 'rgba(26,200,100,0.6)', borderRadius: '50%' }} />
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f7f5f2' }} />}>
      <SignUpInner />
    </Suspense>
  )
}
