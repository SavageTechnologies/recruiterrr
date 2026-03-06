'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

const mono = "'DM Mono', monospace"
const bebas = "'Bebas Neue', sans-serif"

export default function SubscribePage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.primaryEmailAddress?.emailAddress }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Orange top accent */}
        <div style={{ height: 3, background: 'var(--site-orange)', borderRadius: '4px 4px 0 0' }} />

        <div style={{
          background: 'var(--site-white)',
          border: '1px solid var(--site-border)',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          boxShadow: '0 4px 24px rgba(17,16,16,0.08)',
          padding: '48px 40px',
        }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-3)', letterSpacing: 2, marginBottom: 6 }}>
            SUBSCRIPTION REQUIRED
          </div>
          <div style={{ fontFamily: bebas, fontSize: 42, letterSpacing: 2, color: 'var(--site-ink)', lineHeight: 0.9, marginBottom: 20 }}>
            ACTIVATE<br /><span style={{ color: 'var(--site-orange)' }}>YOUR ACCOUNT</span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--site-ink-3)', lineHeight: 1.75, marginBottom: 32 }}>
            Your account was created but doesn't have an active subscription yet. Subscribe to get full access to agent search, AI scoring, ANATHEMA distribution tree analysis, Prometheus FMO competitive intelligence, and your persistent agent database.
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 4 }}>
            <span style={{ fontFamily: bebas, fontSize: 56, color: 'var(--site-orange)', lineHeight: 1 }}>
              {process.env.NEXT_PUBLIC_PRO_PRICE_WHOLE || '499'}
            </span>
            <span style={{ fontFamily: bebas, fontSize: 28, color: 'var(--site-orange)', marginTop: 6 }}>.95</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--site-ink-3)', marginTop: 14, marginLeft: 4 }}>/mo</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 1, marginBottom: 32 }}>
            CANCEL ANYTIME · NO CONTRACTS
          </div>

          {user?.primaryEmailAddress?.emailAddress && (
            <div style={{
              fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)',
              letterSpacing: 1, marginBottom: 24,
              padding: '10px 14px',
              background: 'var(--site-paper)',
              border: '1px solid var(--site-border)',
              borderRadius: '4px',
            }}>
              Subscribing as:{' '}
              <span style={{ color: 'var(--site-ink-2)' }}>
                {user.primaryEmailAddress.emailAddress}
              </span>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              width: '100%', padding: '18px',
              background: 'var(--site-orange)',
              border: 'none', borderRadius: '4px',
              cursor: loading ? 'default' : 'pointer',
              fontFamily: bebas, fontSize: 20,
              letterSpacing: 3, color: 'white',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
            }}
          >
            {loading ? 'REDIRECTING TO CHECKOUT...' : `ACTIVATE OPERATOR — ${process.env.NEXT_PUBLIC_PRO_PRICE_DISPLAY || '499.95'}/MO`}
          </button>

          <div style={{
            marginTop: 20, fontFamily: mono, fontSize: 10,
            color: 'var(--site-ink-4)', letterSpacing: 1, lineHeight: 1.8,
          }}>
            Questions? Contact us at{' '}
            <a href="mailto:support@recruiterrr.com" style={{ color: 'var(--site-ink-3)', textDecoration: 'none' }}>
              support@recruiterrr.com
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
