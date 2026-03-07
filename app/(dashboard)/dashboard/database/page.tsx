'use client'

import { useState, useEffect, useCallback } from 'react'

type AgentProfile = {
  id: string
  name: string
  agency_type: string | null
  city: string
  state: string
  address: string | null
  phone: string | null
  website: string | null
  contact_email: string | null
  rating: number | null
  reviews: number | null
  carriers: string[] | null
  captive: boolean
  prometheus_score: number | null
  prometheus_flag: 'hot' | 'warm' | 'cold' | null
  prometheus_notes: string | null
  hiring: boolean
  hiring_roles: string[] | null
  youtube_channel: string | null
  youtube_subscribers: string | null
  first_seen: string
  last_seen: string
  search_count: number
}

type Stats = {
  total: number
  hot: number
  states: number
  hiring: number
  with_phone: number
}

const FLAG_COLORS: Record<string, string> = {
  hot:  'var(--sig-green)',
  warm: 'var(--sig-yellow)',
  cold: 'var(--text-3)',
}

const FLAG_DIM: Record<string, string> = {
  hot:  'var(--sig-green-dim)',
  warm: 'var(--sig-yellow-dim)',
  cold: 'transparent',
}

const FLAG_BORDER: Record<string, string> = {
  hot:  'var(--sig-green-border)',
  warm: 'var(--sig-yellow-border)',
  cold: 'var(--border)',
}

function ScoreCircle({ score, flag }: { score: number | null; flag: string | null }) {
  const color  = flag ? FLAG_COLORS[flag]  : 'var(--text-3)'
  const dim    = flag ? FLAG_DIM[flag]     : 'transparent'
  const border = flag ? FLAG_BORDER[flag]  : 'var(--border)'
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      border: `2px solid ${border}`, background: dim,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color, letterSpacing: 0.5 }}>
        {score ?? '—'}
      </span>
    </div>
  )
}

function FlagBadge({ flag }: { flag: string | null }) {
  if (!flag) return null
  const map = {
    hot:  { color: 'var(--sig-green)',  border: 'var(--sig-green-border)',  bg: 'var(--sig-green-dim)',  label: '◈ HOT' },
    warm: { color: 'var(--sig-yellow)', border: 'var(--sig-yellow-border)', bg: 'var(--sig-yellow-dim)', label: 'WARM' },
    cold: { color: 'var(--text-3)',     border: 'var(--border)',             bg: 'transparent',           label: 'PASS' },
  }
  const s = map[flag as keyof typeof map] || map.cold
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 2,
      padding: '2px 6px', border: `1px solid ${s.border}`,
      color: s.color, background: s.bg, borderRadius: 3,
    }}>
      {s.label}
    </span>
  )
}

function ProfileRow({ agent, onClick }: { agent: AgentProfile; onClick: () => void }) {
  const daysSince = Math.floor((Date.now() - new Date(agent.last_seen).getTime()) / 86400000)
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: '48px 1fr auto',
        gap: 16, padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer', transition: 'background 0.1s', alignItems: 'center',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <ScoreCircle score={agent.prometheus_score} flag={agent.prometheus_flag} />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{agent.name}</span>
          <FlagBadge flag={agent.prometheus_flag} />
          {agent.hiring && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--sig-green)', letterSpacing: 1 }}>▸ HIRING</span>
          )}
          {agent.youtube_channel && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--sig-red)', letterSpacing: 1 }}>▸ YT</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {agent.city}, {agent.state}
          {agent.phone ? ` · ${agent.phone}` : ''}
          {agent.rating ? ` · ★ ${agent.rating} (${agent.reviews})` : ''}
        </div>
        {agent.prometheus_notes && (
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>
            {agent.prometheus_notes.slice(0, 100)}{agent.prometheus_notes.length > 100 ? '…' : ''}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
          {daysSince === 0 ? 'TODAY' : daysSince === 1 ? '1D AGO' : `${daysSince}D AGO`}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
          ×{agent.search_count}
        </div>
      </div>
    </div>
  )
}

