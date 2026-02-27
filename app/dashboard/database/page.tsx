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
  prometheus_about: string | null
  hiring: boolean
  youtube_channel: string | null
  anathema_run: boolean
  predicted_tree: string | null
  predicted_confidence: number | null
  predicted_sub_imo: string | null
  unresolved_upline: string | null
  anathema_signals: string[] | null
  anathema_scanned_at: string | null
  first_seen: string
  last_seen: string
  search_count: number
}

type Stats = {
  total: number
  hot: number
  anathema_run: number
  states: number
  hiring: number
}

const TREE_COLORS: Record<string, string> = {
  integrity: 'var(--green)',
  amerilife: '#4fc3f7',
  sms: 'var(--orange)',
  unknown: '#444',
}

const FLAG_COLORS: Record<string, string> = {
  hot: 'var(--green)',
  warm: 'var(--yellow)',
  cold: '#333',
}

function ScoreDot({ score, flag }: { score: number | null; flag: string | null }) {
  const color = flag ? FLAG_COLORS[flag] || '#333' : '#333'
  return (
    <div style={{
      width: 36, height: 36,
      border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color, letterSpacing: 1 }}>
        {score ?? '—'}
      </span>
    </div>
  )
}

function TreeBadge({ tree }: { tree: string | null }) {
  if (!tree || tree === 'unknown') return null
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 8, letterSpacing: 2,
      padding: '2px 6px',
      border: `1px solid ${TREE_COLORS[tree] || '#444'}`,
      color: TREE_COLORS[tree] || '#444',
      textTransform: 'uppercase',
    }}>
      {tree}
    </span>
  )
}

function ProfileRow({ agent, onClick }: { agent: AgentProfile; onClick: () => void }) {
  const flagColor = agent.prometheus_flag ? FLAG_COLORS[agent.prometheus_flag] : '#333'
  const daysSince = Math.floor((Date.now() - new Date(agent.last_seen).getTime()) / 86400000)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto',
        gap: 16,
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background 0.1s',
        alignItems: 'center',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#111')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <ScoreDot score={agent.prometheus_score} flag={agent.prometheus_flag} />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>{agent.name}</span>
          {agent.prometheus_flag === 'hot' && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--green)', letterSpacing: 2 }}>◈ HOT</span>
          )}
          {agent.anathema_run && <TreeBadge tree={agent.predicted_tree} />}
          {agent.hiring && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--green)', letterSpacing: 1 }}>▸ HIRING</span>
          )}
          {agent.youtube_channel && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#ff4444', letterSpacing: 1 }}>▸ YT</span>
          )}
          {agent.unresolved_upline && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#ff9800', letterSpacing: 1 }}>◎ UNRESOLVED</span>
          )}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
          {agent.city}, {agent.state}
          {agent.rating ? ` · ★ ${agent.rating} (${agent.reviews})` : ''}
        </div>
        {agent.prometheus_notes && (
          <div style={{ fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.4 }}>
            {agent.prometheus_notes.slice(0, 120)}{agent.prometheus_notes.length > 120 ? '…' : ''}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1, marginBottom: 4 }}>
          {daysSince === 0 ? 'TODAY' : daysSince === 1 ? '1 DAY AGO' : `${daysSince}d AGO`}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>
          ×{agent.search_count}
        </div>
        {!agent.anathema_run && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 1, marginTop: 4, textTransform: 'uppercase' }}>
            no scan
          </div>
        )}
      </div>
    </div>
  )
}

