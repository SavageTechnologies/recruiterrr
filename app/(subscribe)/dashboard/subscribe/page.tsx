'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

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
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Top accent */}
        <div style={{ height: 2, background: 'var(--orange)', marginBottom: 0 }} />

        <div style={{ background: '#111110', border: '1px solid #222', borderTop: 'none', padding: '48px 40px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 6 }}>
            SUBSCRIPTION REQUIRED
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9, marginBottom: 20 }}>
            ACTIVATE<br /><span style={{ color: 'var(--orange)' }}>YOUR ACCOUNT</span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 32 }}>
            Your account was created but doesn't have an active subscription yet. Subscribe to get full access to agent search, AI scoring, ANATHEMA distribution tree analysis, and Prometheus FMO competitive intelligence.
          </p>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: 'var(--orange)', lineHeight: 1 }}>$799</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--orange)', marginTop: 6 }}>.95</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', marginTop: 14, marginLeft: 4 }}>/mo</span>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 1, marginBottom: 28 }}>
            CANCEL ANYTIME · NO CONTRACTS
          </div>

          {user?.primaryEmailAddress?.emailAddress && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1, marginBottom: 20, padding: '10px 14px', background: '#0e0e0e', border: '1px solid #1a1a1a' }}>
              Subscribing as: <span style={{ color: '#666' }}>{user.primaryEmailAddress.emailAddress}</span>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              width: '100%', padding: '18px', background: 'var(--orange)',
              border: 'none', cursor: loading ? 'default' : 'crosshair',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
              letterSpacing: 3, color: 'var(--black)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'REDIRECTING TO CHECKOUT...' : 'ACTIVATE OPERATOR — $799.95/MO'}
          </button>

          <div style={{ marginTop: 20, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 1, lineHeight: 1.8 }}>
            Questions? Contact us at{' '}
            <a href="mailto:support@recruiterrr.com" style={{ color: '#333', textDecoration: 'none' }}>
              support@recruiterrr.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
