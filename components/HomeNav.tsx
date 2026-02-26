'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const TOOLS = [
  { href: '/prometheus', label: 'PROMETHEUS', sub: 'FMO competitive intel', color: 'var(--orange)' },
  { href: '/anathema', label: 'ANATHEMA', sub: 'Distribution tree analysis', color: 'var(--green)' },
]

const NAV_LINKS = [
  { href: '/pricing', label: 'PRICING' },
  { href: '/roadmap', label: 'ROADMAP' },
  { href: '/about', label: 'ABOUT' },
]

export default function HomeNav() {
  const [menuOpen, setMenuOpen] = useState(false)
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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 640) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        background: 'var(--black)',
        zIndex: 100,
      }}>
        {/* Logo */}
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 3, color: 'var(--white)', textDecoration: 'none' }}>
          RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
        </Link>

        {/* Desktop nav */}
        <div className="home-nav-desktop" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>

          {/* Tools dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setToolsOpen(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: toolsOpen ? 'var(--white)' : 'var(--muted)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              TOOLS
              <span style={{
                display: 'inline-block',
                width: 0, height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: `4px solid ${toolsOpen ? 'var(--orange)' : 'var(--muted)'}`,
                transition: 'transform 0.2s, border-top-color 0.15s',
                transform: toolsOpen ? 'rotate(180deg)' : 'none',
                marginTop: 2,
              }} />
            </button>

            {/* Dropdown panel */}
            {toolsOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#0e0e0e',
                border: '1px solid var(--border)',
                minWidth: 240,
                zIndex: 200,
              }}>
                {/* Top accent */}
                <div style={{ height: 2, background: 'linear-gradient(90deg, var(--orange), var(--green))' }} />
                {TOOLS.map((t, i) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    onClick={() => setToolsOpen(false)}
                    style={{
                      display: 'block',
                      padding: '14px 16px',
                      textDecoration: 'none',
                      borderBottom: i < TOOLS.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#161616')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: t.color, letterSpacing: 2, marginBottom: 3 }}>
                      {t.label}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1 }}>
                      {t.sub}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Regular nav links */}
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={{
              padding: '10px 16px',
              color: 'var(--muted)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11, letterSpacing: 2,
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--white)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              {l.label}
            </Link>
          ))}

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px' }} />

          <Link href="/sign-in" style={{
            padding: '10px 20px',
            background: 'transparent',
            border: '1px solid var(--border-light)',
            color: 'var(--muted)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, letterSpacing: 2,
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}>
            Sign In
          </Link>
          <Link href="/pricing" style={{
            padding: '10px 20px',
            background: 'var(--orange)',
            color: 'var(--black)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 16, letterSpacing: 2,
            textDecoration: 'none',
          }}>
            REQUEST ACCESS
          </Link>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(p => !p)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="home-nav-hamburger"
          style={{ display: 'none', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 8, width: 40, height: 40 }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: 'var(--white)', transition: 'transform 0.25s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'var(--white)', transition: 'opacity 0.25s', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'var(--white)', transition: 'transform 0.25s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className="home-nav-overlay"
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--black)',
          zIndex: 99,
          display: 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Tools section */}
        <div style={{ width: '75%', maxWidth: 300, marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2, marginBottom: 12, textAlign: 'center' }}>INTELLIGENCE TOOLS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TOOLS.map(t => (
              <Link key={t.href} href={t.href} onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '14px 16px', border: '1px solid var(--border)', textDecoration: 'none', textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: t.color, letterSpacing: 2 }}>{t.label}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1, marginTop: 3 }}>{t.sub}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Regular links */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, margin: '32px 0' }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 4, color: 'var(--white)', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '75%', maxWidth: 300 }}>
          <Link href="/sign-in" onClick={() => setMenuOpen(false)}
            style={{ padding: '14px 0', textAlign: 'center', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none' }}>
            Sign In
          </Link>
          <Link href="/pricing" onClick={() => setMenuOpen(false)}
            style={{ padding: '14px 0', textAlign: 'center', background: 'var(--orange)', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, textDecoration: 'none' }}>
            REQUEST ACCESS
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 639px) {
          .home-nav-desktop { display: none !important; }
          .home-nav-hamburger { display: flex !important; }
          .home-nav-overlay { display: flex !important; }
        }
      `}</style>
    </>
  )
}
