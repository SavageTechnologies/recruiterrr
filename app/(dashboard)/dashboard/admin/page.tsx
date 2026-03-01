'use client'

import { useState, useEffect } from 'react'

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

const TREE_COLORS: Record<string, string> = {
  integrity: '#00e676',
  amerilife: '#4fc3f7',
  sms: '#ff5500',
  unknown: '#444',
}

function StatBox({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: '16px 20px', background: '#0e0e0e', border: '1px solid #222' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: color || '#f0ede8', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, textTransform: 'uppercase' }}>
        {label}
      </div>
      {sub && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 1, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function ActivityBadge({ type }: { type: string }) {
  const colors: Record<string, string> = { SEARCH: '#4fc3f7', ANATHEMA: '#00e676', PROMETHEUS: '#ff5500' }
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: 2, padding: '2px 6px',
      border: `1px solid ${colors[type] || '#333'}`, color: colors[type] || '#333',
    }}>{type}</span>
  )
}

function ToolCard({ href, label, sub, color, stats }: { href: string; label: string; sub: string; color: string; stats: string }) {
  return (
    <a
      href={href}
      style={{ display: 'block', padding: '20px 24px', background: '#0e0e0e', border: `1px solid #222`, borderTop: `2px solid ${color}`, textDecoration: 'none', transition: 'border-color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}
    >
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color, letterSpacing: 2, marginBottom: 4 }}>{label} →</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1, marginBottom: 10 }}>{sub}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>{stats}</div>
    </a>
  )
}

