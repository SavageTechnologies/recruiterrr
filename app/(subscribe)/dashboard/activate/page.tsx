'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// This page is the landing point after Clerk signup completes.
// It polls the /api/activation-check endpoint until the Stripe webhook
// has written plan='pro' to the users table, then redirects to the dashboard.
// This solves the race condition between the Clerk user.created webhook and
// the Stripe checkout.session.completed webhook.

const mono = "'DM Mono', monospace"
const bebas = "'Bebas Neue', sans-serif"

export default function ActivatePage() {
  const router = useRouter()
  const [attempts, setAttempts] = useState(0)
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'manual'>('checking')

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch('/api/activation-check')
        const data = await res.json()

        if (cancelled) return

        if (data.active) {
          setStatus('redirecting')
          router.replace('/dashboard')
          return
        }

        setAttempts(a => a + 1)

        // After 12 attempts (~24 seconds) show manual button
        if (attempts >= 12) {
          setStatus('manual')
          return
        }

        setTimeout(poll, 2000)
      } catch {
        if (!cancelled) setTimeout(poll, 2000)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [])

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>

        {status === 'checking' && (
          <>
            <div style={{
              width: 36, height: 36,
              border: '2px solid var(--site-border)',
              borderTop: '2px solid var(--site-orange)',
              borderRadius: '50%',
              margin: '0 auto 32px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{
              fontFamily: bebas, fontSize: 28,
              letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 10,
            }}>
              ACTIVATING YOUR ACCOUNT
            </div>
            <div style={{
              fontFamily: mono, fontSize: 10,
              color: 'var(--site-ink-3)', letterSpacing: 2,
            }}>
              CONFIRMING PAYMENT · JUST A MOMENT
            </div>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <div style={{ fontSize: 28, color: 'var(--site-orange)', marginBottom: 16 }}>✦</div>
            <div style={{
              fontFamily: bebas, fontSize: 28,
              letterSpacing: 2, color: 'var(--site-ink)',
            }}>
              ACCOUNT ACTIVE — LOADING DASHBOARD
            </div>
          </>
        )}

        {status === 'manual' && (
          <>
            <div style={{
              fontFamily: bebas, fontSize: 28,
              letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 10,
            }}>
              READY
            </div>
            <div style={{
              fontFamily: mono, fontSize: 10,
              color: 'var(--site-ink-3)', letterSpacing: 2, marginBottom: 32,
            }}>
              YOUR ACCOUNT IS SET UP
            </div>
            <button
              onClick={() => router.replace('/dashboard')}
              style={{
                padding: '16px 40px',
                background: 'var(--site-orange)',
                border: 'none', borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: bebas, fontSize: 18,
                letterSpacing: 3, color: 'white',
                boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
              }}
            >
              GO TO DASHBOARD
            </button>
          </>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  )
}
