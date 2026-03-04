'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COLS = [
  {
    label: 'Platform',
    links: [
      { href: '/about',       label: 'About' },
      { href: '/pricing',     label: 'Pricing' },
      { href: '/roadmap',     label: 'Roadmap' },
      { href: '/faq',         label: 'FAQ' },
    ],
  },
  {
    label: 'Intelligence',
    links: [
      { href: '/prometheus', label: 'PROMETHEUS' },
      { href: '/anathema',   label: 'ANATHEMA' },
      { href: '/david',      label: 'DAVID' },
    ],
  },
  {
    label: 'Track Us',
    links: [
      { href: '/network',          label: 'Network Map' },
      { href: '/network/anathema', label: 'Infection Map' },
    ],
  },
  {
    label: 'Company',
    links: [
      { href: '/team',    label: 'Team' },
      { href: '/contact', label: 'Contact' },
      { href: '/wall',    label: 'Wall' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms',   label: 'Terms of Service' },
    ],
  },
]

const SOCIALS = [
  { label: 'X / TWITTER', handle: '@rrrSIGNAL', href: 'https://x.com/rrrSIGNAL' },
  { label: 'INSTAGRAM',   handle: '@rrrSIGNAL', href: 'https://instagram.com/rrrSIGNAL' },
  { label: 'TIKTOK',      handle: '@rrrSIGNAL', href: 'https://tiktok.com/@rrrSIGNAL' },
  { label: 'LINKEDIN',    handle: '@rrrSIGNAL', href: 'https://linkedin.com/company/rrrsignal' },
]

function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('recruiterrr_cookies_accepted')
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('recruiterrr_cookies_accepted', 'true')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('recruiterrr_cookies_accepted', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      background: '#141210',
      borderTop: '1px solid #2e2b27',
      borderBottom: 'none',
      padding: '16px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      flexWrap: 'wrap',
    }}>
      {/* Left accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 2, background: 'var(--orange)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 8,
          letterSpacing: 3,
          color: 'var(--orange)',
          border: '1px solid rgba(255,85,0,0.3)',
          padding: '3px 8px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          COOKIES
        </div>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: '#555',
          letterSpacing: 0.5,
          lineHeight: 1.6,
          margin: 0,
        }}>
          We use cookies for analytics and authentication (Clerk, Stripe).
          See our{' '}
          <Link href="/privacy" style={{ color: '#777', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            background: 'none',
            border: '1px solid #2e2b27',
            color: '#3a3a3a',
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#777' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2b27'; e.currentTarget.style.color = '#3a3a3a' }}
        >
          DECLINE
        </button>
        <button
          onClick={accept}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,85,0,0.5)',
            color: 'var(--orange)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            padding: '8px 20px',
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,85,0,0.08)'; e.currentTarget.style.borderColor = 'var(--orange)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,85,0,0.5)' }}
        >
          ACCEPT →
        </button>
      </div>
    </div>
  )
}

export default function PageFooter() {
  return (
    <>
      <CookieBanner />
    <footer style={{ borderTop: '1px solid #2e2b27' }}>
      <div style={{ height: 2, background: 'var(--orange)', width: 60 }} />

      <div style={{ padding: '48px 40px 32px', maxWidth: 1200 }}>

        {/* Top row — logo + columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(5, auto)', gap: '40px 64px', marginBottom: 48, flexWrap: 'wrap' }}>

          {/* Brand */}
          <div>
            <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: '#777', textDecoration: 'none', display: 'block', marginBottom: 12 }}>
              RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
            </Link>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#3a3a3a', letterSpacing: 1, lineHeight: 1.8, marginBottom: 16 }}>
              FIND. SCORE. RECRUIT.<br />
              FMO &amp; IMO Intelligence Platform<br />
              recruiterrr.com
            </div>

            {/* Module status pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 1, padding: '3px 8px', border: '1px solid rgba(255,85,0,0.3)', color: 'rgba(255,85,0,0.5)' }}>
                PROMETHEUS
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 1, padding: '3px 8px', border: '1px solid rgba(0,230,118,0.2)', color: 'rgba(0,230,118,0.35)' }}>
                ANATHEMA
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 1, padding: '3px 8px', border: '1px solid rgba(167,139,250,0.2)', color: 'rgba(167,139,250,0.35)' }}>
                DAVID
              </div>
            </div>

            {/* Socials */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
                >
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#2a2a2a', letterSpacing: 1, width: 72, flexShrink: 0 }}>{s.label}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, color: '#444', transition: 'color 0.15s' }}
                    onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--white)')}
                    onMouseLeave={e => ((e.target as HTMLElement).style.color = '#444')}
                  >{s.handle}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.label}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
                {col.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 1, textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--white)')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#555')}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#3a3a3a', letterSpacing: 1 }}>
            © 2026 InsuraSafe, LLC. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 2 }}>
              ALL SYSTEMS NOMINAL
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 4, height: 4, background: 'rgba(255,85,0,0.4)', borderRadius: '50%' }} />
              <div style={{ width: 4, height: 4, background: 'rgba(0,230,118,0.3)', borderRadius: '50%' }} />
            </div>
          </div>
        </div>

      </div>
    </footer>
    </>
  )
}
