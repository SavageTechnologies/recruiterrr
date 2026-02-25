import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'var(--black)', zIndex: 100,
      }}>
        <Link href="/dashboard" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 24, letterSpacing: 3, color: 'var(--white)',
        }}>
          RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/dashboard" style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase',
          }}>
            Dashboard
          </Link>
          <Link href="/dashboard/search" style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase',
          }}>
            Search
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
