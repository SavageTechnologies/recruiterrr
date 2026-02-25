import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import USMap from '@/components/USMap'
import SearchRow from '@/components/SearchRow'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName || 'there'

  // Fetch recent searches
  const { data: searches } = await supabase
    .from('searches')
    .select('*')
    .eq('clerk_id', user?.id || '')
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch recent prometheus scans
  const { data: scans } = await supabase
    .from('prometheus_scans')
    .select('id, domain, score, verdict, vendor_tier, is_shared_lead, created_at')
    .eq('clerk_id', user?.id || '')
    .order('created_at', { ascending: false })
    .limit(10)

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
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>TCPA SCAN →</span>
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

        {!scans?.length ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#2a2a2a', marginBottom: 12 }}>
              NO SCANS YET
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
              Scan a lead vendor domain to check TCPA compliance.
            </div>
            <Link href="/dashboard/prometheus" style={{ padding: '12px 32px', background: 'transparent', border: '1px solid var(--orange)', color: 'var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block' }}>
              Scan a Domain
            </Link>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 100px 120px', gap: 16, padding: '8px 16px', marginBottom: 4, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
              <div>Domain</div>
              <div>Tier</div>
              <div>Score</div>
              <div>Verdict</div>
              <div>Date</div>
            </div>
            {scans.map(scan => {
              const scoreColor = scan.score >= 75 ? 'var(--green)' : scan.score >= 45 ? 'var(--yellow)' : 'var(--red)'
              const verdictColor = scan.verdict === 'COMPLIANT' ? 'var(--green)' : scan.verdict === 'REVIEW NEEDED' ? 'var(--yellow)' : 'var(--red)'
              return (
                <Link
                  key={scan.id}
                  href={`/dashboard/prometheus?id=${scan.id}`}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 80px 100px 120px',
                    gap: 16, padding: '14px 16px',
                    background: 'var(--dark)', border: '1px solid var(--border)',
                    marginBottom: 2, textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {scan.domain}
                    {scan.is_shared_lead && (
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '2px 6px', border: '1px solid var(--red)', color: 'var(--red)', letterSpacing: 1 }}>SHARED</span>
                    )}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, alignSelf: 'center' }}>
                    {scan.vendor_tier || 'UNKNOWN'}
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: scoreColor, lineHeight: 1, alignSelf: 'center' }}>
                    {scan.score}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: verdictColor, letterSpacing: 1, alignSelf: 'center' }}>
                    {scan.verdict}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, alignSelf: 'center' }}>
                    {new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* RECENT SEARCHES */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
          Recent Searches
        </div>

        {!searches?.length ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#2a2a2a', marginBottom: 12 }}>
              NO SEARCHES YET
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
              Run your first market search to see results here.
            </div>
            <Link href="/dashboard/search" style={{ padding: '12px 32px', background: 'transparent', border: '1px solid var(--orange)', color: 'var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block' }}>
              Search Now
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 60px 60px 120px', gap: 16, padding: '8px 16px', marginBottom: 4, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
              <div>Market</div>
              <div>Agents</div>
              <div style={{ color: 'var(--green)' }}>Hot</div>
              <div style={{ color: 'var(--yellow)' }}>Warm</div>
              <div style={{ color: '#555' }}>Cold</div>
              <div>Date</div>
            </div>
            {searches.map((s) => (
              <SearchRow key={s.id} s={s} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
