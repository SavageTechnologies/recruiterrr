'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SignUp } from '@clerk/nextjs'
import PageNav from '@/components/layout/PageNav'
import PageFooter from '@/components/layout/PageFooter'
import '../../../(site)/site.css'

const BYPASS_DOMAINS = ['hfgagents.com', 'amhomelife.com', 'unlinsurance.com']

type Step = 'email' | 'payment' | 'signup' | 'success'

function isHeartland(email: string) {
  return BYPASS_DOMAINS.some(domain => email.toLowerCase().trim().endsWith(`@${domain}`))
}

const mono = "'DM Mono', monospace"
const bebas = "'Bebas Neue', sans-serif"

const clerkAppearance = {
  variables: {
    colorPrimary: '#e84d1c',
    colorBackground: '#ffffff',
    colorInputBackground: '#f7f5f2',
    colorInputText: '#111010',
    colorText: '#111010',
    colorTextSecondary: '#7a7571',
    colorNeutral: '#e0dbd5',
    borderRadius: '4px',
    fontFamily: mono,
  },
  elements: {
    card: {
      background: '#ffffff',
      border: '1px solid #e0dbd5',
      borderRadius: '4px',
      boxShadow: '0 4px 16px rgba(17,16,16,0.08)',
      padding: '40px',
    },
    headerTitle: { fontFamily: bebas, fontSize: '32px', letterSpacing: '2px', color: '#111010' },
    headerSubtitle: { fontFamily: mono, fontSize: '10px', letterSpacing: '1.5px', color: '#7a7571', textTransform: 'uppercase' },
    formButtonPrimary: {
      background: '#e84d1c', borderRadius: '4px', fontFamily: bebas,
      fontSize: '18px', letterSpacing: '2px', color: '#ffffff',
      padding: '14px 0', border: 'none', boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
    },
    formFieldInput: {
      background: '#f7f5f2', border: '1px solid #e0dbd5', borderRadius: '4px',
      color: '#111010', fontFamily: mono, fontSize: '13px', padding: '12px 14px',
    },
    formFieldLabel: { fontFamily: mono, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7a7571' },
    footerActionLink: { color: '#e84d1c', fontFamily: mono, fontSize: '11px' },
    dividerLine: { background: '#e0dbd5' },
    dividerText: { color: '#b8b3ae', fontFamily: mono, fontSize: '10px' },
    socialButtonsBlockButton: {
      background: '#f7f5f2', border: '1px solid #e0dbd5', borderRadius: '4px',
      color: '#3d3a38', fontFamily: mono, fontSize: '11px', letterSpacing: '1px',
    },
    alertText: { fontFamily: mono, fontSize: '11px' },
  },
}

const FEATURES = [
  'Agent search across every US market',
  'HOT / WARM / COLD AI scoring',
  'ANATHEMA — distribution tree analysis',
  'PROMETHEUS — FMO competitive intelligence',
  'YouTube & hiring enrichment',
  'Website & carrier intel',
  'Persistent agent database',
]

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

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
    <div className="site-shell">
      <PageNav />

      <main style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          gap: 80,
        }}>

          {/* Left branding — hidden on mobile */}
          <div className="auth-left" style={{ maxWidth: 380, display: 'none' }}>
            <div style={{
              fontFamily: mono, fontSize: 10, color: 'var(--site-orange)',
              letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 24, height: 1, background: 'var(--site-orange)', display: 'inline-block', flexShrink: 0 }} />
              Operator Access
            </div>

            <h1 style={{
              fontFamily: bebas, fontSize: 68, letterSpacing: 2,
              lineHeight: 0.9, color: 'var(--site-ink)', marginBottom: 24,
            }}>
              JOIN THE<br />
              <span style={{ color: 'var(--site-orange)' }}>PLATFORM.</span>
            </h1>

            <p style={{ fontSize: 14, color: 'var(--site-ink-3)', lineHeight: 1.75, marginBottom: 36 }}>
              Intelligence tools for serious recruiters. Find, score, and classify agents across every market in the US.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FEATURES.map(f => (
                <div key={f} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: mono, fontSize: 11, color: 'var(--site-ink-3)', letterSpacing: 0.5,
                }}>
                  <span style={{ width: 5, height: 5, background: 'var(--site-orange)', borderRadius: '50%', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--site-border)' }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-4)', letterSpacing: 1, marginBottom: 10 }}>
                ALREADY HAVE AN ACCOUNT?
              </div>
              <a href="/sign-in" style={{ fontFamily: mono, fontSize: 11, color: 'var(--site-orange)', textDecoration: 'none', letterSpacing: 1 }}>
                Sign in →
              </a>
            </div>
          </div>

          {/* Right — step content */}
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* ── Step 1: Email ── */}
            {step === 'email' && (
              <div style={{
                background: 'var(--site-white)',
                border: '1px solid var(--site-border)',
                borderRadius: '4px',
                boxShadow: '0 4px 16px rgba(17,16,16,0.08)',
                padding: '48px 40px',
              }}>
                <div style={{ fontFamily: bebas, fontSize: 36, letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 6 }}>
                  GET STARTED
                </div>
                <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2, marginBottom: 36 }}>
                  ENTER YOUR WORK EMAIL TO CONTINUE
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2, marginBottom: 8 }}>
                    WORK EMAIL
                  </div>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                    placeholder="you@company.com"
                    type="email"
                    style={{
                      width: '100%', padding: '14px',
                      background: 'var(--site-paper)',
                      border: `1px solid ${emailError ? 'var(--site-orange)' : 'var(--site-border)'}`,
                      borderRadius: '4px',
                      color: 'var(--site-ink)', fontFamily: mono,
                      fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {emailError && (
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-orange)', letterSpacing: 1, marginBottom: 12 }}>
                    {emailError}
                  </div>
                )}

                <button
                  onClick={handleEmailSubmit}
                  style={{
                    width: '100%', padding: '16px',
                    background: 'var(--site-orange)',
                    border: 'none', borderRadius: '4px',
                    cursor: 'pointer', marginTop: 16,
                    fontFamily: bebas, fontSize: 20,
                    letterSpacing: 3, color: 'white',
                    boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
                  }}
                >
                  CONTINUE
                </button>

                <div style={{ marginTop: 24, textAlign: 'center', fontFamily: mono, fontSize: 10, color: 'var(--site-ink-4)', letterSpacing: 1 }}>
                  Already have an account?{' '}
                  <a href="/sign-in" style={{ color: 'var(--site-orange)', textDecoration: 'none' }}>Sign in</a>
                </div>
              </div>
            )}

            {/* ── Step 2: Payment ── */}
            {step === 'payment' && (
              <div style={{
                background: 'var(--site-white)',
                border: '1px solid var(--site-border)',
                borderRadius: '4px',
                boxShadow: '0 4px 16px rgba(17,16,16,0.08)',
                overflow: 'hidden',
              }}>
                {/* Orange top accent */}
                <div style={{ height: 3, background: 'var(--site-orange)' }} />

                <div style={{ padding: '40px' }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-3)', letterSpacing: 2, marginBottom: 6 }}>
                    ONE PLAN · FULL ACCESS
                  </div>
                  <div style={{ fontFamily: bebas, fontSize: 36, letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 4 }}>
                    OPERATOR
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 4 }}>
                    <span style={{ fontFamily: bebas, fontSize: 52, color: 'var(--site-orange)', lineHeight: 1 }}>
                      {process.env.NEXT_PUBLIC_PRO_PRICE_WHOLE || '499'}
                    </span>
                    <span style={{ fontFamily: bebas, fontSize: 26, color: 'var(--site-orange)', marginTop: 6 }}>.95</span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 1, marginBottom: 28 }}>
                    PER MONTH · CANCEL ANYTIME
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 28 }}>
                    {[...FEATURES, 'Full search history'].map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: 'var(--site-orange)', fontSize: 10, flexShrink: 0 }}>✦</span>
                        <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--site-ink-2)', letterSpacing: 0.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)',
                    letterSpacing: 1, marginBottom: 20,
                    padding: '10px 14px',
                    background: 'var(--site-paper)',
                    border: '1px solid var(--site-border)',
                    borderRadius: '4px',
                  }}>
                    Subscribing as: <span style={{ color: 'var(--site-ink-2)' }}>{email}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    style={{
                      width: '100%', padding: '18px',
                      background: 'var(--site-orange)',
                      border: 'none', borderRadius: '4px',
                      cursor: checkingOut ? 'default' : 'pointer',
                      fontFamily: bebas, fontSize: 20,
                      letterSpacing: 3, color: 'white',
                      opacity: checkingOut ? 0.7 : 1,
                      boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
                    }}
                  >
                    {checkingOut ? 'REDIRECTING...' : `START OPERATOR — ${process.env.NEXT_PUBLIC_PRO_PRICE_DISPLAY || '499.95'}/MO`}
                  </button>

                  <button
                    onClick={() => setStep('email')}
                    style={{
                      width: '100%', padding: '12px', background: 'transparent',
                      border: 'none', cursor: 'pointer', marginTop: 10,
                      fontFamily: mono, fontSize: 10,
                      letterSpacing: 2, color: 'var(--site-ink-3)',
                    }}
                  >
                    ← USE DIFFERENT EMAIL
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Clerk signup ── */}
            {step === 'signup' && (
              <SignUp
                initialValues={{ emailAddress: email }}
                forceRedirectUrl="/dashboard/activate"
                appearance={clerkAppearance}
              />
            )}

          </div>
        </div>
      </main>

      <PageFooter />

      <style>{`
        @media (min-width: 860px) {
          .auth-left { display: block !important; }
        }
      `}</style>
    </div>
  )
}
