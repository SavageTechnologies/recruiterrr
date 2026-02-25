'use client'

import Link from 'next/link'
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) router.push('/dashboard')
  }, [isSignedIn, router])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'var(--black)', zIndex: 100,
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 28, letterSpacing: 3, color: 'var(--white)',
        }}>
          RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <SignInButton mode="modal">
            <button style={{
              padding: '10px 24px', background: 'transparent',
              border: '1px solid var(--border-light)', color: 'var(--muted)',
              fontFamily: "'DM Mono', monospace", fontSize: 12,
              letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase',
            }}>
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button style={{
              padding: '10px 24px', background: 'var(--orange)',
              border: 'none', color: 'var(--black)',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
              letterSpacing: 2, cursor: 'pointer',
            }}>
              Start Free Trial
            </button>
          </SignUpButton>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '80px 40px 60px', maxWidth: 900 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
          For FMOs &amp; Recruiters
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(64px, 10vw, 120px)',
          lineHeight: 0.9, letterSpacing: 2,
          color: 'var(--white)', marginBottom: 24,
        }}>
          FIND.<br />
          <span style={{ color: 'var(--orange)' }}>SCORE.</span><br />
          RECRUIT.
        </h1>
        <p style={{
          fontSize: 18, color: 'var(--muted)', fontWeight: 300,
          maxWidth: 480, lineHeight: 1.6, marginBottom: 48,
        }}>
          Stop cold calling blind. We scrape, research, and score every independent Medicare agent in any market so you know exactly who to call.
        </p>
        <SignUpButton mode="modal">
          <button style={{
            padding: '18px 48px', background: 'var(--orange)',
            border: 'none', color: 'var(--black)',
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
            letterSpacing: 3, cursor: 'pointer',
          }}>
            START FREE — NO CARD NEEDED
          </button>
        </SignUpButton>
      </section>

      {/* STATS */}
      <div style={{
        display: 'flex', gap: 40, padding: '0 40px 48px',
        borderBottom: '1px solid var(--border)',
      }}>
        {[
          { main: '48', accent: 'K', label: 'Agents Indexed' },
          { main: '3,200', accent: '', label: 'Markets Covered' },
          { main: '94', accent: '%', label: 'Data Accuracy' },
          { main: '12', accent: 'x', label: 'Better Than Cold Lists' },
        ].map(s => (
          <div key={s.label}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 36,
              color: 'var(--white)', letterSpacing: 1,
            }}>
              {s.main}<span style={{ color: 'var(--orange)' }}>{s.accent}</span>
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 40px', maxWidth: 900 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase',
          marginBottom: 48,
        }}>
          How It Works
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { n: '01', title: 'Search Any Market', body: 'Enter a city and state. We query Google local listings for every Medicare insurance agent in that area.' },
            { n: '02', title: 'We Do The Research', body: 'Our AI crawls their websites, identifies carrier appointments, checks license history, and reads their reviews.' },
            { n: '03', title: 'You Get a Score', body: 'Every agent gets a recruitability score. HOT means independent, multi-carrier, and open to a better deal.' },
          ].map(step => (
            <div key={step.n} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              padding: '32px 28px',
            }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 48,
                color: 'var(--border-light)', marginBottom: 16,
              }}>
                {step.n}
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 16,
                fontWeight: 600, marginBottom: 12, color: 'var(--white)',
              }}>
                {step.title}
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                {step.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '24px 40px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 18,
          letterSpacing: 3, color: '#333',
        }}>
          RECRUITERRR<span style={{ color: '#3a3a3a' }}>.</span>
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: '#2a2a2a', letterSpacing: 2,
        }}>
          © 2026 — Agent Intelligence Platform
        </div>
      </footer>
    </div>
  )
}
