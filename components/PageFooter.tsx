import Link from 'next/link'

const LINKS = ['about','faq','wall','socials','roadmap','contact','team','network','privacy','terms',]

export default function PageFooter() {
  return (
    <footer style={{ padding: '32px 40px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3, color: '#444', textDecoration: 'none' }}>
          RECRUITERRR<span style={{ color: '#3a3a3a' }}>.</span>
        </Link>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {LINKS.map(p => (
            <Link key={p} href={`/${p}`}
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, textTransform: 'capitalize', textDecoration: 'none' }}>
              {p}
            </Link>
          ))}
        </div>
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2a2a2a', letterSpacing: 1 }}>
        © 2026 InsuraSafe, LLC. All rights reserved.
      </div>
    </footer>
  )
}
