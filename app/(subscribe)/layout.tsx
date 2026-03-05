import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Minimal layout for the subscribe page — has auth but NO subscription gate.
// Prevents the redirect loop that would occur if subscribe lived under the main layout.
export default async function SubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'var(--bg-raised)', zIndex: 100,
        boxShadow: '0 1px 4px var(--shadow-sm)',
      }}>
        <Link href="/dashboard/subscribe" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 22, letterSpacing: 3, color: 'var(--text-1)', textDecoration: 'none',
        }}>
          RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
        </Link>
        <UserButton afterSignOutUrl="/" />
      </nav>
      <main>{children}</main>
    </div>
  )
}
