import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { isAdmin } from '@/lib/auth/access'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const adminUser = userId ? isAdmin(userId) : false

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'var(--black)', zIndex: 100,
      }}>
        <Link href="/dashboard" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 24, letterSpacing: 3, color: 'var(--white)', textDecoration: 'none',
        }}>
          RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* ── Standard user nav ── */}
          <Link href="/dashboard" style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
          }}>
            Dashboard
          </Link>
          <Link href="/dashboard/search" style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
          }}>
            Search
          </Link>
          <Link href="/dashboard/database" style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
          }}>
            Database
          </Link>

          {/* ── Admin-only nav ── */}
          {adminUser && (
            <>
              <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
              <Link href="/dashboard/anathema" style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: 'var(--green)', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
                opacity: 0.75,
              }}>
                Anathema
              </Link>
              <Link href="/dashboard/prometheus" style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
                opacity: 0.75,
              }}>
                Prometheus
              </Link>
              <Link href="/dashboard/david" style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: '#a78bfa', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
                opacity: 0.75,
              }}>
                David
              </Link>
              <Link href="/dashboard/admin/adspy" style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: '#38bdf8', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
                opacity: 0.75,
              }}>
                Meredith
              </Link>
              <Link href="/dashboard/admin" style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: '#555', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
              }}>
                Admin
              </Link>
            </>
          )}

          <UserButton
            afterSignOutUrl="/"
            appearance={{
              variables: {
                colorPrimary: '#ff5500',
                colorBackground: '#111110',
                colorText: '#ffffff',
                colorTextSecondary: '#666',
                colorNeutral: '#333',
                borderRadius: '0px',
                fontFamily: "'DM Mono', monospace",
              },
              elements: {
                avatarBox: {
                  width: 32,
                  height: 32,
                  border: '1px solid #333',
                  borderRadius: '0px',
                },
                userButtonPopoverCard: {
                  background: '#111110',
                  border: '1px solid #222',
                  borderRadius: 0,
                  boxShadow: 'none',
                },
                userButtonPopoverActionButton: {
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '1px',
                  color: '#666',
                  borderRadius: 0,
                },
                userButtonPopoverActionButtonText: {
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                },
                userButtonPopoverActionButtonIcon: { color: '#444' },
                userButtonPopoverFooter: { display: 'none' },
                userPreviewMainIdentifier: {
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '18px',
                  letterSpacing: '2px',
                  color: '#ffffff',
                },
                userPreviewSecondaryIdentifier: {
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: '#444',
                },
                userPreview: {
                  borderBottom: '1px solid #222',
                  paddingBottom: '12px',
                  marginBottom: '4px',
                },
              },
            }}
          />
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
