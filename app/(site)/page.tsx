'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PrivacyPanel from '../../components/site/PrivacyPanel'
import TermsPanel from '../../components/site/TermsPanel'

// ── Types ─────────────────────────────────────────────────────────────────────
type RightPage = 'privacy' | 'terms'
type AuthMode = 'signin' | 'signup-email' | 'signup-payment' | 'signup-clerk'

const BYPASS_DOMAINS = ['hfgagents.com', 'amhomelife.com', 'unlinsurance.com']
function isHeartland(email: string) {
  return BYPASS_DOMAINS.some(d => email.toLowerCase().trim().endsWith(`@${d}`))
}

// ── Default home panel ────────────────────────────────────────────────────────
function DefaultPanel() {
  const mono = "'DM Mono', monospace"
  const sans = "'DM Sans', sans-serif"
  const bebas = "'Bebas Neue', sans-serif"
  const card: React.CSSProperties = {
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
  }
  return (
    <div>

      <h1 style={{ fontFamily: bebas, fontSize: 56, letterSpacing: 2, lineHeight: 0.92, color: 'white', marginBottom: 24 }}>
        RECRUIT ON<br />INTELLIGENCE,<br />
        <span style={{ color: 'rgba(255,255,255,0.42)' }}>NOT INSTINCT.</span>
      </h1>

      <p style={{ fontFamily: sans, fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, marginBottom: 36, maxWidth: 400 }}>
        Real-time data on every independent producer in any market. Two tools. One platform. Built for recruiters who move fast.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
        {[
          { name: 'Agent Search', desc: 'Every independent producer in any US market — scored HOT, WARM, or COLD with YouTube, hiring, and carrier signals.' },
          { name: 'Prometheus', desc: 'FMO & IMO competitive intelligence. Know their carriers, trips, and recruiting pitch before you compete.' },
        ].map(tool => (
          <div key={tool.name} style={card}>
            <div style={{ fontFamily: mono, fontSize: 10, color: 'white', letterSpacing: 2, fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              {tool.name}
              <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 2 }}>LIVE</span>
            </div>
            <div style={{ fontFamily: sans, fontSize: 12, color: 'rgba(255,255,255,0.58)', lineHeight: 1.65 }}>{tool.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' }}>
        {[['320K+', 'Producers'], ['50', 'States'], ['< 90s', 'Full Scan']].map(([num, label]) => (
          <div key={label} style={{ padding: '16px 12px', background: 'rgba(0,0,0,0.18)', textAlign: 'center' }}>
            <div style={{ fontFamily: bebas, fontSize: 24, letterSpacing: 1, color: 'white', lineHeight: 1 }}>{num}</div>
            <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main inner component ──────────────────────────────────────────────────────
function HomePage() {
  const searchParams = useSearchParams()
  const [authMode, setAuthMode] = useState<AuthMode>('signup-email')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)
  const [rightPage, setRightPage] = useState<RightPage | null>(null)

  const mono = "'DM Mono', monospace"
  const bebas = "'Bebas Neue', sans-serif"

  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (checkout === 'success') {
      const stored = localStorage.getItem('pendingCheckoutEmail')
      if (stored) { setEmail(stored); localStorage.removeItem('pendingCheckoutEmail') }
      setAuthMode('signup-clerk')
    }
    if (checkout === 'cancelled') setAuthMode('signup-email')
    if (searchParams.get('mode') === 'signup') setAuthMode('signup-email')
  }, [searchParams])

  function handleEmailSubmit() {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) { setEmailError('Enter a valid email address.'); return }
    setEmailError('')
    setAuthMode(isHeartland(trimmed) ? 'signup-clerk' : 'signup-payment')
  }

  async function handleCheckout() {
    setCheckingOut(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.url) { localStorage.setItem('pendingCheckoutEmail', email.trim().toLowerCase()); window.location.href = data.url }
    } catch { setCheckingOut(false) }
  }

  function renderRight() {
    if (rightPage === 'privacy') return <PrivacyPanel />
    if (rightPage === 'terms') return <TermsPanel />
    return <DefaultPanel />
  }

  const footerLinks: { label: string; page: RightPage }[] = [
    { label: 'Privacy', page: 'privacy' },
    { label: 'Terms', page: 'terms' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── NAV ── */}
      <nav style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', borderBottom: '1px solid var(--site-border)',
        background: 'var(--site-white)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button
          onClick={() => setRightPage(null)}
          style={{ fontFamily: bebas, fontSize: 20, letterSpacing: 3, color: 'var(--site-ink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          RECRUITERRR<span style={{ color: 'var(--site-orange)' }}>.</span>
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setAuthMode('signin')}
            style={{
              fontFamily: mono, fontSize: 10, letterSpacing: 1.5, padding: '7px 16px',
              background: 'none',
              border: `1px solid ${authMode === 'signin' ? 'var(--site-ink-3)' : 'var(--site-border)'}`,
              borderRadius: 4, cursor: 'pointer',
              color: authMode === 'signin' ? 'var(--site-ink)' : 'var(--site-ink-3)',
            }}
          >SIGN IN</button>
          <button
            onClick={() => setAuthMode('signup-email')}
            style={{
              fontFamily: mono, fontSize: 10, letterSpacing: 1.5, padding: '7px 16px',
              background: authMode !== 'signin' ? 'var(--site-orange)' : 'none',
              border: `1px solid ${authMode !== 'signin' ? 'var(--site-orange)' : 'var(--site-border)'}`,
              borderRadius: 4, cursor: 'pointer',
              color: authMode !== 'signin' ? 'white' : 'var(--site-ink-3)',
            }}
          >REQUEST ACCESS</button>
        </div>
      </nav>

      {/* ── SPLIT BODY ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'stretch' }}>

        {/* LEFT — auth form, off-white */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 44px', background: 'var(--site-paper)',
          borderRight: '1px solid var(--site-border)',
          minHeight: 'calc(100vh - 56px - 44px)',
        }}>
          <div style={{ width: '100%', maxWidth: 400 }}>

            {authMode === 'signin' && (
              <>
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontFamily: bebas, fontSize: 40, letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 6 }}>WELCOME BACK.</div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2 }}>OPERATOR ACCESS</div>
                </div>
                <a href="/sign-in" style={{
                  display: 'block', width: '100%', padding: '16px',
                  background: 'var(--site-orange)', borderRadius: 4, textDecoration: 'none',
                  fontFamily: bebas, fontSize: 20, letterSpacing: 3, color: 'white',
                  textAlign: 'center', boxSizing: 'border-box',
                  boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
                }}>SIGN IN →</a>
                <div style={{ marginTop: 24, textAlign: 'center', fontFamily: mono, fontSize: 10, color: 'var(--site-ink-4)', letterSpacing: 1 }}>
                  Don&apos;t have an account?{' '}
                  <button onClick={() => setAuthMode('signup-email')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--site-orange)', fontFamily: mono, fontSize: 10, letterSpacing: 1, padding: 0 }}>
                    Request access →
                  </button>
                </div>
              </>
            )}

            {authMode === 'signup-email' && (
              <div>
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
                  <button onClick={() => setAuthMode('signin')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--site-orange)', fontFamily: mono, fontSize: 10, letterSpacing: 1, padding: 0 }}>
                    Sign in →
                  </button>
                </div>
              </div>
            )}

            {authMode === 'signup-payment' && (
              <div style={{ border: '1px solid var(--site-border)', borderRadius: 4, overflow: 'hidden', background: 'var(--site-white)' }}>
                <div style={{ height: 3, background: 'var(--site-orange)' }} />
                <div style={{ padding: '36px' }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-3)', letterSpacing: 2, marginBottom: 6 }}>ONE PLAN · FULL ACCESS</div>
                  <div style={{ fontFamily: bebas, fontSize: 32, letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 4 }}>OPERATOR</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 4 }}>
                    <span style={{ fontFamily: bebas, fontSize: 44, color: 'var(--site-orange)', lineHeight: 1 }}>499</span>
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
                    {checkingOut ? 'REDIRECTING...' : 'START OPERATOR — 499.95/MO'}
                  </button>
                  <button onClick={() => setAuthMode('signup-email')} style={{
                    width: '100%', padding: '10px', background: 'transparent', border: 'none',
                    cursor: 'pointer', marginTop: 8, fontFamily: mono, fontSize: 10,
                    letterSpacing: 2, color: 'var(--site-ink-3)',
                  }}>← USE DIFFERENT EMAIL</button>
                </div>
              </div>
            )}

            {authMode === 'signup-clerk' && (
              <>
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontFamily: bebas, fontSize: 40, letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 6 }}>CREATE ACCOUNT.</div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2 }}>FINISH SETTING UP YOUR ACCOUNT</div>
                </div>
                <a href={`/sign-up${email ? `?email=${encodeURIComponent(email)}` : ''}`} style={{
                  display: 'block', width: '100%', padding: '16px',
                  background: 'var(--site-orange)', borderRadius: 4, textDecoration: 'none',
                  fontFamily: bebas, fontSize: 20, letterSpacing: 3, color: 'white',
                  textAlign: 'center', boxSizing: 'border-box',
                  boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
                }}>CREATE ACCOUNT →</a>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — orange brand panel */}
        <div style={{
          background: 'var(--site-orange)',
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}>
          {rightPage && (
            <button
              onClick={() => setRightPage(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.55)',
                letterSpacing: 2, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6,
                padding: 0, alignSelf: 'flex-start',
              }}
            >← BACK</button>
          )}
          <div style={{ flex: 1 }}>
            {renderRight()}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        background: 'var(--site-white)',
        borderTop: '1px solid var(--site-border)',
        padding: '12px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, flexShrink: 0,
      }}>
        <div style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-4)', letterSpacing: 1 }}>
          © 2026 InsuraSafe, LLC. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {footerLinks.map(link => (
            <button
              key={link.page}
              onClick={() => setRightPage(link.page)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: mono, fontSize: 9,
                color: rightPage === link.page ? 'var(--site-orange)' : 'var(--site-ink-4)',
                letterSpacing: 1.5, padding: '3px 8px', textTransform: 'uppercase',
                borderBottom: rightPage === link.page ? '1px solid var(--site-orange)' : '1px solid transparent',
              }}
            >{link.label}</button>
          ))}
        </div>
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

// ── Export ────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f7f5f2' }} />}>
      <HomePage />
    </Suspense>
  )
}