export default function AdminPage() {
  const [data, setData] = useState<{ global: GlobalStats; users: UserStat[]; recent_activity: ActivityItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#333', letterSpacing: 3 }}>
      LOADING INTEL...
    </div>
  )

  if (error === 'FORBIDDEN') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#1a1a1a', letterSpacing: 4 }}>ACCESS DENIED</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 2, marginTop: 8 }}>ADMIN CLEARANCE REQUIRED</div>
      </div>
    </div>
  )

  if (!data) return null

  const { global: g, users, recent_activity } = data
  const totalAnathema = g.integrity_count + g.amerilife_count + g.sms_count + g.unknown_count

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 4, color: '#f0ede8' }}>
            COMMAND CENTER
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 2 }}>
            SYSTEM INTELLIGENCE · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </div>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 2 }}>◈ LIVE</div>
      </div>

      {/* ── TOOL LAUNCHER ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 2, marginBottom: 10 }}>
          OWNER TOOLS — NOT VISIBLE TO USERS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
          <ToolCard
            href="/dashboard/search"
            label="SEARCH"
            sub="Agent market search"
            color="#4fc3f7"
            stats={`${g.total_searches} total · ${g.searches_today} today`}
          />
          <ToolCard
            href="/dashboard/prometheus"
            label="PROMETHEUS"
            sub="FMO competitive intel"
            color="#ff5500"
            stats={`${g.total_prometheus} total runs`}
          />
          <ToolCard
            href="/dashboard/anathema"
            label="ANATHEMA"
            sub="Distribution tree analysis"
            color="#00e676"
            stats={`${g.total_anathema} total · ${g.anathema_today} today`}
          />
          <ToolCard
            href="/dashboard/database"
            label="DATABASE"
            sub="Agent profiles"
            color="#a78bfa"
            stats={`${g.total_profiles} profiles · ${g.profiles_with_anathema} with ANATHEMA`}
          />
        </div>
      </div>

      {/* ── GLOBAL STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 2 }}>
        <StatBox label="Total Users"      value={g.total_users}      color="#f0ede8" />
        <StatBox label="Total Searches"   value={g.total_searches}   sub={`${g.searches_today} today · ${g.searches_week} this week`} color="#4fc3f7" />
        <StatBox label="ANATHEMA Scans"   value={g.total_anathema}   sub={`${g.anathema_today} today`} color="#00e676" />
        <StatBox label="Prometheus Runs"  value={g.total_prometheus} color="#ff5500" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 28 }}>
        <StatBox label="Agent Profiles"   value={g.total_profiles}   sub={`${g.profiles_with_anathema} with ANATHEMA`} color="#f0ede8" />
        <StatBox label="Integrity"        value={g.integrity_count}  color="#00e676" />
        <StatBox label="AmeriLife"        value={g.amerilife_count}  color="#4fc3f7" />
        <StatBox label="SMS"              value={g.sms_count}        color="#ff5500" />
      </div>

      {/* ── TREE DISTRIBUTION BAR ── */}
      {totalAnathema > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 8 }}>
            DISTRIBUTION ACROSS {totalAnathema} SCANNED AGENTS
          </div>
          <div style={{ display: 'flex', height: 8, background: '#111', overflow: 'hidden' }}>
            {(['integrity', 'amerilife', 'sms', 'unknown'] as const).map(tree => {
              const count = tree === 'integrity' ? g.integrity_count : tree === 'amerilife' ? g.amerilife_count : tree === 'sms' ? g.sms_count : g.unknown_count
              const pct = (count / totalAnathema) * 100
              return pct > 0 ? (
                <div key={tree} style={{ width: `${pct}%`, background: TREE_COLORS[tree], transition: 'width 0.5s' }} title={`${tree}: ${count}`} />
              ) : null
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
            {(['integrity', 'amerilife', 'sms', 'unknown'] as const).map(tree => {
              const count = tree === 'integrity' ? g.integrity_count : tree === 'amerilife' ? g.amerilife_count : tree === 'sms' ? g.sms_count : g.unknown_count
              return (
                <div key={tree} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, background: TREE_COLORS[tree] }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#555', letterSpacing: 1, textTransform: 'uppercase' }}>
                    {tree} {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* ── USERS TABLE ── */}
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2, marginBottom: 10 }}>
            USERS · {users.length}
          </div>
          <div style={{ border: '1px solid #1a1a1a' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px', gap: 12, padding: '8px 16px', borderBottom: '1px solid #1a1a1a' }}>
              {['USER', 'SEARCHES', 'ANATHEMA', 'PROMETHEUS', 'PROFILES'].map(h => (
                <div key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 2 }}>{h}</div>
              ))}
            </div>

            {users.map(u => {
              const isExpanded = expandedUser === u.clerk_id
              const lastActive = u.last_active
                ? Math.floor((Date.now() - new Date(u.last_active).getTime()) / 60000)
                : null
              const isActive = lastActive !== null && lastActive < 60

              return (
                <div key={u.clerk_id} style={{ borderBottom: '1px solid #111' }}>
                  <div
                    onClick={() => setExpandedUser(isExpanded ? null : u.clerk_id)}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px', gap: 12, padding: '12px 16px', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0a0a0a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00e676', flexShrink: 0 }} />}
                        <span style={{ fontSize: 12, color: '#f0ede8', fontWeight: 500 }}>{u.name || u.email}</span>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1 }}>
                        {u.name ? u.email : ''}
                        {lastActive !== null
                          ? ` · ${lastActive < 60 ? `${lastActive}m ago` : lastActive < 1440 ? `${Math.floor(lastActive / 60)}h ago` : `${Math.floor(lastActive / 1440)}d ago`}`
                          : ' · never active'}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: u.searches_total > 0 ? '#4fc3f7' : '#222' }}>
                      {u.searches_total}
                      {u.searches_today > 0 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#4fc3f7', display: 'block', lineHeight: 1 }}>+{u.searches_today} today</span>}
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: u.anathema_total > 0 ? '#00e676' : '#222' }}>
                      {u.anathema_total}
                      {u.anathema_today > 0 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#00e676', display: 'block', lineHeight: 1 }}>+{u.anathema_today} today</span>}
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: u.prometheus_total > 0 ? '#ff5500' : '#222' }}>
                      {u.prometheus_total}
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: u.profiles_total > 0 ? '#f0ede8' : '#222' }}>
                      {u.profiles_total}
                    </div>
                  </div>

                  {/* Expanded — recent searches */}
                  {isExpanded && u.recent_searches.length > 0 && (
                    <div style={{ padding: '0 16px 12px 16px', borderTop: '1px solid #111' }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#333', letterSpacing: 2, marginBottom: 8, marginTop: 10 }}>
                        RECENT SEARCHES
                      </div>
                      {u.recent_searches.map((s, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#666' }}>
                            {s.city}, {s.state} — {s.results} agents
                          </span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333' }}>
                            {new Date(s.at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {users.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#222', letterSpacing: 2 }}>
                NO USERS YET
              </div>
            )}
          </div>
        </div>

        {/* ── ACTIVITY FEED ── */}
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2, marginBottom: 10 }}>
            LIVE ACTIVITY
          </div>
          <div style={{ border: '1px solid #1a1a1a' }}>
            {recent_activity.map((a, i) => (
              <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid #111' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <ActivityBadge type={a.type} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 1 }}>
                    {new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#666', marginBottom: 2 }}>
                  {a.user_email}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444' }}>
                  {a.detail}
                </div>
              </div>
            ))}
            {recent_activity.length === 0 && (
              <div style={{ padding: '40px 14px', textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#222', letterSpacing: 2 }}>
                NO ACTIVITY YET
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
