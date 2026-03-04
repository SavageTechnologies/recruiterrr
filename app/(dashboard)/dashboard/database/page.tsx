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
  hot:  'var(--green)',
  warm: 'var(--yellow)',
  cold: '#333',
}

function ScoreCircle({ score, flag }: { score: number | null; flag: string | null }) {
  const color = flag === 'hot' ? 'var(--green)' : flag === 'warm' ? 'var(--yellow)' : '#333'
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      border: `2px solid ${color}`, background: `${color}0d`,
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
  const map = { hot: { color: 'var(--green)', label: '◈ HOT' }, warm: { color: 'var(--yellow)', label: 'WARM' }, cold: { color: '#444', label: 'PASS' } }
  const { color, label } = map[flag as keyof typeof map] || { color: '#444', label: flag.toUpperCase() }
  return (
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 2, padding: '2px 6px', border: `1px solid ${color}`, color }}>
      {label}
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
      onMouseEnter={e => (e.currentTarget.style.background = '#111')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <ScoreCircle score={agent.prometheus_score} flag={agent.prometheus_flag} />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>{agent.name}</span>
          <FlagBadge flag={agent.prometheus_flag} />
          {agent.hiring && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--green)', letterSpacing: 1 }}>▸ HIRING</span>
          )}
          {agent.youtube_channel && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#ff4444', letterSpacing: 1 }}>▸ YT</span>
          )}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
          {agent.city}, {agent.state}
          {agent.phone ? ` · ${agent.phone}` : ''}
          {agent.rating ? ` · ★ ${agent.rating} (${agent.reviews})` : ''}
        </div>
        {agent.prometheus_notes && (
          <div style={{ fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.4 }}>
            {agent.prometheus_notes.slice(0, 100)}{agent.prometheus_notes.length > 100 ? '…' : ''}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1, marginBottom: 4 }}>
          {daysSince === 0 ? 'TODAY' : daysSince === 1 ? '1D AGO' : `${daysSince}D AGO`}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>
          ×{agent.search_count}
        </div>
      </div>
    </div>
  )
}

