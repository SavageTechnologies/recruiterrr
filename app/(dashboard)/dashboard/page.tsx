import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import SearchesTable from '@/components/tables/SearchesTable'
import { supabase } from '@/lib/supabase.server'
import DashboardClient from '@/components/dashboard/DashboardClient'
import DashboardGreeting from '@/components/dashboard/DashboardGreeting'

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName || 'there'

  const { data: searches } = await supabase
    .from('searches')
    .select('*')
    .eq('clerk_id', user?.id || '')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <DashboardClient>
      <div style={{ padding: '40px 40px', maxWidth: 1000 }}>

        {/* ── GREETING ── */}
        <DashboardGreeting firstName={firstName} />

        {/* ── PRIMARY CTA ── */}
        <div style={{ marginBottom: 40 }}>
          <Link
            href="/dashboard/search"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 36px',
              background: 'var(--orange)',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              boxShadow: '0 2px 16px var(--orange-mid)',
            }}
          >
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 22, letterSpacing: 2, color: 'white',
            }}>
              SEARCH A MARKET
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 15, color: 'rgba(255,255,255,0.7)',
            }}>→</span>
          </Link>
        </div>

        {/* ── RECENT SEARCHES ── */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 1px 4px var(--shadow-sm)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div className="section-label section-label-muted">Recent Searches</div>
            <Link href="/dashboard/search" style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, color: 'var(--orange)',
              letterSpacing: 2, textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              NEW SEARCH →
            </Link>
          </div>
          <div style={{ padding: '8px 10px 16px' }}>
            <SearchesTable searches={searches || []} />
          </div>
        </div>

      </div>
    </DashboardClient>
  )
}
