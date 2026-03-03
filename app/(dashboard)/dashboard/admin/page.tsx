'use client'

import { useState, useEffect } from 'react'

// ─── COST MODEL ───────────────────────────────────────────────────────────────
// Based on actual API calls per operation (see route analysis)
const COSTS = {
  search:     0.003,   // Sonnet 4.6 — ~500 input + 500 output tokens per enrichment
  anathema:   0.050,   // Sonnet 4.6 tree prediction + Haiku david-facts + optional upline hunter
  prometheus: 0.150,   // Sonnet 4.6 — ~25k input + 5k output tokens per FMO scan
  revenue:    799.95,  // Monthly subscription
}

function costForUser(u: UserStat): number {
  return (u.searches_total * COSTS.search) + (u.anathema_total * COSTS.anathema) + (u.prometheus_total * COSTS.prometheus)
}

function marginForUser(u: UserStat): number {
  const cost = costForUser(u)
  return ((COSTS.revenue - cost) / COSTS.revenue) * 100
}

function marginColor(margin: number): string {
  if (margin >= 70) return '#00e676'
  if (margin >= 40) return '#ff5500'
  return '#ff1744'
}

function fmt$(n: number): string {
  return '$' + n.toFixed(2)
}

function fmtPct(n: number): string {
  return n.toFixed(1) + '%'
}

function timeAgo(ts: string | null): string {
  if (!ts) return 'never'
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

type GlobalStats = {
  total_users: number
  total_searches: number
  searches_today: number
  searches_week: number
  total_anathema: number
  anathema_today: number
  total_prometheus: number
  total_profiles: number
  profiles_with_anathema: number
  integrity_count: number
  amerilife_count: number
  sms_count: number
  unknown_count: number
}

type UserStat = {
  clerk_id: string
  email: string
  name: string | null
  joined: string
  searches_total: number
  searches_today: number
  searches_week: number
  anathema_total: number
  anathema_today: number
  prometheus_total: number
  profiles_total: number
  last_active: string | null
  recent_searches: Array<{ city: string; state: string; results: number; at: string }>
}

type ActivityItem = {
  type: string
  user_email: string
  detail: string
  at: string
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: 2,
      padding: '2px 6px', border: `1px solid ${color}`, color,
    }}>{label}</span>
  )
}