function DetailPanel({ agent, onClose }: { agent: AgentProfile; onClose: () => void }) {
  const flagColor  = agent.prometheus_flag ? FLAG_COLORS[agent.prometheus_flag]  : 'var(--text-3)'
  const flagDim    = agent.prometheus_flag ? FLAG_DIM[agent.prometheus_flag]     : 'transparent'
  const flagBorder = agent.prometheus_flag ? FLAG_BORDER[agent.prometheus_flag]  : 'var(--border)'

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, height: '100vh', overflowY: 'auto',
          background: 'var(--bg-raised)', borderLeft: '1px solid var(--border)',
          padding: '32px 28px', animation: 'slideInRight 0.2s ease',
          boxShadow: '-4px 0 24px var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--text-1)', marginBottom: 4 }}>
              {agent.name}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase' }}>
              {agent.agency_type || 'Health Insurance Agency'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        {/* Score + flag */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            border: `2px solid ${flagBorder}`, background: flagDim,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: flagColor }}>
              {agent.prometheus_score ?? '—'}
            </span>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 4 }}>RECRUIT SCORE</div>
            <FlagBadge flag={agent.prometheus_flag} />
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 1 }}>
              SEEN ×{agent.search_count}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-4)', letterSpacing: 1, marginTop: 2 }}>
              FIRST {new Date(agent.first_seen).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Analyst notes */}
        {agent.prometheus_notes && (
          <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--orange-dim)', borderLeft: '2px solid var(--orange)', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-1)', lineHeight: 1.7, letterSpacing: 0.5 }}>
            {agent.prometheus_notes}
          </div>
        )}

        {/* Contact */}
        <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 10 }}>CONTACT</div>
          {agent.phone && (
            <a href={`tel:${agent.phone}`} style={{ display: 'block', fontSize: 14, color: 'var(--text-1)', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none', marginBottom: 6 }}>
              {agent.phone}
            </a>
          )}
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: agent.address ? 6 : 0 }}>
            ◎ {agent.city}, {agent.state}{agent.address ? ` — ${agent.address}` : ''}
          </div>
          {agent.rating && (
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>★ {agent.rating} ({agent.reviews} reviews)</div>
          )}
          {agent.contact_email && (
            <a href={`mailto:${agent.contact_email}`}
              style={{ display: 'block', marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-2)', letterSpacing: 1, textDecoration: 'none' }}>
              @ {agent.contact_email}
            </a>
          )}
          {agent.website && (
            <a href={agent.website} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--orange)', letterSpacing: 1, textDecoration: 'none' }}>
              ↗ {agent.website}
            </a>
          )}
        </div>

        {/* Carriers */}
        {agent.carriers && agent.carriers.length > 0 && agent.carriers[0] !== 'Unknown' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 8 }}>CARRIERS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {agent.carriers.map(c => (
                <span key={c} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px', border: '1px solid var(--border)', color: 'var(--text-2)', letterSpacing: 1, textTransform: 'uppercase', borderRadius: 3 }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Signals */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {agent.hiring && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', background: 'var(--sig-green-dim)', border: '1px solid var(--sig-green-border)', color: 'var(--sig-green)', letterSpacing: 1, borderRadius: 3 }}>
              ▸ ACTIVELY HIRING{agent.hiring_roles?.length ? ` — ${agent.hiring_roles[0]}` : ''}
            </span>
          )}
          {agent.youtube_channel && (
            <a href={agent.youtube_channel} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', background: 'var(--sig-red-dim)', border: '1px solid var(--sig-red-border)', color: 'var(--sig-red)', letterSpacing: 1, textDecoration: 'none', borderRadius: 3 }}>
              ▸ YOUTUBE{agent.youtube_subscribers ? ` — ${agent.youtube_subscribers}` : ''}
            </a>
          )}
        </div>

        <style>{`@keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      </div>
    </div>
  )
}

// ── CSV export ────────────────────────────────────────────────────────────────
async function exportCSV() {
  const res = await fetch('/api/database/export')
  if (!res.ok) return
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `recruiterrr-agents-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DatabasePage() {
  const [agents, setAgents]       = useState<AgentProfile[]>([])
  const [stats, setStats]         = useState<Stats | null>(null)
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<AgentProfile | null>(null)
  const [exporting, setExporting] = useState(false)

  const [filterFlag,  setFilterFlag]  = useState('all')
  const [filterState, setFilterState] = useState('all')
  const [filterCity,  setFilterCity]  = useState('all')
  const [filterPhone, setFilterPhone] = useState(false)
  const [search,      setSearch]      = useState('')
  const [sortBy,      setSortBy]      = useState<'score' | 'last_seen' | 'search_count'>('last_seen')
  const [page,        setPage]        = useState(1)
  const [perPage,     setPerPage]     = useState(50)
  const [pagination,  setPagination]  = useState<{ total: number; total_pages: number } | null>(null)

  const [allStates, setAllStates] = useState<string[]>([])
  const [allCities, setAllCities] = useState<string[]>([])

  const visibleCities = filterState === 'all' ? allCities : allCities

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        flag: filterFlag, state: filterState, city: filterCity,
        search, sort: sortBy, page: String(page), per_page: String(perPage),
        anathema: 'all', tree: 'all',
      })
      if (filterPhone) params.set('has_phone', 'true')
      const res = await fetch(`/api/database?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAgents(data.agents || [])
      setStats(data.stats || null)
      setPagination(data.pagination || null)
      if (data.allStates) setAllStates(data.allStates)
      if (data.allCities) setAllCities(data.allCities)
    } catch {
      setAgents([])
    } finally {
      setLoading(false)
    }
  }, [filterFlag, filterState, filterCity, filterPhone, search, sortBy, page, perPage])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filterFlag, filterState, filterCity, filterPhone, search, sortBy, perPage])
  useEffect(() => { setFilterCity('all') }, [filterState])

  async function handleExport() {
    setExporting(true)
    await exportCSV()
    setExporting(false)
  }

  const selectStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: 1,
    padding: '7px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
    color: 'var(--text-2)', cursor: 'pointer', outline: 'none', borderRadius: 'var(--radius)',
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div className="page-eyebrow">Agent Database</div>
          <h1 className="page-title">AGENT DATABASE<span>.</span></h1>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: -16, marginBottom: 8 }}>
            Every agent surfaced by your searches — scored and stored.
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !stats?.total}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', background: 'transparent',
            border: '1px solid var(--border-strong)',
            color: exporting ? 'var(--text-3)' : 'var(--text-2)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            borderRadius: 'var(--radius)', fontWeight: 500,
          }}
          onMouseEnter={e => { if (!exporting) { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.color = 'var(--orange)' } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-2)' }}
        >
          {exporting ? '↓ EXPORTING...' : '↓ EXPORT CSV'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 28 }}>
          {[
            { label: 'TOTAL AGENTS', value: stats.total,      color: 'var(--text-1)' },
            { label: '◈ HOT LEADS',  value: stats.hot,        color: 'var(--sig-green)' },
            { label: 'HAVE PHONE',   value: stats.with_phone, color: 'var(--orange)' },
            { label: '▸ HIRING',     value: stats.hiring,     color: 'var(--sig-yellow)' },
            { label: 'STATES',       value: stats.states,     color: 'var(--text-2)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 1px 3px var(--shadow-sm)' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: s.color, lineHeight: 1, marginBottom: 5 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search agents..."
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-1)', outline: 'none', width: 220, borderRadius: 'var(--radius)',
          }}
        />

        {(['all', 'hot', 'warm', 'cold'] as const).map(f => {
          const active = filterFlag === f
          const color  = f === 'hot' ? 'var(--sig-green)' : f === 'warm' ? 'var(--sig-yellow)' : f === 'cold' ? 'var(--text-3)' : 'var(--text-2)'
          const activeBg = f === 'hot' ? 'var(--sig-green-dim)' : f === 'warm' ? 'var(--sig-yellow-dim)' : 'var(--bg-hover)'
          return (
            <button key={f} onClick={() => setFilterFlag(f)} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '9px 16px', fontWeight: 500,
              background: active ? activeBg : 'transparent',
              border: `1px solid ${active ? color : 'var(--border)'}`,
              color: active ? color : 'var(--text-2)',
              cursor: 'pointer', textTransform: 'uppercase', borderRadius: 'var(--radius)',
              transition: 'all 0.12s',
            }}>
              {f.toUpperCase()}
            </button>
          )
        })}

        <button
          onClick={() => setFilterPhone(v => !v)}
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '9px 16px', fontWeight: 500,
            background: filterPhone ? 'var(--orange-dim)' : 'transparent',
            border: `1px solid ${filterPhone ? 'var(--orange)' : 'var(--border)'}`,
            color: filterPhone ? 'var(--orange)' : 'var(--text-2)',
            cursor: 'pointer', borderRadius: 'var(--radius)', transition: 'all 0.12s',
          }}
        >
          HAS PHONE
        </button>

        <select value={filterState} onChange={e => setFilterState(e.target.value)} style={selectStyle}>
          <option value="all">ALL STATES</option>
          {allStates.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={selectStyle}>
          <option value="all">ALL CITIES</option>
          {visibleCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ ...selectStyle, marginLeft: 'auto' }}>
          <option value="last_seen">RECENT FIRST</option>
          <option value="score">HIGHEST SCORE</option>
          <option value="search_count">MOST SEEN</option>
        </select>

        <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={selectStyle}>
          <option value={25}>25 / PAGE</option>
          <option value={50}>50 / PAGE</option>
          <option value={100}>100 / PAGE</option>
        </select>
      </div>

      {/* Active filter summary */}
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, display: 'flex', gap: 16, alignItems: 'center' }}>
        <span>{loading ? 'LOADING...' : `${pagination?.total ?? agents.length} PROFILES${filterFlag !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterPhone || search ? ' (FILTERED)' : ''}`}</span>
        {(filterFlag !== 'hot' || filterState !== 'all' || filterCity !== 'all' || filterPhone || search) && (
          <button
            onClick={() => { setFilterFlag('hot'); setFilterState('all'); setFilterCity('all'); setFilterPhone(false); setSearch('') }}
            style={{ fontSize: 11, padding: '4px 12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', borderRadius: 'var(--radius)' }}
          >
            RESET FILTERS
          </button>
        )}
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 16, padding: '8px 20px', borderBottom: '1px solid var(--border)' }}>
        <div />
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>AGENT</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, textAlign: 'right' }}>LAST SEEN</div>
      </div>

      {/* Rows */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
            QUERYING DATABASE...
          </div>
        ) : agents.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: 'var(--text-4)', marginBottom: 12, letterSpacing: 4 }}>
              {filterFlag !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterPhone || search ? 'NO MATCHES' : 'NO PROFILES YET'}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-3)', letterSpacing: 2 }}>
              {filterFlag !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterPhone || search
                ? 'Try adjusting your filters.'
                : 'Run searches to start building your database.'}
            </div>
          </div>
        ) : agents.map(agent => (
          <ProfileRow key={agent.id} agent={agent} onClick={() => setSelected(agent)} />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            PAGE {page} OF {pagination.total_pages} · {pagination.total} TOTAL
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { label: '«',    action: () => setPage(1),                                              disabled: page === 1 },
              { label: 'PREV', action: () => setPage(p => Math.max(1, p - 1)),                        disabled: page === 1 },
              { label: 'NEXT', action: () => setPage(p => Math.min(pagination.total_pages, p + 1)),   disabled: page === pagination.total_pages },
              { label: '»',    action: () => setPage(pagination.total_pages),                         disabled: page === pagination.total_pages },
            ].map(b => (
              <button key={b.label} onClick={b.action} disabled={b.disabled} style={{
                fontSize: 12, padding: '8px 16px', fontWeight: 500,
                background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                color: b.disabled ? 'var(--text-4)' : 'var(--text-2)', cursor: b.disabled ? 'default' : 'pointer',
              }}>{b.label}</button>
            ))}
          </div>
        </div>
      )}

      {selected && <DetailPanel agent={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
