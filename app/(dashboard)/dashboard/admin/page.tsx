'use client'

import { useState, useEffect } from 'react'

// ─── COST MODEL ───────────────────────────────────────────────────────────────
const COSTS = {
  search:     0.003,
  anathema:   0.035,
  prometheus: 0.150,
  revenue:    parseFloat(process.env.NEXT_PUBLIC_PRO_PRICE_DISPLAY || '499.95'),
}

function costForUser(u: UserStat): number {
  return (u.searches_month * COSTS.search) + (u.anathema_month * COSTS.anathema) + (u.prometheus_month * COSTS.prometheus)
}

function marginForUser(u: UserStat): number {
  if (!u.is_paying) return 100
  const cost = costForUser(u)
  return ((COSTS.revenue - cost) / COSTS.revenue) * 100
}

function marginColor(margin: number): string {
  if (margin >= 70) return 'var(--sig-green)'
  if (margin >= 40) return 'var(--orange)'
  return 'var(--sig-red)'
}

function fmt$(n: number): string { return '$' + n.toFixed(2) }
function fmtPct(n: number): string { return n.toFixed(1) + '%' }

function timeAgo(ts: string | null): string {
  if (!ts) return 'never'
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

type GlobalStats = {
  total_users: number; paying_users: number
  total_searches: number; searches_today: number; searches_week: number; searches_month: number
  total_anathema: number; anathema_today: number; anathema_month: number
  total_prometheus: number; prometheus_month: number
  integrity_count: number; amerilife_count: number; sms_count: number; unknown_count: number
}

type UserStat = {
  clerk_id: string; email: string; name: string | null
  plan: string; subscription_status: string; is_paying: boolean
  joined: string
  searches_total: number; searches_today: number; searches_week: number; searches_month: number
  anathema_total: number; anathema_today: number; anathema_month: number
  prometheus_total: number; prometheus_month: number
  last_active: string | null
  recent_searches: Array<{ city: string; state: string; results: number; at: string }>
}

type ActivityItem = { type: string; user_email: string; detail: string; at: string }

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function KPI({ label, value, sub, color, accent }: {
  label: string; value: string | number; sub?: string; color?: string; accent?: string
}) {
  return (
    <div style={{
      padding: '18px 20px', background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      borderTop: `3px solid ${accent || color || 'var(--border)'}`,
    }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, color: color || 'var(--text-1)', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function CostBar({ searches, anathema, prometheus }: { searches: number; anathema: number; prometheus: number }) {
  const total = searches + anathema + prometheus
  if (total === 0) return <div style={{ height: 4, background: 'var(--bg)', width: '100%', borderRadius: 2 }} />
  return (
    <div style={{ display: 'flex', height: 4, width: '100%', overflow: 'hidden', gap: 1, borderRadius: 2 }}>
      {searches   > 0 && <div style={{ flex: searches / total,   background: '#4fc3f7', minWidth: 2 }} title={`Search: ${fmt$(searches)}`} />}
      {anathema   > 0 && <div style={{ flex: anathema / total,   background: 'var(--sig-green)', minWidth: 2 }} title={`Anathema: ${fmt$(anathema)}`} />}
      {prometheus > 0 && <div style={{ flex: prometheus / total, background: 'var(--orange)', minWidth: 2 }} title={`Prometheus: ${fmt$(prometheus)}`} />}
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 13, color: 'var(--text-4)' }}>
      <div>
        <div style={{ marginBottom: 12 }}>Loading...</div>
        <div style={{ height: 2, background: 'var(--bg)', width: 200, position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
          <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--orange)', animation: 'slide 1s ease-in-out infinite' }} />
        </div>
      </div>
      <style>{`@keyframes slide { 0%{left:-40%} 100%{left:100%} }`}</style>
    </div>
  )

  if (error === 'FORBIDDEN') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, color: 'var(--text-4)', letterSpacing: 6 }}>DENIED</div>
        <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 8 }}>Admin access required</div>
      </div>
    </div>
  )

  if (!data) return null

  const { global: g, users, recent_activity } = data

  // Economics — monthly basis only
  const totalRevenue       = g.paying_users * COSTS.revenue
  const totalMonthCost     = users.filter(u => u.is_paying).reduce((sum, u) => sum + costForUser(u), 0)
  const avgCostPerUser     = g.paying_users > 0 ? totalMonthCost / g.paying_users : 0
  const overallMargin      = totalRevenue > 0 ? ((totalRevenue - totalMonthCost) / totalRevenue) * 100 : 0
  const totalSearchCost    = users.reduce((sum, u) => sum + u.searches_month * COSTS.search, 0)
  const totalAnathemaCost  = users.reduce((sum, u) => sum + u.anathema_month * COSTS.anathema, 0)
  const totalPrometheusCost= users.reduce((sum, u) => sum + u.prometheus_month * COSTS.prometheus, 0)

  const breakEvenAnathema  = Math.floor(COSTS.revenue / COSTS.anathema)
  const breakEvenPrometheus= Math.floor(COSTS.revenue / COSTS.prometheus)

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'cost')       return costForUser(b) - costForUser(a)
    if (sortBy === 'margin')     return marginForUser(a) - marginForUser(b)
    if (sortBy === 'searches')   return b.searches_total - a.searches_total
    if (sortBy === 'anathema')   return b.anathema_total - a.anathema_total
    if (sortBy === 'prometheus') return b.prometheus_total - a.prometheus_total
    return (b.last_active || '').localeCompare(a.last_active || '')
  })

  const TOOL_NAV = [
    { href: '/dashboard/search',     label: 'Agent Search', color: '#4fc3f7', stats: `${g.total_searches} total · ${g.searches_today} today` },
    { href: '/dashboard/anathema',   label: 'Anathema',     color: 'var(--sig-green)', stats: `${g.total_anathema} total · ${g.anathema_today} today` },
    { href: '/dashboard/prometheus', label: 'Prometheus',   color: 'var(--orange)',    stats: `${g.total_prometheus} total` },
    { href: '/dashboard/admin/adspy',label: 'Meredith',     color: '#38bdf8',          stats: 'Ad Library scanner' },
    { href: '/dashboard/david',      label: 'David',        color: '#a78bfa',          stats: 'Agent intel' },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <style>{`
        @keyframes slide { 0%{left:-40%} 100%{left:100%} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .user-row:hover { background: var(--bg-hover) !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="page-eyebrow">Admin · Command Center</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 3, color: 'var(--text-1)', lineHeight: 1 }}>
            RECRUITERRR INTEL
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sig-green)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sig-green)' }}>Live</span>
          </div>
        </div>
      </div>

      {/* ── TOOL LAUNCHER ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
        {TOOL_NAV.map(t => (
          <a key={t.label} href={t.href} style={{
            padding: '10px 16px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderBottom: `2px solid ${t.color}`,
            textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 3,
            borderRadius: 'var(--radius)', transition: 'border-color 0.12s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = t.color)}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.borderBottomColor = t.color }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: t.color }}>{t.label} →</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{t.stats}</div>
          </a>
        ))}
      </div>

      {/* ── TOP KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 6 }}>
        <KPI label="Total Users"    value={g.total_users}          accent="var(--orange)" />
        <KPI label="Paying Users"   value={g.paying_users}         color="var(--sig-green)" accent="var(--sig-green)" sub="active pro" />
        <KPI label="MRR"            value={fmt$(totalRevenue)}      color="var(--sig-green)" accent="var(--sig-green)" sub="paying users only" />
        <KPI label="This Month Cost"value={fmt$(totalMonthCost)}    color="var(--orange)" accent="var(--orange)" sub="API costs" />
        <KPI label="Margin"         value={fmtPct(overallMargin)}   color={marginColor(overallMargin)} accent={marginColor(overallMargin)} sub="monthly" />
        <KPI label="Net Revenue"    value={fmt$(totalRevenue - totalMonthCost)} color="var(--sig-green)" accent="var(--sig-green)" sub="after API costs" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 28 }}>
        <KPI label="Searches (Total)"  value={g.total_searches}   color="#4fc3f7" sub={`${g.searches_today} today`} />
        <KPI label="Searches (Month)"  value={g.searches_month}   color="#4fc3f7" sub={`${g.searches_today} today`} />
        <KPI label="Anathema (Total)"  value={g.total_anathema}   color="var(--sig-green)" sub={`${g.anathema_today} today`} />
        <KPI label="Anathema (Month)"  value={g.anathema_month}   color="var(--sig-green)" sub={`${g.anathema_today} today`} />
        <KPI label="Prometheus (Total)"value={g.total_prometheus} color="var(--orange)" />
        <KPI label="Prometheus (Month)"value={g.prometheus_month} color="var(--orange)" />
      </div>

      {/* ── BREAKEVEN ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 28 }}>
        <div style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>BREAKEVEN — ANATHEMA</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--sig-green)' }}>{breakEvenAnathema} scans</div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>per user per month to consume ${process.env.NEXT_PUBLIC_PRO_PRICE_DISPLAY || '499.95'}</div>
        </div>
        <div style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>BREAKEVEN — PROMETHEUS</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--orange)' }}>{breakEvenPrometheus} scans</div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>per user per month to consume ${process.env.NEXT_PUBLIC_PRO_PRICE_DISPLAY || '499.95'}</div>
        </div>
        <div style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>AVG MONTHLY USAGE / PAYING USER</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
            {[
              { val: g.paying_users > 0 ? (g.searches_month / g.paying_users).toFixed(0) : '0', label: 'Searches', color: '#4fc3f7' },
              { val: g.paying_users > 0 ? (g.anathema_month / g.paying_users).toFixed(0)  : '0', label: 'Anathema', color: 'var(--sig-green)' },
              { val: g.paying_users > 0 ? (g.prometheus_month / g.paying_users).toFixed(0): '0', label: 'Prometheus', color: 'var(--orange)' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: item.color, lineHeight: 1 }}>{item.val}</div>
                <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, letterSpacing: 0.5 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['users', 'economics', 'activity'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: '1px solid var(--border)',
            background: tab === t ? 'var(--bg-card)' : 'transparent',
            borderColor: tab === t ? 'var(--orange)' : 'var(--border)',
            color: tab === t ? 'var(--orange)' : 'var(--text-2)',
            fontSize: 13, fontWeight: tab === t ? 600 : 400,
            cursor: 'pointer', borderRadius: 'var(--radius)', transition: 'all 0.12s',
          }}>
            {t === 'users' ? `Users (${users.length})` : t === 'activity' ? `Activity (${recent_activity.length})` : 'Economics'}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div>
          {/* Sort controls */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', marginRight: 4 }}>Sort:</span>
            {(['activity', 'cost', 'margin', 'searches', 'anathema', 'prometheus'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{
                padding: '4px 12px',
                border: `1px solid ${sortBy === s ? 'var(--orange)' : 'var(--border)'}`,
                background: sortBy === s ? 'var(--orange-dim)' : 'transparent',
                color: sortBy === s ? 'var(--orange)' : 'var(--text-3)',
                fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius)', textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 70px 70px 70px 90px 80px 100px',
            gap: 8, padding: '8px 16px', marginBottom: 4,
            fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            <div>User</div><div>Searches</div><div>Anathema</div><div>Prometheus</div>
            <div>API Cost</div><div>Margin</div><div>Breakdown</div>
          </div>

          {sortedUsers.map(u => {
            const isExpanded = expandedUser === u.clerk_id
            const cost       = costForUser(u)
            const margin     = marginForUser(u)
            const sCost      = u.searches_month * COSTS.search
            const aCost      = u.anathema_month * COSTS.anathema
            const pCost      = u.prometheus_month * COSTS.prometheus
            const isActive   = u.last_active && (Date.now() - new Date(u.last_active).getTime()) < 3600000

            return (
              <div key={u.clerk_id} style={{ borderBottom: '1px solid var(--border)' }}>
                <div
                  className="user-row"
                  onClick={() => setExpandedUser(isExpanded ? null : u.clerk_id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 70px 70px 70px 90px 80px 100px',
                    gap: 8, padding: '14px 16px', cursor: 'pointer',
                    background: 'transparent', transition: 'background 0.1s', alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sig-green)', flexShrink: 0 }} />}
                      <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600 }}>
                        {u.name || u.email.split('@')[0]}
                      </span>
                      {!u.is_paying && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--text-4)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 3 }}>
                          {u.plan === 'pro' ? 'bypass' : 'free'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {u.email} · {timeAgo(u.last_active)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: u.searches_total > 0 ? '#4fc3f7' : 'var(--text-4)', lineHeight: 1 }}>{u.searches_total}</div>
                    {u.searches_month > 0 && <div style={{ fontSize: 10, color: '#4fc3f7' }}>{u.searches_month}/mo</div>}
                  </div>

                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: u.anathema_total > 0 ? 'var(--sig-green)' : 'var(--text-4)', lineHeight: 1 }}>{u.anathema_total}</div>
                    {u.anathema_month > 0 && <div style={{ fontSize: 10, color: 'var(--sig-green)' }}>{u.anathema_month}/mo</div>}
                  </div>

                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: u.prometheus_total > 0 ? 'var(--orange)' : 'var(--text-4)', lineHeight: 1 }}>{u.prometheus_total}</div>
                    {u.prometheus_month > 0 && <div style={{ fontSize: 10, color: 'var(--orange)' }}>{u.prometheus_month}/mo</div>}
                  </div>

                  <div>
                    {u.is_paying ? (
                      <>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: cost > 400 ? 'var(--sig-red)' : cost > 100 ? 'var(--orange)' : 'var(--text-1)', lineHeight: 1 }}>{fmt$(cost)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-4)' }}>this month</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>—</div>
                    )}
                  </div>

                  <div>
                    {u.is_paying ? (
                      <>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: marginColor(margin), lineHeight: 1 }}>{fmtPct(margin)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{fmt$(COSTS.revenue - cost)} net</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>—</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <CostBar searches={sCost} anathema={aCost} prometheus={pCost} />
                    <div style={{ fontSize: 10, color: 'var(--text-4)' }}>
                      S:{fmt$(sCost)} A:{fmt$(aCost)} P:{fmt$(pCost)}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '16px 16px 20px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Monthly Cost Breakdown</div>
                        {[
                          { label: 'Search',     count: u.searches_month,   rate: COSTS.search,     cost: sCost, color: '#4fc3f7' },
                          { label: 'Anathema',   count: u.anathema_month,   rate: COSTS.anathema,   cost: aCost, color: 'var(--sig-green)' },
                          { label: 'Prometheus', count: u.prometheus_month, rate: COSTS.prometheus, cost: pCost, color: 'var(--orange)' },
                        ].map(r => (
                          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 4, height: 4, background: r.color, borderRadius: 2 }} />
                              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.label}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-4)' }}>×{r.count} @ {fmt$(r.rate)}</span>
                            </div>
                            <span style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{fmt$(r.cost)}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Total cost</span>
                            <span style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 600 }}>{fmt$(cost)}</span>
                          </div>
                          {u.is_paying && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Net (after API)</span>
                              <span style={{ fontSize: 12, color: marginColor(margin), fontWeight: 600 }}>{fmt$(COSTS.revenue - cost)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Profitability</div>
                        {u.is_paying ? (
                          <>
                            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: marginColor(margin), lineHeight: 1, marginBottom: 8 }}>
                              {fmtPct(margin)}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                              {margin >= 70 && '✦ Healthy — well within safe zone'}
                              {margin >= 40 && margin < 70 && '◈ Watch — usage is climbing'}
                              {margin < 40 && margin >= 0 && '⚠ Warning — approaching breakeven'}
                              {margin < 0 && '✕ Unprofitable — costing you money'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 10, lineHeight: 1.7 }}>
                              Breakeven at {breakEvenAnathema} anathema scans<br />
                              or {breakEvenPrometheus} prometheus runs/mo
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--text-4)' }}>
                            {u.plan === 'pro' ? 'Bypass domain — no charge' : 'Free user — no revenue'}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Searches</div>
                        {u.recent_searches.length === 0 ? (
                          <div style={{ fontSize: 12, color: 'var(--text-4)' }}>No searches yet</div>
                        ) : u.recent_searches.map((s, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.city}, {s.state} — {s.results} agents</span>
                            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{new Date(s.at).toLocaleDateString()}</span>
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
            <div style={{ padding: '60px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-4)' }}>No users yet</div>
          )}
        </div>
      )}

      {/* ── ECONOMICS TAB ── */}
      {tab === 'economics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {[
              { label: 'Monthly Revenue', value: fmt$(totalRevenue), sub: `${g.paying_users} paying users × ${process.env.NEXT_PUBLIC_PRO_PRICE_DISPLAY || '499.95'}`, color: 'var(--sig-green)' },
              { label: 'This Month API Cost', value: fmt$(totalMonthCost), sub: 'current month only', color: 'var(--orange)' },
              { label: 'Net (API Margin)', value: fmt$(totalRevenue - totalMonthCost), sub: `${fmtPct(overallMargin)} margin`, color: marginColor(overallMargin) },
            ].map(card => (
              <div key={card.label} style={{ padding: '24px 28px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `3px solid ${card.color}`, borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: card.color, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 6 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '24px 28px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cost Breakdown by Product (This Month)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { label: 'Search',     total: totalSearchCost,     count: g.searches_month,   rate: COSTS.search,     color: '#4fc3f7' },
                { label: 'Anathema',   total: totalAnathemaCost,   count: g.anathema_month,   rate: COSTS.anathema,   color: 'var(--sig-green)' },
                { label: 'Prometheus', total: totalPrometheusCost, count: g.prometheus_month, rate: COSTS.prometheus, color: 'var(--orange)' },
              ].map(p => {
                const pct = totalMonthCost > 0 ? (p.total / totalMonthCost) * 100 : 0
                return (
                  <div key={p.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: p.color, letterSpacing: 1 }}>{p.label}</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--text-1)' }}>{fmt$(p.total)}</div>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg)', marginBottom: 8, borderRadius: 2 }}>
                      <div style={{ height: '100%', background: p.color, width: `${pct}%`, transition: 'width 0.5s', borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
                      {p.count} runs × {fmt$(p.rate)} · {fmtPct(pct)} of total
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '24px 28px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Per-User Profitability (Paying Users)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {users.filter(u => u.is_paying).sort((a, b) => marginForUser(a) - marginForUser(b)).map(u => {
                const cost   = costForUser(u)
                const margin = marginForUser(u)
                const barWidth = Math.min(100, (cost / COSTS.revenue) * 100)
                return (
                  <div key={u.clerk_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{u.name || u.email}</span>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>{fmt$(cost)}</span>
                        <span style={{ fontSize: 12, color: marginColor(margin), fontWeight: 600, minWidth: 50, textAlign: 'right' }}>{fmtPct(margin)}</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2 }}>
                      <div style={{ height: '100%', background: marginColor(margin), width: `${barWidth}%`, transition: 'width 0.5s', borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
              {users.filter(u => u.is_paying).length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-4)' }}>No paying users yet</div>
              )}
            </div>
          </div>

          <div style={{ padding: '24px 28px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Scale Projections</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 16 }}>Based on current avg cost per paying user ({fmt$(avgCostPerUser)}/mo)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {[5, 10, 25, 50, 100].map(n => {
                const rev    = n * COSTS.revenue
                const cost   = n * avgCostPerUser
                const net    = rev - cost
                const margin = rev > 0 ? (net / rev) * 100 : 0
                return (
                  <div key={n} style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--text-1)', lineHeight: 1, marginBottom: 2 }}>{n}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', marginBottom: 10 }}>users</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: 'var(--sig-green)' }}>{fmt$(rev)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 4 }}>revenue</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: 'var(--orange)' }}>{fmt$(cost)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 4 }}>API cost</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: marginColor(margin) }}>{fmt$(net)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)' }}>net · {fmtPct(margin)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVITY TAB ── */}
      {tab === 'activity' && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {recent_activity.map((a, i) => {
            const colors: Record<string, string> = { SEARCH: '#4fc3f7', ANATHEMA: 'var(--sig-green)', PROMETHEUS: 'var(--orange)' }
            const color = colors[a.type] || 'var(--text-4)'
            return (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '90px 1fr 160px', gap: 16, alignItems: 'center', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg)' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color, border: `1px solid ${color}`, padding: '2px 8px', borderRadius: 3, textAlign: 'center', letterSpacing: 1 }}>{a.type}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{a.user_email}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.detail}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'right' }}>
                  {new Date(a.at).toLocaleDateString()} {new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )
          })}
          {recent_activity.length === 0 && (
            <div style={{ padding: '60px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-4)' }}>No activity yet</div>
          )}
        </div>
      )}
    </div>
  )
}
