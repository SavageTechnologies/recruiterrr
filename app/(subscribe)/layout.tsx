import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import '../(site)/site.css'

// Minimal layout for the subscribe/activate pages — has auth but NO subscription gate.
// Prevents the redirect loop that would occur if subscribe lived under the main layout.
export default async function SubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="site-shell">
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64, borderBottom: '1px solid var(--site-border)',
        position: 'sticky', top: 0,
        background: 'rgba(247, 245, 242, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <Link href="/dashboard/subscribe" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 22, letterSpacing: 3, color: 'var(--site-ink)', textDecoration: 'none',
        }}>
          RECRUITERRR<span style={{ color: 'var(--site-orange)' }}>.</span>
        </Link>
        <UserButton afterSignOutUrl="/" />
      </nav>
      <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>
    </div>
  )
}