function KPI({ label, value, sub, color, accent }: {
  label: string; value: string | number; sub?: string; color?: string; accent?: string
}) {
  return (
    <div style={{
      padding: '20px 24px', background: '#0c0b09',
      border: '1px solid #1c1a16',
      borderTop: `2px solid ${accent || color || '#333'}`,
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 36,
        color: color || '#f0ede8', lineHeight: 1, marginBottom: 6,
      }}>
        {value}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, textTransform: 'uppercase' }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 1, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function CostBar({ searches, anathema, prometheus }: { searches: number; anathema: number; prometheus: number }) {
  const total = searches + anathema + prometheus
  if (total === 0) return (
    <div style={{ height: 4, background: '#111', width: '100%' }} />
  )
  return (
    <div style={{ display: 'flex', height: 4, width: '100%', overflow: 'hidden', gap: 1 }}>
      {searches > 0 && <div style={{ flex: searches / total, background: '#4fc3f7', minWidth: 2 }} title={`Search: ${fmt$(searches)}`} />}
      {anathema > 0 && <div style={{ flex: anathema / total, background: '#00e676', minWidth: 2 }} title={`Anathema: ${fmt$(anathema)}`} />}
      {prometheus > 0 && <div style={{ flex: prometheus / total, background: '#ff5500', minWidth: 2 }} title={`Prometheus: ${fmt$(prometheus)}`} />}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [data, setData] = useState<{ global: GlobalStats; users: UserStat[]; recent_activity: ActivityItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'activity' | 'cost' | 'margin' | 'searches' | 'anathema' | 'prometheus'>('activity')
  const [tab, setTab] = useState<'users' | 'activity' | 'economics'>('users')

  useEffect(() => {
    fetch('/api/admin')
      .then(r => {
        if (r.status === 403) throw new Error('FORBIDDEN')
        if (!r.ok) throw new Error('FAILED')
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#2a2a2a', letterSpacing: 3 }}>
      <div>
        <div style={{ marginBottom: 12 }}>LOADING INTEL...</div>
        <div style={{ height: 1, background: '#111', width: 200, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: '#ff5500', animation: 'slide 1s ease-in-out infinite' }} />
        </div>
      </div>
      <style>{`@keyframes slide { 0%{left:-40%} 100%{left:100%} }`}</style>
    </div>
  )

  if (error === 'FORBIDDEN') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, color: '#1a1a1a', letterSpacing: 6 }}>DENIED</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 3, marginTop: 8 }}>ADMIN CLEARANCE REQUIRED</div>
      </div>
    </div>
  )

  if (!data) return null

  const { global: g, users, recent_activity } = data

  // ── Economics ──────────────────────────────────────────────────────────────
  const totalRevenue = users.length * COSTS.revenue
  const totalApiCost = users.reduce((sum, u) => sum + costForUser(u), 0)
  const totalSearchCost = users.reduce((sum, u) => sum + u.searches_total * COSTS.search, 0)
  const totalAnathemaCost = users.reduce((sum, u) => sum + u.anathema_total * COSTS.anathema, 0)
  const totalPrometheusCost = users.reduce((sum, u) => sum + u.prometheus_total * COSTS.prometheus, 0)
  const avgCostPerUser = users.length > 0 ? totalApiCost / users.length : 0
  const overallMargin = totalRevenue > 0 ? ((totalRevenue - totalApiCost) / totalRevenue) * 100 : 0
  const avgAnathemaPerUser = users.length > 0 ? g.total_anathema / users.length : 0
  const avgPrometheusPerUser = users.length > 0 ? g.total_prometheus / users.length : 0
  const avgSearchesPerUser = users.length > 0 ? g.total_searches / users.length : 0

  // Projected monthly costs (extrapolate from current pace)
  // Using same data as a monthly average since we don't have date range from API
  const projectedMonthlyCostPerUser = avgCostPerUser  // already cumulative
  const breakEvenScansAnathema = Math.floor(COSTS.revenue / COSTS.anathema)
  const breakEvenScanPrometheus = Math.floor(COSTS.revenue / COSTS.prometheus)

  // ── Sorted users ───────────────────────────────────────────────────────────
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'cost') return costForUser(b) - costForUser(a)
    if (sortBy === 'margin') return marginForUser(a) - marginForUser(b)
    if (sortBy === 'searches') return b.searches_total - a.searches_total
    if (sortBy === 'anathema') return b.anathema_total - a.anathema_total
    if (sortBy === 'prometheus') return b.prometheus_total - a.prometheus_total
    return (b.last_active || '').localeCompare(a.last_active || '')
  })

  const TOOL_NAV = [
    { href: '/dashboard/search', label: 'SEARCH', color: '#4fc3f7', stats: `${g.total_searches} total · ${g.searches_today} today` },
    { href: '/dashboard/prometheus', label: 'PROMETHEUS', color: '#ff5500', stats: `${g.total_prometheus} total` },
    { href: '/dashboard/anathema', label: 'ANATHEMA', color: '#00e676', stats: `${g.total_anathema} total · ${g.anathema_today} today` },
    { href: '/dashboard/admin/adspy', label: 'MEREDITH', color: '#38bdf8', stats: 'Ad Library scanner' },
    { href: '/dashboard/david', label: 'DAVID', color: '#a78bfa', stats: 'Agent intelligence' },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <style>{`
        @keyframes slide { 0%{left:-40%} 100%{left:100%} }
        .user-row:hover { background: #0a0a08 !important; }
        .sort-btn:hover { color: #f0ede8 !important; }
        .tab-btn { transition: all 0.15s; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#ff5500', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
            Admin · Command Center
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 3, color: '#f0ede8', lineHeight: 1 }}>
            RECRUITERRR INTEL
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#00e676', letterSpacing: 2 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── TOOL LAUNCHER ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 28, flexWrap: 'wrap' }}>
        {TOOL_NAV.map(t => (
          <a key={t.label} href={t.href} style={{
            padding: '10px 18px', background: '#0c0b09',
            border: `1px solid #1c1a16`, borderBottom: `2px solid ${t.color}`,
            textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 3,
            transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = t.color)}
            onMouseLeave={e => (e.currentTarget.style.borderBottom = `2px solid ${t.color}`)}
          >
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, color: t.color }}>{t.label} →</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 1 }}>{t.stats}</div>
          </a>
        ))}
      </div>

      {/* ── TOP KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, marginBottom: 2 }}>
        <KPI label="Users" value={g.total_users} color="#f0ede8" accent="#ff5500" />
        <KPI label="MRR" value={fmt$(totalRevenue)} color="#00e676" accent="#00e676" sub="projected" />
        <KPI label="Total API Cost" value={fmt$(totalApiCost)} color="#ff5500" accent="#ff5500" sub="cumulative" />
        <KPI label="Avg Cost / User" value={fmt$(avgCostPerUser)} color="#f0ede8" accent="#333" />
        <KPI label="Overall Margin" value={fmtPct(overallMargin)} color={marginColor(overallMargin)} accent={marginColor(overallMargin)} />
        <KPI label="Net Revenue" value={fmt$(totalRevenue - totalApiCost)} color="#00e676" accent="#00e676" sub="after API costs" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, marginBottom: 28 }}>
        <KPI label="Searches" value={g.total_searches} color="#4fc3f7" sub={`${g.searches_today} today`} />
        <KPI label="Search Cost" value={fmt$(totalSearchCost)} color="#4fc3f7" sub={`${fmt$(COSTS.search)} each`} />
        <KPI label="Anathema Scans" value={g.total_anathema} color="#00e676" sub={`${g.anathema_today} today`} />
        <KPI label="Anathema Cost" value={fmt$(totalAnathemaCost)} color="#00e676" sub={`${fmt$(COSTS.anathema)} each`} />
        <KPI label="Prometheus Runs" value={g.total_prometheus} color="#ff5500" />
        <KPI label="Prometheus Cost" value={fmt$(totalPrometheusCost)} color="#ff5500" sub={`${fmt$(COSTS.prometheus)} each`} />
      </div>

      {/* ── BREAKEVEN CALLOUTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 28 }}>
        <div style={{ padding: '16px 20px', background: '#0c0b09', border: '1px solid #1c1a16' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 8 }}>BREAKEVEN — ANATHEMA</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#00e676' }}>{breakEvenScansAnathema} scans</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', marginTop: 4 }}>per user per month to fully consume $799.95</div>
        </div>
        <div style={{ padding: '16px 20px', background: '#0c0b09', border: '1px solid #1c1a16' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 8 }}>BREAKEVEN — PROMETHEUS</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#ff5500' }}>{breakEvenScanPrometheus} scans</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', marginTop: 4 }}>per user per month to fully consume $799.95</div>
        </div>
        <div style={{ padding: '16px 20px', background: '#0c0b09', border: '1px solid #1c1a16' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 8 }}>AVG USAGE PER USER</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#4fc3f7' }}>{avgSearchesPerUser.toFixed(0)}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 1 }}>SEARCHES</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#00e676' }}>{avgAnathemaPerUser.toFixed(0)}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 1 }}>ANATHEMA</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#ff5500' }}>{avgPrometheusPerUser.toFixed(0)}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 1 }}>PROMETHEUS</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
        {(['users', 'economics', 'activity'] as const).map(t => (
          <button
            key={t}
            className="tab-btn"
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', border: '1px solid #1c1a16',
              background: tab === t ? '#ff5500' : '#0c0b09',
              color: tab === t ? '#000' : '#444',
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            {t === 'users' ? `USERS (${users.length})` : t === 'activity' ? `ACTIVITY (${recent_activity.length})` : 'ECONOMICS'}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div>
          {/* Sort controls */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 2, marginRight: 6 }}>SORT:</span>
            {(['activity', 'cost', 'margin', 'searches', 'anathema', 'prometheus'] as const).map(s => (
              <button
                key={s}
                className="sort-btn"
                onClick={() => setSortBy(s)}
                style={{
                  padding: '4px 10px', border: `1px solid ${sortBy === s ? '#ff5500' : '#1c1a16'}`,
                  background: sortBy === s ? 'rgba(255,85,0,0.1)' : 'transparent',
                  color: sortBy === s ? '#ff5500' : '#333',
                  fontFamily: "'DM Mono', monospace", fontSize: 8,
                  letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 80px 80px 80px 90px 90px 100px',
            gap: 8, padding: '8px 16px',
            borderBottom: '1px solid #1a1814',
            fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 2,
          }}>
            <div>USER</div>
            <div>SEARCHES</div>
            <div>ANATHEMA</div>
            <div>PROMETHEUS</div>
            <div>API COST</div>
            <div>MARGIN</div>
            <div>COST BREAKDOWN</div>
          </div>

          {sortedUsers.map(u => {
            const isExpanded = expandedUser === u.clerk_id
            const cost = costForUser(u)
            const margin = marginForUser(u)
            const searchCost = u.searches_total * COSTS.search
            const anathemaCost = u.anathema_total * COSTS.anathema
            const prometheusCost = u.prometheus_total * COSTS.prometheus
            const isActive = u.last_active && (Date.now() - new Date(u.last_active).getTime()) < 3600000

            return (
              <div key={u.clerk_id} style={{ borderBottom: '1px solid #111' }}>
                <div
                  className="user-row"
                  onClick={() => setExpandedUser(isExpanded ? null : u.clerk_id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 80px 80px 80px 90px 90px 100px',
                    gap: 8, padding: '14px 16px', cursor: 'pointer',
                    background: 'transparent', transition: 'background 0.1s',
                    alignItems: 'center',
                  }}
                >
                  {/* User */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00e676', flexShrink: 0 }} />}
                      <span style={{ fontSize: 13, color: '#f0ede8', fontWeight: 500 }}>
                        {u.name || u.email.split('@')[0]}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 0.5 }}>
                      {u.email} · {timeAgo(u.last_active)}
                    </div>
                  </div>

                  {/* Searches */}
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: u.searches_total > 0 ? '#4fc3f7' : '#222', lineHeight: 1 }}>
                      {u.searches_total}
                    </div>
                    {u.searches_today > 0 && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#4fc3f7', letterSpacing: 1 }}>+{u.searches_today} today</div>
                    )}
                  </div>

                  {/* Anathema */}
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: u.anathema_total > 0 ? '#00e676' : '#222', lineHeight: 1 }}>
                      {u.anathema_total}
                    </div>
                    {u.anathema_today > 0 && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#00e676', letterSpacing: 1 }}>+{u.anathema_today} today</div>
                    )}
                  </div>

                  {/* Prometheus */}
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: u.prometheus_total > 0 ? '#ff5500' : '#222', lineHeight: 1 }}>
                      {u.prometheus_total}
                    </div>
                  </div>

                  {/* API Cost */}
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: cost > 400 ? '#ff1744' : cost > 100 ? '#ff5500' : '#f0ede8', lineHeight: 1 }}>
                      {fmt$(cost)}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 1 }}>
                      of $799.95
                    </div>
                  </div>

                  {/* Margin */}
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: marginColor(margin), lineHeight: 1 }}>
                      {fmtPct(margin)}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 1 }}>
                      {fmt$(COSTS.revenue - cost)} net
                    </div>
                  </div>

                  {/* Cost bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <CostBar searches={searchCost} anathema={anathemaCost} prometheus={prometheusCost} />
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 0.5 }}>
                      S:{fmt$(searchCost)} A:{fmt$(anathemaCost)} P:{fmt$(prometheusCost)}
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div style={{ padding: '12px 16px 20px', background: '#080806', borderTop: '1px solid #111' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

                      {/* Cost breakdown */}
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 2, marginBottom: 10 }}>COST BREAKDOWN</div>
                        {[
                          { label: 'Search', count: u.searches_total, rate: COSTS.search, cost: searchCost, color: '#4fc3f7' },
                          { label: 'Anathema', count: u.anathema_total, rate: COSTS.anathema, cost: anathemaCost, color: '#00e676' },
                          { label: 'Prometheus', count: u.prometheus_total, rate: COSTS.prometheus, cost: prometheusCost, color: '#ff5500' },
                        ].map(r => (
                          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 4, height: 4, background: r.color }} />
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555' }}>{r.label}</span>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333' }}>×{r.count} @ {fmt$(r.rate)}</span>
                            </div>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: r.color }}>{fmt$(r.cost)}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444' }}>TOTAL COST</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#f0ede8' }}>{fmt$(cost)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444' }}>NET (after API)</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: marginColor(margin) }}>{fmt$(COSTS.revenue - cost)}</span>
                        </div>
                      </div>

                      {/* Profitability signal */}
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 2, marginBottom: 10 }}>PROFITABILITY SIGNAL</div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: marginColor(margin), lineHeight: 1, marginBottom: 4 }}>
                          {fmtPct(margin)}
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', lineHeight: 1.6 }}>
                          {margin >= 70 && '✦ Healthy — well within safe zone'}
                          {margin >= 40 && margin < 70 && '◈ Watch — usage is climbing'}
                          {margin < 40 && margin >= 0 && '⚠ Warning — approaching breakeven'}
                          {margin < 0 && '✕ Unprofitable — costing you money'}
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', marginTop: 8, lineHeight: 1.7 }}>
                          Breakeven at {Math.floor(COSTS.revenue / COSTS.anathema)} anathema scans<br />
                          or {Math.floor(COSTS.revenue / COSTS.prometheus)} prometheus runs/mo
                        </div>
                      </div>

                      {/* Recent searches */}
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 2, marginBottom: 10 }}>RECENT SEARCHES</div>
                        {u.recent_searches.length === 0 ? (
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#222' }}>No searches yet</div>
                        ) : u.recent_searches.map((s, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555' }}>
                              {s.city}, {s.state} — {s.results} agents
                            </span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333' }}>
                              {new Date(s.at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {users.length === 0 && (
            <div style={{ padding: '60px 16px', textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#1a1a1a', letterSpacing: 3 }}>
              NO USERS YET
            </div>
          )}
        </div>
      )}

      {/* ── ECONOMICS TAB ── */}
      {tab === 'economics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Revenue vs cost summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <div style={{ padding: '28px 28px', background: '#0c0b09', border: '1px solid #1c1a16', borderTop: '2px solid #00e676' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 12 }}>MONTHLY REVENUE</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: '#00e676', lineHeight: 1 }}>{fmt$(totalRevenue)}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', marginTop: 6 }}>{users.length} users × $799.95</div>
            </div>
            <div style={{ padding: '28px 28px', background: '#0c0b09', border: '1px solid #1c1a16', borderTop: '2px solid #ff5500' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 12 }}>TOTAL API COST</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: '#ff5500', lineHeight: 1 }}>{fmt$(totalApiCost)}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', marginTop: 6 }}>cumulative across all users</div>
            </div>
            <div style={{ padding: '28px 28px', background: '#0c0b09', border: '1px solid #1c1a16', borderTop: `2px solid ${marginColor(overallMargin)}` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 12 }}>NET (API MARGIN ONLY)</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: marginColor(overallMargin), lineHeight: 1 }}>{fmt$(totalRevenue - totalApiCost)}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', marginTop: 6 }}>{fmtPct(overallMargin)} margin</div>
            </div>
          </div>

          {/* Cost by product */}
          <div style={{ padding: '24px 28px', background: '#0c0b09', border: '1px solid #1c1a16' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 16 }}>COST BREAKDOWN BY PRODUCT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { label: 'SEARCH', total: totalSearchCost, count: g.total_searches, rate: COSTS.search, color: '#4fc3f7' },
                { label: 'ANATHEMA', total: totalAnathemaCost, count: g.total_anathema, rate: COSTS.anathema, color: '#00e676' },
                { label: 'PROMETHEUS', total: totalPrometheusCost, count: g.total_prometheus, rate: COSTS.prometheus, color: '#ff5500' },
              ].map(p => {
                const pct = totalApiCost > 0 ? (p.total / totalApiCost) * 100 : 0
                return (
                  <div key={p.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: p.color, letterSpacing: 2 }}>{p.label}</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#f0ede8' }}>{fmt$(p.total)}</div>
                    </div>
                    <div style={{ height: 3, background: '#111', marginBottom: 8 }}>
                      <div style={{ height: '100%', background: p.color, width: `${pct}%`, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 1 }}>
                      {p.count} runs × {fmt$(p.rate)} · {fmtPct(pct)} of total cost
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Per-user profitability ranking */}
          <div style={{ padding: '24px 28px', background: '#0c0b09', border: '1px solid #1c1a16' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 16 }}>
              PER-USER PROFITABILITY RANKING
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...users].sort((a, b) => marginForUser(a) - marginForUser(b)).map(u => {
                const cost = costForUser(u)
                const margin = marginForUser(u)
                const barWidth = Math.min(100, (cost / COSTS.revenue) * 100)
                return (
                  <div key={u.clerk_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#666' }}>
                        {u.email}
                      </span>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#ff5500' }}>{fmt$(cost)}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: marginColor(margin), minWidth: 50, textAlign: 'right' }}>{fmtPct(margin)}</span>
                      </div>
                    </div>
                    <div style={{ height: 3, background: '#111' }}>
                      <div style={{ height: '100%', background: marginColor(margin), width: `${barWidth}%`, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
              {users.length === 0 && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#222' }}>No users yet</div>
              )}
            </div>
          </div>

          {/* Scenario modeler */}
          <div style={{ padding: '24px 28px', background: '#0c0b09', border: '1px solid #1c1a16' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 16 }}>
              SCALE PROJECTIONS — WHAT IF YOU HAD MORE USERS?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2 }}>
              {[5, 10, 25, 50, 100].map(n => {
                const rev = n * COSTS.revenue
                const cost = n * avgCostPerUser
                const net = rev - cost
                const margin = rev > 0 ? (net / rev) * 100 : 0
                return (
                  <div key={n} style={{ padding: '16px', background: '#08080a', border: '1px solid #111' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#f0ede8', lineHeight: 1, marginBottom: 4 }}>{n}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 1, marginBottom: 10 }}>USERS</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#00e676' }}>{fmt$(rev)}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 1, marginBottom: 4 }}>REVENUE</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#ff5500' }}>{fmt$(cost)}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 1, marginBottom: 4 }}>API COST</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: marginColor(margin) }}>{fmt$(net)}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 1 }}>NET · {fmtPct(margin)}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 1, marginTop: 10 }}>
              ◎ Projections use current avg cost per user ({fmt$(avgCostPerUser)}). Actual costs will vary with usage patterns.
            </div>
          </div>

        </div>
      )}

      {/* ── ACTIVITY TAB ── */}
      {tab === 'activity' && (
        <div style={{ border: '1px solid #1a1814' }}>
          {recent_activity.map((a, i) => {
            const colors: Record<string, string> = { SEARCH: '#4fc3f7', ANATHEMA: '#00e676', PROMETHEUS: '#ff5500' }
            const color = colors[a.type] || '#444'
            return (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #111', display: 'grid', gridTemplateColumns: '80px 1fr 140px', gap: 16, alignItems: 'center' }}>
                <Pill label={a.type} color={color} />
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', marginBottom: 2 }}>{a.user_email}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333' }}>{a.detail}</div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1, textAlign: 'right' }}>
                  {new Date(a.at).toLocaleDateString()} {new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )
          })}
          {recent_activity.length === 0 && (
            <div style={{ padding: '60px 16px', textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#1a1a1a', letterSpacing: 3 }}>
              NO ACTIVITY YET
            </div>
          )}
        </div>
      )}

    </div>
  )
}
