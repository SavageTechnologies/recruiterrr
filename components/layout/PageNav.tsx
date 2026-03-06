'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const TOOLS = [
  { href: '/prometheus', label: 'Prometheus', sub: 'FMO competitive intel',        color: 'var(--site-orange)' },
  { href: '/anathema',   label: 'Anathema',   sub: 'Distribution tree analysis',   color: 'var(--site-green)'  },
  { href: '/david',      label: 'David',      sub: 'Agentic recruiting outreach',  color: 'var(--site-purple)' },
]

const NAV_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/about',   label: 'About'   },
]

export default function PageNav() {
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 640) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <nav className="site-nav">

        {/* Logo */}
        <Link href="/" className="site-nav-logo">
          RECRUITERRR<span>.</span>
        </Link>

        {/* Desktop links */}
        <div className="site-nav-links">

          {/* Tools dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="site-nav-link"
              onClick={() => setToolsOpen(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Tools
              <span style={{
                display: 'inline-block',
                width: 0, height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: `4px solid var(--site-ink-4)`,
                transition: 'transform 0.2s',
                transform: toolsOpen ? 'rotate(180deg)' : 'none',
                marginTop: 2,
              }} />
            </button>

            {toolsOpen && (
              <div className="site-nav-dropdown">
                <div className="site-nav-dropdown-accent" />
                {TOOLS.map((t, i) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className="site-nav-dropdown-item"
                    onClick={() => setToolsOpen(false)}
                    style={{ borderBottom: i < TOOLS.length - 1 ? '1px solid var(--site-border)' : 'none' }}
                  >
                    <div className="site-nav-dropdown-item-name" style={{ color: t.color }}>{t.label}</div>
                    <div className="site-nav-dropdown-item-sub">{t.sub}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="site-nav-link">{l.label}</Link>
          ))}

          <div className="site-nav-divider" />

          <Link href="/sign-in"  className="site-nav-signin">Sign In</Link>
          <Link href="/sign-up"  className="site-nav-cta">Request Access</Link>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(p => !p)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="site-nav-hamburger"
        >
          <span style={{ transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',  transition: 'transform 0.25s' }} />
          <span style={{ opacity: menuOpen ? 0 : 1, transition: 'opacity 0.25s' }} />
          <span style={{ transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition: 'transform 0.25s' }} />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className="site-nav-overlay"
        style={{
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Tools */}
        <div style={{ width: '75%', maxWidth: 300, marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-ink-4)', letterSpacing: 2, marginBottom: 12, textAlign: 'center', textTransform: 'uppercase' }}>
            Intelligence Tools
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TOOLS.map(t => (
              <Link
                key={t.href} href={t.href}
                onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '14px 16px', border: '1px solid var(--site-border)', textDecoration: 'none', textAlign: 'center', borderRadius: 'var(--radius)' }}
              >
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: t.color, letterSpacing: 2 }}>{t.label}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-ink-4)', letterSpacing: 1, marginTop: 3 }}>{t.sub}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, margin: '32px 0' }}>
          {NAV_LINKS.map(l => (
            <Link
              key={l.href} href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 4, color: 'var(--site-ink)', textDecoration: 'none' }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '75%', maxWidth: 300 }}>
          <Link href="/sign-in" onClick={() => setMenuOpen(false)} className="site-nav-signin" style={{ textAlign: 'center', padding: '14px 0' }}>
            Sign In
          </Link>
          <Link href="/sign-up" onClick={() => setMenuOpen(false)} className="site-nav-cta" style={{ textAlign: 'center', padding: '14px 0', fontSize: 20 }}>
            Request Access
          </Link>
        </div>
      </div>
    </>
  )
}
