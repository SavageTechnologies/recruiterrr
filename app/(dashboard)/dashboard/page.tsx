import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import USMap from '@/components/maps/USMap'
import PrometheusScansTable from '@/components/tables/PrometheusScansTable'
import AnathemaScansTable from '@/components/tables/AnathemaScansTable'
import SearchesTable from '@/components/tables/SearchesTable'
import { supabase } from '@/lib/supabase.server'

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName || 'there'

  // Fetch recent searches
  const { data: searches } = await supabase
    .from('searches')
    .select('*')
    .eq('clerk_id', user?.id || '')
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch recent prometheus scans — wrapped so a missing table/column doesn't crash the page
  let scans: any[] = []
  try {
    const { data: scansData, error: scansError } = await supabase
      .from('prometheus_scans')
      .select('id, domain, score, verdict, vendor_tier, is_shared_lead, created_at')
      .eq('clerk_id', user?.id || '')
      .order('created_at', { ascending: false })
      .limit(100)
    if (!scansError && scansData) scans = scansData
  } catch (_) {}

  // Fetch recent anathema specimens
  let specimens: any[] = []
  try {
    const { data: specimensData, error: specimensError } = await supabase
      .from('anathema_specimens')
      .select('id, agent_name, city, state, predicted_tree, predicted_confidence, confirmed_tree, created_at')
      .eq('clerk_id', user?.id || '')
      .order('created_at', { ascending: false })
      .limit(100)
    if (!specimensError && specimensData) specimens = specimensData
  } catch (_) {}

  const totalSearches = searches?.length || 0
  const totalAgents = searches?.reduce((sum, s) => sum + (s.results_count || 0), 0) || 0
  const totalHot = searches?.reduce((sum, s) => sum + (s.hot_count || 0), 0) || 0
  const uniqueStates = [...new Set(searches?.map(s => s.state) || [])].length

  const stateCounts: Record<string, number> = {}
  for (const s of searches || []) {
    stateCounts[s.state] = (stateCounts[s.state] || 0) + 1
  }

  return (
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

      {/* QUICK ACTIONS */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 48 }}>
        <Link href="/dashboard/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '20px 32px', background: 'var(--orange)', textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--black)' }}>
            SEARCH A MARKET
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: 'var(--black)', opacity: 0.6 }}>→</span>
        </Link>
        <Link href="/dashboard/prometheus" style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '20px 32px', background: 'var(--card)', border: '1px solid var(--border)', textDecoration: 'none', transition: 'border-color 0.15s' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--white)' }}>
            PROMETHEUS
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>FMO INTEL →</span>
        </Link>
        <Link href="/dashboard/anathema" style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '20px 32px', background: 'var(--card)', border: '1px solid var(--border)', textDecoration: 'none', transition: 'border-color 0.15s' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--white)' }}>
            ANATHEMA
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>STRAIN SCAN →</span>
        </Link>
        <Link href="/dashboard/david" style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '20px 32px', background: 'var(--card)', border: '1px solid var(--border)', textDecoration: 'none', transition: 'border-color 0.15s' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--white)' }}>
            DAVID
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>NETWORK →</span>
        </Link>
      </div>

      {/* STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 48 }}>
        {[
          { label: 'Searches Run', value: totalSearches, sub: 'total' },
          { label: 'Agents Scored', value: totalAgents, sub: 'total' },
          { label: 'Hot Leads', value: totalHot, sub: 'identified' },
          { label: 'States Covered', value: uniqueStates, sub: 'unique' },
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

      {/* MAP */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px', marginBottom: 48 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
          Search Coverage Map
        </div>
        <USMap stateCounts={stateCounts} />
      </div>

      {/* PROMETHEUS RECENT SCANS */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px', marginBottom: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Prometheus — Recent Scans
          </div>
          <Link href="/dashboard/prometheus" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none' }}>
            NEW SCAN →
          </Link>
        </div>
        <PrometheusScansTable scans={scans} />
      </div>

      {/* ANATHEMA RECENT SPECIMENS */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px', marginBottom: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Anathema — Recent Specimens
          </div>
          <Link href="/dashboard/anathema" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none' }}>
            NEW SCAN →
          </Link>
        </div>
        <AnathemaScansTable specimens={specimens} />
      </div>

      {/* RECENT SEARCHES */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
          Recent Searches
        </div>

        <SearchesTable searches={searches || []} />
      </div>

    </div>
  )
}