function DetailPanel({ agent, onClose }: { agent: AgentProfile; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          height: '100vh', overflowY: 'auto',
          background: '#0a0a0a',
          borderLeft: '1px solid var(--border)',
          padding: '32px 28px',
          animation: 'slideInRight 0.2s ease',
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

        {/* Score row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <div style={{
            width: 56, height: 56,
            border: `2px solid ${agent.prometheus_flag ? FLAG_COLORS[agent.prometheus_flag] : '#333'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: agent.prometheus_flag ? FLAG_COLORS[agent.prometheus_flag] : '#555' }}>
              {agent.prometheus_score ?? '—'}
            </span>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 2 }}>PROMETHEUS SCORE</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: agent.prometheus_flag ? FLAG_COLORS[agent.prometheus_flag] : '#555', letterSpacing: 2, textTransform: 'uppercase' }}>
              {agent.prometheus_flag || 'unscored'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1 }}>
              SEEN {agent.search_count}× · FIRST {new Date(agent.first_seen).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 10 }}>CONTACT</div>
          {agent.phone && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>· {agent.phone}</div>}
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>◎ {agent.city}, {agent.state}{agent.address ? ` — ${agent.address}` : ''}</div>
          {agent.rating && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>★ {agent.rating} ({agent.reviews} reviews)</div>}
          {agent.contact_email && (
            <a href={`mailto:${agent.contact_email}`} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textDecoration: 'none' }}>
              @ {agent.contact_email}
            </a>
          )}
          {agent.website && (
            <div style={{ marginTop: 8 }}>
              <a href={agent.website} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 1, textDecoration: 'none' }}>
                ↗ {agent.website}
              </a>
            </div>
          )}
        </div>

        {/* Intel */}
        {agent.prometheus_about && (
          <div style={{ marginBottom: 16, padding: '14px 16px', background: '#0f0f0d', border: '1px solid var(--border)', borderLeft: '2px solid var(--orange)' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 8 }}>INTEL</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>{agent.prometheus_about}</div>
          </div>
        )}

        {agent.prometheus_notes && (
          <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--orange-dim)', borderLeft: '2px solid var(--orange)' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
              {agent.prometheus_notes}
            </div>
          </div>
        )}

        {/* Carriers */}
        {agent.carriers && agent.carriers.length > 0 && agent.carriers[0] !== 'Unknown' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 8 }}>CARRIERS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {agent.carriers.map(c => (
                <span key={c} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px', border: '1px solid var(--border-light)', color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Enrichment badges */}
        {(agent.hiring || agent.youtube_channel) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {agent.hiring && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', background: 'rgba(0,200,100,0.06)', border: '1px solid var(--green)', color: 'var(--green)', letterSpacing: 1 }}>▸ ACTIVELY HIRING</span>
            )}
            {agent.youtube_channel && (
              <a href={agent.youtube_channel} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', background: 'rgba(255,68,68,0.06)', border: '1px solid #ff4444', color: '#ff4444', letterSpacing: 1, textDecoration: 'none' }}>
                ▸ YOUTUBE
              </a>
            )}
          </div>
        )}

        {/* ANATHEMA section */}
        <div style={{ padding: '16px', background: 'var(--card)', border: '1px solid var(--border)', borderLeft: agent.anathema_run ? '2px solid var(--green)' : '2px solid #222', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: agent.anathema_run ? 'var(--green)' : '#555', letterSpacing: 2 }}>ANATHEMA ANALYSIS</div>
            {agent.anathema_scanned_at && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 1 }}>
                {new Date(agent.anathema_scanned_at).toLocaleDateString()}
              </div>
            )}
          </div>
          {agent.anathema_run ? (
            <>
              {/* Tree + Confidence */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: TREE_COLORS[agent.predicted_tree || 'unknown'] }}>
                  {agent.predicted_tree?.toUpperCase() || 'UNKNOWN'}
                </span>
                {agent.predicted_confidence != null && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#555', letterSpacing: 1 }}>CONFIDENCE</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: agent.predicted_confidence >= 70 ? 'var(--green)' : agent.predicted_confidence >= 40 ? 'var(--orange)' : '#ff4444', letterSpacing: 1 }}>
                      {agent.predicted_confidence}%
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-IMO */}
              {agent.predicted_sub_imo && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#555', letterSpacing: 1, marginBottom: 4 }}>PREDICTED UPLINE</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 1 }}>{agent.predicted_sub_imo}</div>
                </div>
              )}

              {/* Unresolved */}
              {agent.unresolved_upline && (
                <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(255,152,0,0.06)', border: '1px solid rgba(255,152,0,0.2)' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#ff9800', letterSpacing: 1, marginBottom: 3 }}>◎ UNRESOLVED UPLINE</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#ff9800', letterSpacing: 1 }}>{agent.unresolved_upline}</div>
                </div>
              )}

              {/* Signals */}
              {agent.anathema_signals && agent.anathema_signals.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#555', letterSpacing: 1, marginBottom: 6 }}>DETECTION SIGNALS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {agent.anathema_signals.slice(0, 6).map((sig: string, i: number) => (
                      <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '2px 7px', border: '1px solid #2a2a2a', color: '#555', letterSpacing: 1 }}>
                        {sig.length > 40 ? sig.slice(0, 40) + '…' : sig}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1 }}>
              NOT SCANNED · Run ANATHEMA from the search page to classify this agent.
            </div>
          )}
        </div>

        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(40px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}

