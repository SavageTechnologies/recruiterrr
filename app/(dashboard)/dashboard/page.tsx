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
      <div style={{ padding: '60px 40px', maxWidth: 1200 }}>

        {/* GREETING */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
            Welcome back
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 6vw, 80px)', letterSpacing: 2, lineHeight: 0.9, color: 'var(--white)' }}>
            {firstName.toUpperCase()}<span style={{ color: 'var(--orange)' }}>.</span>
          </h1>
        </div>

        {/* SINGLE CTA */}
        <div style={{ marginBottom: 48 }}>
          <Link
            href="/dashboard/search"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '20px 40px', background: 'var(--orange)', textDecoration: 'none' }}
          >
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--black)' }}>
              SEARCH A MARKET
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: 'var(--black)', opacity: 0.6 }}>→</span>
          </Link>
        </div>

        {/* STATS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 48 }}>
          {[
            { label: 'Searches Run',   value: totalSearches, sub: 'total' },
            { label: 'Agents Scored',  value: totalAgents,   sub: 'total' },
            { label: 'Hot Leads',      value: totalHot,      sub: 'identified' },
            { label: 'States Covered', value: uniqueStates,  sub: 'unique' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: 'var(--white)', letterSpacing: 1, lineHeight: 1, marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--white)', fontWeight: 500, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* RECENT SEARCHES */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
              Recent Searches
            </div>
            <Link
              href="/dashboard/search"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none' }}
            >
              NEW SEARCH →
            </Link>
          </div>
          <SearchesTable searches={searches || []} />
        </div>

      </div>
    </DashboardClient>
  )
}
