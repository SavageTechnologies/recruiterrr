import Link from 'next/link'

const LINKS = ['about', 'pricing', 'faq', 'prometheus', 'anathema', 'wall', 'socials', 'roadmap', 'contact', 'team', 'network', 'privacy', 'terms']

export default function PageFooter() {
  return (
    <footer style={{ borderTop: '1px solid #2e2b27' }}>
      <div style={{ height: 2, background: 'var(--orange)', width: 60 }} />
      <div style={{ padding: '32px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3, color: '#888', textDecoration: 'none' }}>
            RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
          </Link>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {LINKS.map(p => (
              <Link key={p} href={`/${p}`}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#666', letterSpacing: 1, textTransform: 'capitalize', textDecoration: 'none' }}>
                {p}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 1 }}>
          © 2026 InsuraSafe, LLC. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
