import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import SearchesTable from '@/components/tables/SearchesTable'
import { supabase } from '@/lib/supabase.server'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName || 'there'

  const { data: searches } = await supabase
    .from('searches')
    .select('*')
    .eq('clerk_id', user?.id || '')
    .order('created_at', { ascending: false })
    .limit(100)

  const totalSearches = searches?.length || 0
  const totalAgents   = searches?.reduce((sum, s) => sum + (s.results_count || 0), 0) || 0
  const totalHot      = searches?.reduce((sum, s) => sum + (s.hot_count || 0), 0) || 0
  const uniqueStates  = [...new Set(searches?.map(s => s.state) || [])].length

  return (
    <DashboardClient>
      <div style={{ padding: '36px 40px', maxWidth: 1200 }}>

        {/* GREETING */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 'var(--text-xs)',
            color: 'var(--text-3)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10,
          }}>
            Welcome back
          </div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(48px, 6vw, 72px)',
            letterSpacing: 2, lineHeight: 0.9, color: 'var(--text-1)',
          }}>
            {firstName.toUpperCase()}<span style={{ color: 'var(--orange)' }}>.</span>
          </h1>
        </div>

        {/* PRIMARY CTA */}
        <div style={{ marginBottom: 40 }}>
          <Link
            href="/dashboard/search"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 16,
              padding: '16px 36px', background: 'var(--orange)',
              borderRadius: 'var(--radius)', textDecoration: 'none',
              boxShadow: '0 2px 12px var(--orange-mid)',
              opacity: 1,
            }}
          >
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 22, letterSpacing: 2, color: 'white',
            }}>
              SEARCH A MARKET
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>→</span>
          </Link>
        </div>

        {/* STATS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 40 }}>
          {[
            { label: 'Searches Run',   value: totalSearches, sub: 'total' },
            { label: 'Agents Scored',  value: totalAgents,   sub: 'total' },
            { label: 'Hot Leads',      value: totalHot,      sub: 'identified', accent: true },
            { label: 'States Covered', value: uniqueStates,  sub: 'unique' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px 22px',
              boxShadow: '0 1px 4px var(--shadow-sm)',
            }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 48,
                color: s.accent ? 'var(--sig-green)' : 'var(--text-1)',
                letterSpacing: 1, lineHeight: 1, marginBottom: 5,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-1)', fontWeight: 500, marginBottom: 2 }}>
                {s.label}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                color: 'var(--text-3)', letterSpacing: 1,
              }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* RECENT SEARCHES */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '28px 28px',
          boxShadow: '0 1px 4px var(--shadow-sm)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 'var(--text-xs)',
              color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase',
            }}>
              Recent Searches
            </div>
            <Link href="/dashboard/search" style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              NEW SEARCH →
            </Link>
          </div>
          <SearchesTable searches={searches || []} />
        </div>

      </div>
    </DashboardClient>
  )
}
