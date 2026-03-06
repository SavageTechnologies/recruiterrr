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

  const isNewUser = totalSearches === 0

  return (
    <DashboardClient>
      <div style={{ padding: '36px 40px', maxWidth: 1280 }}>

        {/* ── TWO-ZONE LAYOUT ── */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          {/* ── LEFT: Work area ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Greeting + CTA */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 1px 4px var(--shadow-sm)',
              padding: '32px 36px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
            }}>
              <div>
                <div className="page-eyebrow">Welcome back</div>
                <h1 style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(40px, 5vw, 60px)',
                  letterSpacing: 2,
                  lineHeight: 0.95,
                  color: 'var(--text-1)',
                  marginBottom: 0,
                }}>
                  {firstName.toUpperCase()}
                  <span style={{ color: 'var(--orange)' }}>.</span>
                </h1>
              </div>

              <Link
                href="/dashboard/search"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 28px',
                  background: 'var(--orange)',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                  boxShadow: '0 2px 12px var(--orange-mid)',
                  flexShrink: 0,
                  transition: 'opacity 0.15s',
                }}
              >
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 20, letterSpacing: 2, color: 'white',
                }}>
                  SEARCH A MARKET
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.7)',
                }}>→</span>
              </Link>
            </div>

            {/* Recent Searches */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 1px 4px var(--shadow-sm)',
              overflow: 'hidden',
            }}>
              {/* Card header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div className="section-label section-label-muted">
                  Recent Searches
                </div>
                <Link href="/dashboard/search" style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: 'var(--orange)',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}>
                  NEW SEARCH →
                </Link>
              </div>

              <div style={{ padding: '8px 10px 16px' }}>
                <SearchesTable searches={searches || []} />
              </div>
            </div>

          </div>

          {/* ── RIGHT: Stats sidebar ── */}
          <div style={{ width: 240, flexShrink: 0 }}>

            {/* Stat cards */}
            {[
              { label: 'Searches Run',   value: totalSearches, sub: 'total',      accent: false },
              { label: 'Agents Scored',  value: totalAgents,   sub: 'total',      accent: false },
              { label: 'Hot Leads',      value: totalHot,      sub: 'identified', accent: true  },
              { label: 'States Covered', value: uniqueStates,  sub: 'unique',     accent: false },
            ].map(s => (
              <div key={s.label} className="dash-stat-card" style={{ marginBottom: 8 }}>
                <div
                  className={`dash-stat-value${s.accent ? ' dash-stat-value-accent' : ''}`}
                  style={{ fontSize: 42 }}
                >
                  {s.value}
                </div>
                <div className="dash-stat-label">{s.label}</div>
                <div className="dash-stat-sub">{s.sub}</div>
              </div>
            ))}

            {/* Zero-state nudge */}
            {isNewUser && (
              <div style={{
                marginTop: 4,
                padding: '14px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                borderLeft: '3px solid var(--orange)',
              }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  color: 'var(--text-3)',
                  letterSpacing: 1.5,
                  lineHeight: 1.7,
                }}>
                  Your numbers grow with every search. Run your first market to get started.
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </DashboardClient>
  )
}
