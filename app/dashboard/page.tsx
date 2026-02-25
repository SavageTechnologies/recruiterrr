import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import USMap from '@/components/USMap'

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

  const totalSearches = searches?.length || 0
  const totalAgents = searches?.reduce((sum, s) => sum + (s.results_count || 0), 0) || 0
  const totalHot = searches?.reduce((sum, s) => sum + (s.hot_count || 0), 0) || 0
  const uniqueStates = [...new Set(searches?.map(s => s.state) || [])].length

  // Build state search counts for map
  const stateCounts: Record<string, number> = {}
  for (const s of searches || []) {
    stateCounts[s.state] = (stateCounts[s.state] || 0) + 1
  }

  return (
    <div style={{ padding: '60px 40px', maxWidth: 1200 }}>
      {/* GREETING */}
      <div style={{ marginBottom: 48 }}>
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
          letterSpacing: 2, lineHeight: 0.9, color: 'var(--white)',
        }}>
          {firstName.toUpperCase()}<span style={{ color: 'var(--orange)' }}>.</span>
        </h1>
      </div>

      {/* QUICK ACTION */}
      <Link href="/dashboard/search" style={{
        display: 'inline-flex', alignItems: 'center', gap: 16,
        padding: '20px 32px', background: 'var(--orange)',
        marginBottom: 48, textDecoration: 'none',
      }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
          letterSpacing: 2, color: 'var(--black)',
        }}>
          SEARCH A MARKET
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: 'var(--black)', opacity: 0.6 }}>→</span>
      </Link>

      {/* STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 48 }}>
        {[
          { label: 'Searches Run', value: totalSearches, sub: 'total' },
          { label: 'Agents Scored', value: totalAgents, sub: 'total' },
          { label: 'Hot Leads', value: totalHot, sub: 'identified' },
          { label: 'States Covered', value: uniqueStates, sub: 'unique' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            padding: '28px 24px',
          }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 48,
              color: 'var(--white)', letterSpacing: 1, lineHeight: 1, marginBottom: 4,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--white)', fontWeight: 500, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* MAP */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        padding: '32px', marginBottom: 48,
      }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase',
          marginBottom: 24,
        }}>
          Search Coverage Map
        </div>
        <USMap stateCounts={stateCounts} />
      </div>

      {/* RECENT SEARCHES */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px' }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase',
          marginBottom: 24,
        }}>
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
            <Link href="/dashboard/search" style={{
              padding: '12px 32px', background: 'transparent',
              border: '1px solid var(--orange)', color: 'var(--orange)',
              fontFamily: "'DM Mono', monospace", fontSize: 12,
              letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block',
            }}>
              Search Now
            </Link>
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 60px 60px 60px 120px',
              gap: 16, padding: '8px 16px', marginBottom: 4,
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase',
            }}>
              <div>Market</div>
              <div>Agents</div>
              <div style={{ color: 'var(--green)' }}>Hot</div>
              <div style={{ color: 'var(--yellow)' }}>Warm</div>
              <div style={{ color: '#555' }}>Cold</div>
              <div>Date</div>
            </div>

            {searches.map((s, i) => (
              <Link
                key={s.id}
                href={`/dashboard/search?city=${encodeURIComponent(s.city)}&state=${s.state}`}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 60px 60px 60px 120px',
                  gap: 16, padding: '14px 16px',
                  borderTop: '1px solid var(--border)',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e: any) => e.currentTarget.style.background = '#1a1a1a'}
                onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>
                  {s.city}, {s.state}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--white)' }}>
                  {s.results_count}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--green)' }}>
                  {s.hot_count}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--yellow)' }}>
                  {s.warm_count}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#555' }}>
                  {s.cold_count}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
