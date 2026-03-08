'use client'

import { useState, useEffect } from 'react'
import { useSignIn, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import '../../../(site)/site.css'
import SiteFooter from '../../../../components/site/SiteFooter'

const mono  = "'DM Mono', monospace"
const bebas = "'Bebas Neue', sans-serif"
const sans  = "'DM Sans', sans-serif"

export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn()
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Already signed in — get them to the dashboard immediately
  useEffect(() => {
    if (isSignedIn) router.replace('/dashboard')
  }, [isSignedIn, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        router.push('/dashboard')
      } else {
        setError('Sign in could not be completed. Please try again.')
        setLoading(false)
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { code?: string; message: string }[] }
      const code = clerkErr?.errors?.[0]?.code
      // Session already exists — just send them to the dashboard
      if (code === 'identifier_already_signed_in' || code === 'session_exists') {
        router.replace('/dashboard')
        return
      }
      const msg = clerkErr?.errors?.[0]?.message
      setError(msg || 'Invalid email or password.')
      setLoading(false)
    }
  }

  return (
    <div className="site-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <nav style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', borderBottom: '1px solid var(--site-border)',
        background: 'var(--site-white)', flexShrink: 0,
      }}>
        <a href="/" style={{ fontFamily: bebas, fontSize: 20, letterSpacing: 3, color: 'var(--site-ink)', textDecoration: 'none' }}>
          RECRUITERRR<span style={{ color: 'var(--site-orange)' }}>.</span>
        </a>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/" style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, padding: '7px 16px', border: '1px solid var(--site-border)', borderRadius: 4, color: 'var(--site-ink-3)', textDecoration: 'none' }}>← BACK</a>
          <a href="/sign-up" style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, padding: '7px 16px', border: '1px solid var(--site-border)', borderRadius: 4, color: 'var(--site-ink-3)', textDecoration: 'none' }}>REQUEST ACCESS</a>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'stretch' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 44px', background: 'var(--site-paper)', borderRight: '1px solid var(--site-border)' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: bebas, fontSize: 40, letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 6 }}>WELCOME BACK.</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2 }}>OPERATOR ACCESS</div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2, marginBottom: 8 }}>EMAIL ADDRESS</div>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" required
                  style={{ width: '100%', padding: '13px 14px', background: 'var(--site-white)', border: '1px solid var(--site-border)', borderRadius: 4, color: 'var(--site-ink)', fontFamily: mono, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#e84d1c')}
                  onBlur={e  => (e.target.style.borderColor = '#e0dbd5')}
                />
              </div>
              <div>
                <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2, marginBottom: 8 }}>PASSWORD</div>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••" required
                  style={{ width: '100%', padding: '13px 14px', background: 'var(--site-white)', border: '1px solid var(--site-border)', borderRadius: 4, color: 'var(--site-ink)', fontFamily: mono, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#e84d1c')}
                  onBlur={e  => (e.target.style.borderColor = '#e0dbd5')}
                />
              </div>

              {error && <div style={{ fontFamily: mono, fontSize: 10, color: '#e84d1c', letterSpacing: 1 }}>{error}</div>}

              <button type="submit" disabled={loading || !isLoaded} style={{
                width: '100%', padding: '16px', background: '#e84d1c', border: 'none', borderRadius: 4,
                cursor: loading ? 'default' : 'pointer', fontFamily: bebas, fontSize: 20,
                letterSpacing: 3, color: 'white', opacity: loading ? 0.7 : 1,
                boxShadow: '0 2px 12px rgba(232,77,28,0.28)', marginTop: 4,
              }}>
                {loading ? 'SIGNING IN...' : 'SIGN IN →'}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center', fontFamily: mono, fontSize: 10, color: 'var(--site-ink-4)', letterSpacing: 1 }}>
              Don&apos;t have an account?{' '}
              <a href="/sign-up" style={{ color: '#e84d1c', textDecoration: 'none' }}>Request access →</a>
            </div>
          </div>
        </div>

        <div style={{ background: '#e84d1c', padding: '48px 44px' }}>
          <h1 style={{ fontFamily: bebas, fontSize: 56, letterSpacing: 2, lineHeight: 0.92, color: 'white', marginBottom: 24 }}>
            RECRUIT ON<br />INTELLIGENCE,<br /><span style={{ color: 'rgba(255,255,255,0.42)' }}>NOT INSTINCT.</span>
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
      </div>

      <SiteFooter />
    </div>
  )
}
