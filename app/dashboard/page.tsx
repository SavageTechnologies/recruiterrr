import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName || 'there'

  return (
    <div style={{ padding: '60px 40px', maxWidth: 1100 }}>
      {/* GREETING */}
      <div style={{ marginBottom: 60 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Welcome back
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(48px, 6vw, 80px)',
          letterSpacing: 2, lineHeight: 0.9,
          color: 'var(--white)',
        }}>
          {firstName.toUpperCase()}<span style={{ color: 'var(--orange)' }}>.</span>
        </h1>
      </div>

      {/* QUICK ACTION */}
      <Link href="/dashboard/search" style={{
        display: 'inline-flex', alignItems: 'center', gap: 16,
        padding: '24px 32px',
        background: 'var(--orange)',
        marginBottom: 60, cursor: 'pointer',
        textDecoration: 'none',
      }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
          letterSpacing: 2, color: 'var(--black)',
        }}>
          SEARCH A MARKET
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 18,
          color: 'var(--black)', opacity: 0.6,
        }}>→</span>
      </Link>

      {/* STATS GRID */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 2, marginBottom: 60,
      }}>
        {[
          { label: 'Searches Run', value: '0', sub: 'this month' },
          { label: 'Agents Scored', value: '0', sub: 'total' },
          { label: 'Hot Leads', value: '0', sub: 'identified' },
          { label: 'Markets Scanned', value: '0', sub: 'unique cities' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            padding: '28px 24px',
          }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 48,
              color: 'var(--white)', letterSpacing: 1, lineHeight: 1,
              marginBottom: 4,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: 'var(--white)', fontWeight: 500, marginBottom: 2,
            }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: 'var(--muted)', letterSpacing: 1,
            }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* RECENT SEARCHES PLACEHOLDER */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        padding: '40px',
      }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase',
          marginBottom: 32,
        }}>
          Recent Searches
        </div>
        <div style={{
          textAlign: 'center', padding: '40px 0',
        }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 48,
            color: 'var(--border-light)', marginBottom: 12,
          }}>
            NO SEARCHES YET
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
            Run your first market search to see results here.
          </div>
          <Link href="/dashboard/search" style={{
            padding: '12px 32px',
            background: 'transparent', border: '1px solid var(--orange)',
            color: 'var(--orange)',
            fontFamily: "'DM Mono', monospace", fontSize: 12,
            letterSpacing: 2, textTransform: 'uppercase',
            cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
          }}>
            Search Now
          </Link>
        </div>
      </div>
    </div>
  )
}
