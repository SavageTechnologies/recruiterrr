'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function PageNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close menu on resize to desktop
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
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 24,
            letterSpacing: 3,
            color: 'var(--white)',
            textDecoration: 'none',
          }}
        >
          RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
        </Link>

        {/* Desktop CTA — hidden on mobile */}
        <Link
          href="/dashboard"
          className="nav-desktop-cta"
          style={{
            padding: '10px 24px',
            background: 'var(--orange)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 15,
            letterSpacing: 2,
            color: 'var(--black)',
            textDecoration: 'none',
          }}
        >
          OPEN APP
        </Link>

        {/* Hamburger button — shown on mobile */}
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="nav-hamburger"
          style={{
            display: 'flex',
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
            display: 'block',
            width: 22,
            height: 2,
            background: 'var(--white)',
            transition: 'transform 0.25s, opacity 0.25s',
            transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
          }} />
          <span style={{
            display: 'block',
            width: 22,
            height: 2,
            background: 'var(--white)',
            transition: 'opacity 0.25s',
            opacity: menuOpen ? 0 : 1,
          }} />
          <span style={{
            display: 'block',
            width: 22,
            height: 2,
            background: 'var(--white)',
            transition: 'transform 0.25s, opacity 0.25s',
            transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
          }} />
        </button>
      </nav>

      {/* Mobile full-screen overlay menu */}
      <div
        className="nav-mobile-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--black)',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {[
          { href: '/', label: 'HOME' },
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

        <Link
          href="/dashboard"
          onClick={() => setMenuOpen(false)}
          style={{
            marginTop: 16,
            padding: '14px 40px',
            background: 'var(--orange)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 20,
            letterSpacing: 3,
            color: 'var(--black)',
            textDecoration: 'none',
          }}
        >
          OPEN APP
        </Link>
      </div>

      {/* Responsive styles */}
      <style>{`
        /* Mobile default: show hamburger, hide desktop CTA */
        .nav-hamburger { display: flex !important; }
        .nav-desktop-cta { display: none !important; }
        .nav-mobile-overlay { display: flex !important; }

        /* Desktop (640px+): flip it */
        @media (min-width: 640px) {
          .nav-hamburger { display: none !important; }
          .nav-desktop-cta { display: inline-block !important; }
          .nav-mobile-overlay { display: none !important; }
        }
      `}</style>
    </>
  )
}
