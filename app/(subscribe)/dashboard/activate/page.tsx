'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// This page is the landing point after Clerk signup completes.
// It polls the /api/activation-check endpoint until the Stripe webhook
// has written plan='pro' to the users table, then redirects to the dashboard.
// This solves the race condition between the Clerk user.created webhook and
// the Stripe checkout.session.completed webhook.

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
      minHeight: '80vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '40px 24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>

        {status === 'checking' && (
          <>
            <div style={{
              width: 40, height: 40, border: '2px solid #222',
              borderTop: '2px solid var(--orange)', borderRadius: '50%',
              margin: '0 auto 28px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 28,
              letterSpacing: 2, color: 'var(--white)', marginBottom: 8,
            }}>
              ACTIVATING YOUR ACCOUNT
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: '#444', letterSpacing: 2,
            }}>
              CONFIRMING PAYMENT · JUST A MOMENT
            </div>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <div style={{
              fontSize: 28, color: 'var(--orange)', marginBottom: 16,
            }}>✦</div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 28,
              letterSpacing: 2, color: 'var(--white)',
            }}>
              ACCOUNT ACTIVE — LOADING DASHBOARD
            </div>
          </>
        )}

        {status === 'manual' && (
          <>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 28,
              letterSpacing: 2, color: 'var(--white)', marginBottom: 8,
            }}>
              READY
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: '#444', letterSpacing: 2, marginBottom: 28,
            }}>
              YOUR ACCOUNT IS SET UP
            </div>
            <button
              onClick={() => router.replace('/dashboard')}
              style={{
                padding: '16px 32px', background: 'var(--orange)',
                border: 'none', cursor: 'crosshair',
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 18,
                letterSpacing: 3, color: 'var(--black)',
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