function DetailPanel({ agent, onClose }: { agent: AgentProfile; onClose: () => void }) {
  const flagColor = agent.prometheus_flag ? FLAG_COLORS[agent.prometheus_flag] : '#333'

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, height: '100vh', overflowY: 'auto',
          background: '#0a0a0a', borderLeft: '1px solid var(--border)',
          padding: '32px 28px', animation: 'slideInRight 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--white)', marginBottom: 4 }}>
              {agent.name}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
              {agent.agency_type || 'Health Insurance Agency'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        {/* Score + flag */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            border: `2px solid ${flagColor}`, background: `${flagColor}0d`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: flagColor }}>
              {agent.prometheus_score ?? '—'}
            </span>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 2 }}>RECRUIT SCORE</div>
            <FlagBadge flag={agent.prometheus_flag} />
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1 }}>
              SEEN ×{agent.search_count}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1, marginTop: 2 }}>
              FIRST {new Date(agent.first_seen).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Analyst notes */}
        {agent.prometheus_notes && (
          <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--orange-dim)', borderLeft: '2px solid var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)', lineHeight: 1.7, letterSpacing: 0.5 }}>
            {agent.prometheus_notes}
          </div>
        )}

        {/* Contact */}
        <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 10 }}>CONTACT</div>
          {agent.phone && (
            <a href={`tel:${agent.phone}`} style={{ display: 'block', fontSize: 14, color: 'var(--white)', fontFamily: "'DM Mono', monospace", textDecoration: 'none', marginBottom: 6 }}>
              {agent.phone}
            </a>
          )}
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: agent.address ? 6 : 0 }}>
            ◎ {agent.city}, {agent.state}{agent.address ? ` — ${agent.address}` : ''}
          </div>
          {agent.rating && (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>★ {agent.rating} ({agent.reviews} reviews)</div>
          )}
          {agent.contact_email && (
            <a href={`mailto:${agent.contact_email}`}
              style={{ display: 'block', marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textDecoration: 'none' }}>
              @ {agent.contact_email}
            </a>
          )}
          {agent.website && (
            <a href={agent.website} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 1, textDecoration: 'none' }}>
              ↗ {agent.website}
            </a>
          )}
        </div>

        {/* Carriers */}
        {agent.carriers && agent.carriers.length > 0 && agent.carriers[0] !== 'Unknown' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 8 }}>CARRIERS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {agent.carriers.map(c => (
                <span key={c} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px', border: '1px solid var(--border-light)', color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Signals */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {agent.hiring && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', background: 'rgba(0,230,118,0.06)', border: '1px solid var(--green)', color: 'var(--green)', letterSpacing: 1 }}>
              ▸ ACTIVELY HIRING{agent.hiring_roles?.length ? ` — ${agent.hiring_roles[0]}` : ''}
            </span>
          )}
          {agent.youtube_channel && (
            <a href={agent.youtube_channel} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', background: 'rgba(255,68,68,0.06)', border: '1px solid #ff4444', color: '#ff4444', letterSpacing: 1, textDecoration: 'none' }}>
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

  // ── Filters — default to HOT + recent ──────────────────────────────────────
  const [filterFlag,  setFilterFlag]  = useState('hot')
  const [filterState, setFilterState] = useState('all')
  const [filterCity,  setFilterCity]  = useState('all')
  const [filterPhone, setFilterPhone] = useState(false)
  const [search,      setSearch]      = useState('')
  const [sortBy,      setSortBy]      = useState<'score' | 'last_seen' | 'search_count'>('last_seen')
  const [page,        setPage]        = useState(1)
  const [perPage,     setPerPage]     = useState(50)
  const [pagination,  setPagination]  = useState<{ total: number; total_pages: number } | null>(null)

  // ── State + city lists from API (not derived from current page) ─────────────
  const [allStates, setAllStates] = useState<string[]>([])
  const [allCities, setAllCities] = useState<string[]>([])

  // Filter cities shown based on selected state
  const visibleCities = filterState === 'all'
    ? allCities
    : allCities.filter(c => {
        // We can't easily filter cities by state client-side without storing state per city.
        // Show all cities when a state is selected — API will handle the actual filtering.
        return true
      })

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
      // Always update state/city lists from full DB — not derived from current page
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

  // Reset city when state changes
  useEffect(() => { setFilterCity('all') }, [filterState])

  async function handleExport() {
    setExporting(true)
    await exportCSV()
    setExporting(false)
  }

  const selectStyle = {
    fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1,
    padding: '7px 12px', background: 'var(--card)', border: '1px solid var(--border)',
    color: 'var(--muted)', cursor: 'pointer', outline: 'none',
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 4, color: 'var(--white)', marginBottom: 6 }}>
            AGENT DATABASE
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2 }}>
            Every agent surfaced by your searches and lookups — scored and stored.
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !stats?.total}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', background: exporting ? '#333' : 'transparent',
            border: '1px solid var(--border-light)',
            color: exporting ? '#555' : 'var(--white)',
            fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2,
            cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!exporting) { (e.currentTarget.style.borderColor = 'var(--orange)'); (e.currentTarget.style.color = 'var(--orange)') } }}
          onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border-light)'); (e.currentTarget.style.color = 'var(--white)') }}
        >
          {exporting ? '↓ EXPORTING...' : '↓ EXPORT CSV'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, marginBottom: 28 }}>
          {[
            { label: 'TOTAL AGENTS',  value: stats.total,      color: 'var(--white)' },
            { label: '◈ HOT LEADS',   value: stats.hot,        color: 'var(--green)' },
            { label: 'HAVE PHONE',    value: stats.with_phone,  color: 'var(--orange)' },
            { label: '▸ HIRING',      value: stats.hiring,     color: 'var(--yellow)' },
            { label: 'STATES',        value: stats.states,     color: 'var(--muted)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#555', letterSpacing: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search agents..."
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1,
            padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--border)',
            color: 'var(--white)', outline: 'none', width: 200,
          }}
        />

        {/* Flag filters */}
        {(['all', 'hot', 'warm', 'cold'] as const).map(f => (
          <button key={f} onClick={() => setFilterFlag(f)} style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, padding: '7px 14px',
            background: filterFlag === f
              ? f === 'all' ? 'var(--border)' : FLAG_COLORS[f]
              : 'transparent',
            border: `1px solid ${filterFlag === f
              ? f === 'all' ? 'var(--border)' : FLAG_COLORS[f]
              : 'var(--border)'}`,
            color: filterFlag === f
              ? f === 'cold' || f === 'all' ? 'var(--white)' : 'var(--black)'
              : 'var(--muted)',
            cursor: 'pointer', textTransform: 'uppercase',
          }}>
            {f === 'all' ? 'ALL' : f.toUpperCase()}
          </button>
        ))}

        {/* Has Phone toggle */}
        <button
          onClick={() => setFilterPhone(v => !v)}
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, padding: '7px 14px',
            background: filterPhone ? 'var(--orange)' : 'transparent',
            border: `1px solid ${filterPhone ? 'var(--orange)' : 'var(--border)'}`,
            color: filterPhone ? 'var(--black)' : 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          HAS PHONE
        </button>

        {/* State dropdown — populated from full DB */}
        <select value={filterState} onChange={e => setFilterState(e.target.value)} style={selectStyle}>
          <option value="all">ALL STATES</option>
          {allStates.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* City dropdown — populated from full DB */}
        <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={selectStyle}>
          <option value="all">ALL CITIES</option>
          {visibleCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Sort + per page pushed right */}
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
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 8, display: 'flex', gap: 16, alignItems: 'center' }}>
        <span>{loading ? 'LOADING...' : `${pagination?.total ?? agents.length} PROFILES${filterFlag !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterPhone || search ? ' (FILTERED)' : ''}`}</span>
        {(filterFlag !== 'hot' || filterState !== 'all' || filterCity !== 'all' || filterPhone || search) && (
          <button
            onClick={() => { setFilterFlag('hot'); setFilterState('all'); setFilterCity('all'); setFilterPhone(false); setSearch('') }}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 2, padding: '3px 10px', background: 'transparent', border: '1px solid #333', color: '#555', cursor: 'pointer' }}
          >
            RESET FILTERS
          </button>
        )}
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 16, padding: '8px 20px', borderBottom: '1px solid var(--border)' }}>
        <div />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2 }}>AGENT</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, textAlign: 'right' }}>LAST SEEN</div>
      </div>

      {/* Rows */}
      <div style={{ border: '1px solid var(--border)', borderTop: 'none' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#333', letterSpacing: 3 }}>
            QUERYING DATABASE...
          </div>
        ) : agents.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: '#1a1a1a', marginBottom: 12, letterSpacing: 4 }}>
              {filterFlag !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterPhone || search
                ? 'NO MATCHES'
                : 'NO PROFILES YET'}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#333', letterSpacing: 2 }}>
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
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2 }}>
            PAGE {page} OF {pagination.total_pages} · {pagination.total} TOTAL
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { label: '«', action: () => setPage(1), disabled: page === 1 },
              { label: 'PREV', action: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
              { label: 'NEXT', action: () => setPage(p => Math.min(pagination.total_pages, p + 1)), disabled: page === pagination.total_pages },
              { label: '»', action: () => setPage(pagination.total_pages), disabled: page === pagination.total_pages },
            ].map(b => (
              <button key={b.label} onClick={b.action} disabled={b.disabled} style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '6px 14px',
                background: 'transparent', border: '1px solid var(--border)',
                color: b.disabled ? '#333' : 'var(--muted)', cursor: b.disabled ? 'default' : 'pointer',
              }}>{b.label}</button>
            ))}
          </div>
        </div>
      )}

      {selected && <DetailPanel agent={selected} onClose={() => setSelected(null)} />}

      <style>{`select option { background: #111; }`}</style>
    </div>
  )
}

