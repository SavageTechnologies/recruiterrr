'use client'

import { useState } from 'react'
import { SignUp } from '@clerk/nextjs'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

const INVITE_CODE = process.env.NEXT_PUBLIC_INVITE_CODE || 'HEARTLAND2026'

export default function SignUpPage() {
  const [code, setCode] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')

  function checkCode() {
    if (code.trim().toUpperCase() === INVITE_CODE.toUpperCase()) {
      setUnlocked(true)
      setError('')
    } else {
      setError('Invalid invite code.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
      <PageNav />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: 80 }}>

        {/* Left — branding */}
        <div style={{ maxWidth: 400, display: 'none' }} className="auth-left">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
            Early Access
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, color: 'var(--white)', marginBottom: 24 }}>
            JOIN THE<br /><span style={{ color: 'var(--orange)' }}>PLATFORM.</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 40 }}>
            Recruiterrr is currently invite-only. Enter your access code to create an account.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Real-time agent intelligence', 'HOT / WARM / COLD scoring', 'Job posting + YouTube signals', 'Every market in the US'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#444', letterSpacing: 0.5 }}>
                <span style={{ width: 6, height: 6, background: 'var(--orange)', borderRadius: '50%', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right — gate or form */}
        {!unlocked ? (
          <div style={{ width: 380, background: '#111110', border: '1px solid #222', padding: '48px 40px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, color: 'var(--white)', marginBottom: 6 }}>
              INVITE ONLY
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 36 }}>
              Early access — enter your code to continue
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                Access Code
              </div>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkCode()}
                placeholder="ENTER CODE"
                style={{
                  width: '100%', padding: '14px', background: '#1a1814',
                  border: `1px solid ${error ? 'var(--red)' : '#222'}`,
                  borderRadius: 0, color: 'var(--white)',
                  fontFamily: "'DM Mono', monospace", fontSize: 14,
                  letterSpacing: 3, textTransform: 'uppercase',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--red)', letterSpacing: 1, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={checkCode}
              style={{
                width: '100%', padding: '16px', background: 'var(--orange)',
                border: 'none', cursor: 'pointer', marginTop: 16,
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
                letterSpacing: 3, color: 'var(--black)',
              }}
            >
              UNLOCK ACCESS
            </button>

            <div style={{ marginTop: 28, fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2a2a2a', letterSpacing: 1, lineHeight: 1.7 }}>
              Don't have a code? Recruiterrr is currently invite-only while we finish building. <a href="/contact" style={{ color: '#333', textDecoration: 'none' }}>Get in touch</a> to request access.
            </div>
          </div>
        ) : (
          <SignUp
            appearance={{
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
                card: {
                  background: '#111110',
                  border: '1px solid #222',
                  borderRadius: 0,
                  boxShadow: 'none',
                  padding: '40px',
                },
                headerTitle: {
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '36px',
                  letterSpacing: '2px',
                  color: '#ffffff',
                },
                headerSubtitle: {
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '1px',
                  color: '#444',
                  textTransform: 'uppercase',
                },
                formButtonPrimary: {
                  background: '#ff5500',
                  borderRadius: 0,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '18px',
                  letterSpacing: '2px',
                  color: '#000',
                  padding: '14px 0',
                  border: 'none',
                },
                formFieldInput: {
                  background: '#1a1814',
                  border: '1px solid #222',
                  borderRadius: 0,
                  color: '#ffffff',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '13px',
                  padding: '12px 14px',
                },
                formFieldLabel: {
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#555',
                },
                footerActionLink: {
                  color: '#ff5500',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                },
                dividerLine: { background: '#222' },
                dividerText: { color: '#333', fontFamily: "'DM Mono', monospace", fontSize: '10px' },
                socialButtonsBlockButton: {
                  background: '#1a1814',
                  border: '1px solid #222',
                  borderRadius: 0,
                  color: '#666',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '1px',
                },
                alertText: { fontFamily: "'DM Mono', monospace", fontSize: '11px' },
              },
            }}
          />
        )}
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
