import Link from 'next/link'

export default function PageNav() {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--black)', zIndex: 100 }}>
      <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 3, color: 'var(--white)', textDecoration: 'none' }}>
        RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
      </Link>
      <Link href="/dashboard" style={{ padding: '10px 24px', background: 'var(--orange)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 2, color: 'var(--black)', textDecoration: 'none' }}>
        OPEN APP
      </Link>
    </nav>
  )
}
