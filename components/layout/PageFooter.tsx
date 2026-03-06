'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COLS = [
  {
    label: 'Platform',
    links: [
      { href: '/about',   label: 'About'   },
      { href: '/pricing', label: 'Pricing' },
      { href: '/faq',     label: 'FAQ'     },
    ],
  },
  {
    label: 'Intelligence',
    links: [
      { href: '/prometheus', label: 'Prometheus' },
      { href: '/anathema',   label: 'Anathema'   },
      { href: '/david',      label: 'David'       },
    ],
  },
  {
    label: 'Track Us',
    links: [
      { href: '/roadmap', label: 'Roadmap' },
      { href: '/wall',    label: 'Wall'    },
      { href: '/socials', label: 'Socials' },
    ],
  },
  {
    label: 'Company',
    links: [
      { href: '/team',    label: 'Team'    },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy'   },
      { href: '/terms',   label: 'Terms of Service' },
    ],
  },
]

const SOCIALS = [
  { label: 'X / TWITTER', handle: '@rrrSIGNAL', href: 'https://x.com/rrrSIGNAL'                 },
  { label: 'INSTAGRAM',   handle: '@rrrSIGNAL', href: 'https://instagram.com/rrrSIGNAL'         },
  { label: 'TIKTOK',      handle: '@rrrSIGNAL', href: 'https://tiktok.com/@rrrSIGNAL'           },
  { label: 'LINKEDIN',    handle: '@rrrSIGNAL', href: 'https://linkedin.com/company/rrrsignal'  },
]

const MODULES = [
  { label: 'PROMETHEUS', color: 'var(--site-orange)', border: 'var(--site-orange-border)' },
  { label: 'ANATHEMA',   color: 'var(--site-green)',  border: 'var(--site-green-border)'  },
  { label: 'DAVID',      color: 'var(--site-purple)', border: 'var(--site-purple-border)' },
]

function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('recruiterrr_cookies_accepted')
    if (!accepted) setVisible(true)
  }, [])

  const accept  = () => { localStorage.setItem('recruiterrr_cookies_accepted', 'true');     setVisible(false) }
  const decline = () => { localStorage.setItem('recruiterrr_cookies_accepted', 'declined'); setVisible(false) }

  if (!visible) return null

  return (
    <div className="site-cookie-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 3,
          color: 'var(--site-orange)', border: '1px solid var(--site-orange-border)',
          padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0, borderRadius: 3,
        }}>
          COOKIES
        </div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 0.5, lineHeight: 1.6, margin: 0 }}>
          We use cookies for analytics and authentication (Clerk, Stripe). See our{' '}
          <Link href="/privacy" style={{ color: 'var(--site-ink-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Privacy Policy</Link>.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={decline} className="site-btn-ghost"   style={{ padding: '8px 16px', fontSize: 9 }}>DECLINE</button>
        <button onClick={accept}  className="site-btn-primary" style={{ padding: '8px 20px', fontSize: 9 }}>ACCEPT →</button>
      </div>
    </div>
  )
}

export default function PageFooter() {
  return (
    <>
      <CookieBanner />
      <footer className="site-footer">

        <div style={{ height: 2, background: 'var(--site-orange)', width: 60 }} />

        <div style={{ padding: '48px 40px 32px', maxWidth: 1200 }}>

          {/* Top row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(5, auto)', gap: '40px 56px', marginBottom: 48 }}>

            {/* Brand */}
            <div>
              <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: 'var(--site-ink-3)', textDecoration: 'none', display: 'block', marginBottom: 12 }}>
                RECRUITERRR<span style={{ color: 'var(--site-orange)' }}>.</span>
              </Link>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-ink-4)', letterSpacing: 1, lineHeight: 1.9, marginBottom: 16 }}>
                FIND. SCORE. RECRUIT.<br />
                FMO &amp; IMO Intelligence Platform<br />
                recruiterrr.com
              </div>

              {/* Module pills */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {MODULES.map(m => (
                  <div key={m.label} style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 1, padding: '3px 8px', border: `1px solid ${m.border}`, color: m.color, borderRadius: 3 }}>
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Socials */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SOCIALS.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <span className="site-footer-col-label" style={{ width: 72, flexShrink: 0, marginBottom: 0 }}>{s.label}</span>
                    <span className="site-footer-social-handle">{s.handle}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {COLS.map(col => (
              <div key={col.label}>
                <div className="site-footer-col-label">{col.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => (
                    <Link key={l.href} href={l.href} className="site-footer-link">{l.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid var(--site-border)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-ink-4)', letterSpacing: 1 }}>
              © 2026 InsuraSafe, LLC. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-ink-5)', letterSpacing: 2 }}>ALL SYSTEMS NOMINAL</div>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 4, height: 4, background: 'var(--site-orange-border)', borderRadius: '50%' }} />
                <div style={{ width: 4, height: 4, background: 'var(--site-green-border)',  borderRadius: '50%' }} />
              </div>
            </div>
          </div>

        </div>
      </footer>
    </>
  )
}
