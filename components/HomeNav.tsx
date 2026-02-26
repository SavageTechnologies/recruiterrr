'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function HomeNav() {
  const [menuOpen, setMenuOpen] = useState(false)

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
        <Link href="/" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 24,
          letterSpacing: 3,
          color: 'var(--white)',
          textDecoration: 'none',
        }}>
          RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
        </Link>

        {/* Desktop buttons */}
        <div className="home-nav-desktop" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/sign-in" style={{
            padding: '10px 24px',
            background: 'transparent',
            border: '1px solid var(--border-light)',
            color: 'var(--muted)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            letterSpacing: 2,
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}>
            Sign In
          </Link>
          <Link href="/sign-up" style={{
            padding: '10px 24px',
            background: 'var(--orange)',
            color: 'var(--black)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 16,
            letterSpacing: 2,
            textDecoration: 'none',
          }}>
            Start Free Trial
          </Link>
        </div>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMenuOpen(p => !p)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="home-nav-hamburger"
          style={{
            display: 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 5,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            width: 40,
            height: 40,
          }}
        >
          <span style={{
            display: 'block', width: 22, height: 2, background: 'var(--white)',
            transition: 'transform 0.25s',
            transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
          }} />
          <span style={{
            display: 'block', width: 22, height: 2, background: 'var(--white)',
            transition: 'opacity 0.25s',
            opacity: menuOpen ? 0 : 1,
          }} />
          <span style={{
            display: 'block', width: 22, height: 2, background: 'var(--white)',
            transition: 'transform 0.25s',
            transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
          }} />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className="home-nav-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--black)',
          zIndex: 99,
          display: 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {[
          { href: '/about', label: 'ABOUT' },
          { href: '/faq', label: 'FAQ' },
          { href: '/network', label: 'NETWORK' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 36,
              letterSpacing: 4,
              color: 'var(--white)',
              textDecoration: 'none',
            }}
          >
            {label}
          </Link>
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16, width: '75%', maxWidth: 280 }}>
          <Link
            href="/sign-in"
            onClick={() => setMenuOpen(false)}
            style={{
              padding: '14px 0',
              textAlign: 'center',
              border: '1px solid var(--border-light)',
              color: 'var(--muted)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              letterSpacing: 2,
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            onClick={() => setMenuOpen(false)}
            style={{
              padding: '14px 0',
              textAlign: 'center',
              background: 'var(--orange)',
              color: 'var(--black)',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 20,
              letterSpacing: 3,
              textDecoration: 'none',
            }}
          >
            START FREE TRIAL
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