export default function DatabasePage() {
  const [agents, setAgents] = useState<AgentProfile[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AgentProfile | null>(null)

  // Filters
  const [filterFlag, setFilterFlag] = useState<string>('all')
  const [filterTree, setFilterTree] = useState<string>('all')
  const [filterAnathema, setFilterAnathema] = useState<string>('all')
  const [filterState, setFilterState] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'last_seen' | 'search_count'>('last_seen')

  // Pagination
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [pagination, setPagination] = useState<{ total: number; total_pages: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        flag: filterFlag,
        tree: filterTree,
        anathema: filterAnathema,
        state: filterState,
        search,
        sort: sortBy,
        page: String(page),
        per_page: String(perPage),
      })
      const res = await fetch(`/api/database?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAgents(data.agents || [])
      setStats(data.stats || null)
      setPagination(data.pagination || null)
    } catch {
      setAgents([])
    } finally {
      setLoading(false)
    }
  }, [filterFlag, filterTree, filterAnathema, filterState, search, sortBy, page, perPage])

  useEffect(() => { load() }, [load])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [filterFlag, filterTree, filterAnathema, filterState, search, sortBy, perPage])

  const states = [...new Set(agents.map(a => a.state))].sort()

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 4, color: 'var(--white)', marginBottom: 6 }}>
          AGENT DATABASE
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2 }}>
          Every agent surfaced by your searches — enriched, scored, and stored.
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, marginBottom: 28 }}>
          {[
            { label: 'TOTAL PROFILES', value: stats.total, color: 'var(--white)' },
            { label: '◈ HOT', value: stats.hot, color: 'var(--green)' },
            { label: 'ANATHEMA SCANNED', value: stats.anathema_run, color: 'var(--green)' },
            { label: 'STATES', value: stats.states, color: 'var(--orange)' },
            { label: '▸ HIRING', value: stats.hiring, color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#555', letterSpacing: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
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

        {/* Flag filter */}
        {(['all', 'hot', 'warm', 'cold'] as const).map(f => (
          <button key={f} onClick={() => setFilterFlag(f)} style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, padding: '7px 14px',
            background: filterFlag === f ? (f === 'all' ? 'var(--border)' : FLAG_COLORS[f]) : 'transparent',
            border: `1px solid ${filterFlag === f ? (f === 'all' ? 'var(--border)' : FLAG_COLORS[f]) : 'var(--border)'}`,
            color: filterFlag === f ? (f === 'cold' ? 'var(--white)' : 'var(--black)') : 'var(--muted)',
            cursor: 'pointer', textTransform: 'uppercase',
          }}>
            {f === 'all' ? 'ALL FLAGS' : f.toUpperCase()}
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* Anathema filter */}
        {([
          { val: 'all', label: 'ALL' },
          { val: 'scanned', label: 'SCANNED' },
          { val: 'unscanned', label: 'NOT SCANNED' },
        ] as const).map(o => (
          <button key={o.val} onClick={() => setFilterAnathema(o.val)} style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, padding: '7px 14px',
            background: filterAnathema === o.val ? 'var(--border)' : 'transparent',
            border: `1px solid ${filterAnathema === o.val ? 'var(--border-light)' : 'var(--border)'}`,
            color: filterAnathema === o.val ? 'var(--white)' : 'var(--muted)',
            cursor: 'pointer',
          }}>
            {o.label}
          </button>
        ))}

        {/* State filter */}
        <select
          value={filterState}
          onChange={e => setFilterState(e.target.value)}
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '7px 12px',
            background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer',
          }}
        >
          <option value="all">ALL STATES</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '7px 12px',
            background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          <option value="last_seen">RECENT FIRST</option>
          <option value="score">HIGHEST SCORE</option>
          <option value="search_count">MOST SEARCHED</option>
        </select>

        {/* Per page */}
        <select
          value={perPage}
          onChange={e => setPerPage(Number(e.target.value))}
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '7px 12px',
            background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer',
          }}
        >
          <option value={10}>10 / PAGE</option>
          <option value={50}>50 / PAGE</option>
          <option value={100}>100 / PAGE</option>
        </select>
      </div>

      {/* Results count */}
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 8 }}>
        {loading ? 'LOADING...' : `${agents.length} PROFILES`}
        {filterFlag !== 'all' || filterTree !== 'all' || filterAnathema !== 'all' || filterState !== 'all' || search
          ? ' (FILTERED)' : ''}
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 16, padding: '8px 20px', borderBottom: '1px solid var(--border)' }}>
        <div />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2 }}>AGENT</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 2, textAlign: 'right' }}>LAST SEEN</div>
      </div>

      {/* Agent list */}
      <div style={{ border: '1px solid var(--border)', borderTop: 'none' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#333', letterSpacing: 3 }}>
            QUERYING DATABASE...
          </div>
        ) : agents.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: '#1a1a1a', marginBottom: 12, letterSpacing: 4 }}>
              NO PROFILES YET
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#333', letterSpacing: 2 }}>
              Run searches to start building your database.
            </div>
          </div>
        ) : (
          agents.map(agent => (
            <ProfileRow key={agent.id} agent={agent} onClick={() => setSelected(agent)} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2 }}>
            PAGE {page} OF {pagination.total_pages} · {pagination.total} TOTAL
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '6px 12px',
                background: 'transparent', border: '1px solid var(--border)',
                color: page === 1 ? '#333' : 'var(--muted)', cursor: page === 1 ? 'default' : 'crosshair',
              }}
            >«</button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '6px 14px',
                background: 'transparent', border: '1px solid var(--border)',
                color: page === 1 ? '#333' : 'var(--muted)', cursor: page === 1 ? 'default' : 'crosshair',
              }}
            >PREV</button>

            {/* Page number pills */}
            {Array.from({ length: Math.min(7, pagination.total_pages) }, (_, i) => {
              const totalPages = pagination.total_pages
              let pageNum: number
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (page <= 4) {
                pageNum = i + 1
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = page - 3 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '6px 12px',
                    background: pageNum === page ? 'var(--border-light)' : 'transparent',
                    border: `1px solid ${pageNum === page ? 'var(--border-light)' : 'var(--border)'}`,
                    color: pageNum === page ? 'var(--white)' : 'var(--muted)', cursor: 'crosshair',
                    minWidth: 32,
                  }}
                >{pageNum}</button>
              )
            })}

            <button
              onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
              disabled={page === pagination.total_pages}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '6px 14px',
                background: 'transparent', border: '1px solid var(--border)',
                color: page === pagination.total_pages ? '#333' : 'var(--muted)',
                cursor: page === pagination.total_pages ? 'default' : 'crosshair',
              }}
            >NEXT</button>
            <button
              onClick={() => setPage(pagination.total_pages)}
              disabled={page === pagination.total_pages}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '6px 12px',
                background: 'transparent', border: '1px solid var(--border)',
                color: page === pagination.total_pages ? '#333' : 'var(--muted)',
                cursor: page === pagination.total_pages ? 'default' : 'crosshair',
              }}
            >»</button>
          </div>
        </div>
      )}
      {selected && <DetailPanel agent={selected} onClose={() => setSelected(null)} />}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        select option { background: #111; }
      `}</style>
    </div>
  )
}
