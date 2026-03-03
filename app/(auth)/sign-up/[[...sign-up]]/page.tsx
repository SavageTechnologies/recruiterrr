'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SignUp } from '@clerk/nextjs'
import PageNav from '@/components/layout/PageNav'
import PageFooter from '@/components/layout/PageFooter'

const BYPASS_DOMAINS = ['hfgagents.com', 'amhomelife.com', 'unlinsurance.com']

type Step = 'email' | 'payment' | 'signup' | 'success'

function isHeartland(email: string) {
  return BYPASS_DOMAINS.some(domain => email.toLowerCase().trim().endsWith(`@${domain}`))
}

const clerkAppearance = {
  variables: {
    colorPrimary: '#ff5500',
    colorBackground: '#111110',
    colorInputBackground: '#1a1814',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#666',
    colorNeutral: '#333',
    borderRadius: '0px',
    fontFamily: "'DM Mono', monospace",
  },
  elements: {
    card: { background: '#111110', border: '1px solid #222', borderRadius: 0, boxShadow: 'none', padding: '40px' },
    headerTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', letterSpacing: '2px', color: '#ffffff' },
    headerSubtitle: { fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '1px', color: '#444', textTransform: 'uppercase' },
    formButtonPrimary: { background: '#ff5500', borderRadius: 0, fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '2px', color: '#000', padding: '14px 0', border: 'none' },
    formFieldInput: { background: '#1a1814', border: '1px solid #222', borderRadius: 0, color: '#ffffff', fontFamily: "'DM Mono', monospace", fontSize: '13px', padding: '12px 14px' },
    formFieldLabel: { fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#555' },
    footerActionLink: { color: '#ff5500', fontFamily: "'DM Mono', monospace", fontSize: '11px' },
    dividerLine: { background: '#222' },
    dividerText: { color: '#333', fontFamily: "'DM Mono', monospace", fontSize: '10px' },
    socialButtonsBlockButton: { background: '#1a1814', border: '1px solid #222', borderRadius: 0, color: '#666', fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '1px' },
    alertText: { fontFamily: "'DM Mono', monospace", fontSize: '11px' },
  },
}

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

  // Handle return from Stripe checkout
  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (checkout === 'success') {
      const stored = localStorage.getItem('pendingCheckoutEmail')
      if (stored) {
        setEmail(stored)
        localStorage.removeItem('pendingCheckoutEmail')
      }
      setStep('signup')
    }
    if (checkout === 'cancelled') setStep('email')
  }, [searchParams])

  function handleEmailSubmit() {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError('')
    setStep(isHeartland(trimmed) ? 'signup' : 'payment')
  }

  async function handleCheckout() {
    setCheckingOut(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.url) {
        localStorage.setItem('pendingCheckoutEmail', email.trim().toLowerCase())
        window.location.href = data.url
      }
    } catch {
      setCheckingOut(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
      <PageNav />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 80 }}>

        {/* Left branding — hidden on mobile */}
        <div style={{ maxWidth: 400, display: 'none' }} className="auth-left">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
            Operator Access
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, color: 'var(--white)', marginBottom: 24 }}>
            JOIN THE<br /><span style={{ color: 'var(--orange)' }}>PLATFORM.</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 40 }}>
            Intelligence tools for serious recruiters. Find, score, and classify agents across every market in the US.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Agent search across every US market',
              'HOT / WARM / COLD AI scoring',
              'ANATHEMA — distribution tree analysis',
              'PROMETHEUS — FMO competitive intelligence',
              'YouTube & hiring enrichment',
              'Website & carrier intel',
              'Persistent agent database',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#444', letterSpacing: 0.5 }}>
                <span style={{ width: 6, height: 6, background: 'var(--orange)', borderRadius: '50%', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right — step content */}
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <div style={{ background: '#111110', border: '1px solid #222', padding: '48px 40px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, color: 'var(--white)', marginBottom: 6 }}>
                GET STARTED
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 36 }}>
                ENTER YOUR WORK EMAIL TO CONTINUE
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 8 }}>
                  WORK EMAIL
                </div>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                  placeholder="you@company.com"
                  type="email"
                  style={{
                    width: '100%', padding: '14px', background: '#1a1814',
                    border: `1px solid ${emailError ? 'var(--red)' : '#222'}`,
                    color: 'var(--white)', fontFamily: "'DM Mono', monospace",
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {emailError && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--red)', letterSpacing: 1, marginBottom: 12 }}>
                  {emailError}
                </div>
              )}

              <button
                onClick={handleEmailSubmit}
                style={{
                  width: '100%', padding: '16px', background: 'var(--orange)',
                  border: 'none', cursor: 'crosshair', marginTop: 16,
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
                  letterSpacing: 3, color: 'var(--black)',
                }}
              >
                CONTINUE
              </button>

              <div style={{ marginTop: 24, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1 }}>
                Already have an account?{' '}
                <a href="/sign-in" style={{ color: 'var(--orange)', textDecoration: 'none' }}>Sign in</a>
              </div>
            </div>
          )}

          {/* ── Step 2: Payment required ── */}
          {step === 'payment' && (
            <div style={{ background: '#111110', border: '1px solid #222', padding: '48px 40px' }}>
              {/* Top accent */}
              <div style={{ height: 2, background: 'var(--orange)', margin: '-48px -40px 36px' }} />

              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 6 }}>
                ONE PLAN · FULL ACCESS
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, color: 'var(--white)', marginBottom: 4 }}>
                OPERATOR
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: 'var(--orange)', lineHeight: 1 }}>$799</span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--orange)', marginTop: 6 }}>.95</span>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 1, marginBottom: 28 }}>
                PER MONTH · CANCEL ANYTIME
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {[
                  'Agent search — every US market',
                  'HOT / WARM / COLD AI scoring',
                  'ANATHEMA — distribution tree analysis',
                  'PROMETHEUS — FMO competitive intelligence',
                  'YouTube & hiring enrichment',
                  'Website & carrier intel',
                  'Persistent agent database',
                  'Full search history',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--orange)', fontSize: 10, flexShrink: 0 }}>✦</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 0.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1, marginBottom: 16, padding: '10px 14px', background: '#0e0e0e', border: '1px solid #1a1a1a' }}>
                Subscribing as: <span style={{ color: '#666' }}>{email}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                style={{
                  width: '100%', padding: '18px', background: 'var(--orange)',
                  border: 'none', cursor: checkingOut ? 'default' : 'crosshair',
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
                  letterSpacing: 3, color: 'var(--black)',
                  opacity: checkingOut ? 0.7 : 1,
                }}
              >
                {checkingOut ? 'REDIRECTING...' : 'START OPERATOR — $799.95/MO'}
              </button>

              <button
                onClick={() => setStep('email')}
                style={{
                  width: '100%', padding: '12px', background: 'transparent',
                  border: 'none', cursor: 'crosshair', marginTop: 10,
                  fontFamily: "'DM Mono', monospace", fontSize: 10,
                  letterSpacing: 2, color: '#444',
                }}
              >
                ← USE DIFFERENT EMAIL
              </button>
            </div>
          )}

          {/* ── Step 3: Clerk signup (after payment or Heartland) ── */}
          {step === 'signup' && (
            <SignUp
              initialValues={{ emailAddress: email }}
              forceRedirectUrl="/dashboard/activate"
              appearance={clerkAppearance}
            />
          )}

        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auth-left { display: block !important; }
        }
      `}</style>

      <PageFooter />
    </div>
  )
}
