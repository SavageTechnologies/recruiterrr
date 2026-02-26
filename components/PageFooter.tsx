import Link from 'next/link'

const COLS = [
  {
    label: 'Platform',
    links: [
      { href: '/about', label: 'About' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/roadmap', label: 'Roadmap' },
      { href: '/faq', label: 'FAQ' },
      { href: '/wall', label: 'Wall' },
    ],
  },
  {
    label: 'Intelligence',
    links: [
      { href: '/prometheus', label: 'Prometheus' },
      { href: '/anathema', label: 'ANATHEMA' },
      { href: '/network', label: 'Network' },
    ],
  },
  {
    label: 'Company',
    links: [
      { href: '/team', label: 'Team' },
      { href: '/contact', label: 'Contact' },
      { href: '/socials', label: 'Socials' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
]

export default function PageFooter() {
  return (
    <footer style={{ borderTop: '1px solid #2e2b27' }}>
      <div style={{ height: 2, background: 'var(--orange)', width: 60 }} />
      <div style={{ padding: '48px 40px 32px', maxWidth: 1200 }}>

        {/* Top row — logo + columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, auto)', gap: '40px 64px', marginBottom: 40, flexWrap: 'wrap' }}>

          {/* Brand */}
          <div>
            <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: '#777', textDecoration: 'none', display: 'block', marginBottom: 12 }}>
              RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
            </Link>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#3a3a3a', letterSpacing: 1, lineHeight: 1.8 }}>
              FIND. SCORE. RECRUIT.<br />
              FMO &amp; IMO Intelligence Platform<br />
              recruiterrr.com
            </div>
            {/* Module status pills */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 1, padding: '3px 8px', border: '1px solid rgba(255,85,0,0.3)', color: 'rgba(255,85,0,0.5)' }}>
                PROMETHEUS
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 1, padding: '3px 8px', border: '1px solid rgba(0,230,118,0.2)', color: 'rgba(0,230,118,0.35)' }}>
                ANATHEMA
              </div>
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
                  <Link key={l.href} href={l.href} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#666', letterSpacing: 1, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--white)')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#666')}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#3a3a3a', letterSpacing: 1 }}>
            © 2026 InsuraSafe, LLC. All rights reserved.
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 2 }}>
            ALL SYSTEMS NOMINAL
          </div>
        </div>
      </div>
    </footer>
  )
}
