import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Minimal layout for the subscribe page — has auth but NO subscription gate.
// This prevents the redirect loop that would occur if subscribe lived under
// the main dashboard layout.
export default async function SubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'var(--black)', zIndex: 100,
      }}>
        <Link href="/dashboard/subscribe" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 24, letterSpacing: 3, color: 'var(--white)', textDecoration: 'none',
        }}>
          RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
        </Link>
        <UserButton afterSignOutUrl="/" />
      </nav>
      <main>{children}</main>
    </div>
  )
}
