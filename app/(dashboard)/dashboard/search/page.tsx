'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const MODES = [
  { value: 'medicare',  label: 'Medicare / Senior',    desc: 'Medicare Advantage, Supplement, PDP' },
  { value: 'life',      label: 'Life / Final Expense', desc: 'Term, whole life, final expense' },
  // { value: 'annuities', label: 'Annuities',            desc: 'Fixed indexed, MYGA, retirement income' },
  // { value: 'financial', label: 'Financial Advisors',   desc: 'Wealth management, CFP, retirement planning' },
]

const SEARCH_TIPS = [
  { label: 'Major metro',    example: 'Kansas City, MO', tip: 'Use the largest city in the metro' },
  { label: 'Suburb market',  example: 'Overland Park, KS', tip: 'Suburban cities often have dense independent agents' },
  { label: 'Rural market',   example: 'Salina, KS', tip: 'Smaller cities = less competition, easier to recruit' },
  { label: 'Retirement hub', example: 'Sarasota, FL', tip: 'High Medicare-eligible population = more agents' },
]

const LOADING_STEPS = [
  'Querying Google local listings',
  'Deep crawling agent websites',
  'Checking job postings',
  'Scanning YouTube presence',
  'Scoring recruitability',
]

type Agent = {
  name: string; type: string; phone: string; address: string
  rating: number; reviews: number; website: string | null
  carriers: string[]; captive: boolean; score: number
  flag: 'hot' | 'warm' | 'cold'; notes: string; years: number | null
  hiring: boolean; hiring_roles: string[]
  youtube_channel: string | null; youtube_subscribers: string | null; youtube_video_count: number
  about: string | null; contact_email: string | null; social_links: string[]
}

type CitySuggestion = { city: string; state: string; state_name: string; county: string; label: string }

// ── Score circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score, size = 52 }: { score: number; size?: number }) {
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--muted)'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}`, background: `${color}0d`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.38, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color, letterSpacing: 1, textTransform: 'uppercase' }}>SCORE</div>
    </div>
  )
}

// ── Recruit badge ─────────────────────────────────────────────────────────────
function RecruitBadge({ flag }: { flag: 'hot' | 'warm' | 'cold' }) {
  const map = {
    hot:  { color: 'var(--green)',  label: '◈ HOT' },
    warm: { color: 'var(--yellow)', label: 'WARM' },
    cold: { color: '#555',          label: 'PASS' },
  }
  const { color, label } = map[flag]
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace", fontSize: 8,
      padding: '2px 6px', border: `1px solid ${color}`, color,
      letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap',
    }}>
      {label}
    </div>
  )
}

// ── Compact list card ─────────────────────────────────────────────────────────
function CompactAgentCard({
  agent, index, isSelected, onSelect,
}: {
  agent: Agent; index: number; isSelected: boolean; onSelect: () => void
}) {
  const flagColor = agent.flag === 'hot' ? 'var(--green)' : agent.flag === 'warm' ? 'var(--yellow)' : 'var(--border)'

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? '#1a1814' : 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: isSelected ? `3px solid ${flagColor}` : '3px solid transparent',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        animation: `slideIn 0.3s ease ${index * 0.04}s both`,
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-light)'
          ;(e.currentTarget as HTMLDivElement).style.background = '#181818'
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--card)'
        }
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {agent.name}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            {agent.type}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            {agent.rating > 0 && (
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>★ {agent.rating} ({agent.reviews})</div>
            )}
            {agent.address && (
              <div style={{ fontSize: 11, color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                {agent.address}
              </div>
            )}
          </div>

          {agent.phone && (
            <div style={{ fontSize: 11, color: '#666', marginBottom: 6, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}>
              {agent.phone}
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {agent.hiring && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, padding: '2px 6px', border: '1px solid var(--border-light)', color: 'var(--green)', letterSpacing: 1 }}>
                HIRING
              </div>
            )}
            {agent.youtube_channel && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, padding: '2px 6px', border: '1px solid #ff4444', color: '#ff4444', letterSpacing: 1 }}>
                YT
              </div>
            )}
            {agent.website && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, padding: '2px 6px', border: '1px solid var(--border-light)', color: '#444', letterSpacing: 1 }}>
                WEB
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <ScoreCircle score={agent.score} size={44} />
          <RecruitBadge flag={agent.flag} />
        </div>
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ agent }: { agent: Agent | null }) {
  if (!agent) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--card)', border: '1px solid var(--border)',
        minHeight: 400, position: 'relative', overflow: 'hidden',
      }}>
        <style>{`@keyframes heroScanline { 0% { top: -2px; } 100% { top: 100%; } } .hero-scanline { position: absolute; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,85,0,0.12), transparent); animation: heroScanline 3s linear infinite; pointer-events: none; }`}</style>
        <div className="hero-scanline" />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#1e1c18', letterSpacing: 4, userSelect: 'none' }}>
          RECRUITERRR
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2a2a2a', letterSpacing: 3, marginTop: 8 }}>
          SELECT AN AGENT TO VIEW INTEL
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', overflow: 'auto' }}>
      {/* Agent header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>{agent.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
              {agent.type}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <ScoreCircle score={agent.score} size={56} />
            <RecruitBadge flag={agent.flag} />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 12 }}>
          {agent.phone && (
            <a href={`tel:${agent.phone}`} style={{ fontSize: 14, color: 'var(--white)', fontFamily: "'DM Mono', monospace", textDecoration: 'none' }}>
              {agent.phone}
            </a>
          )}
          {agent.rating > 0 && (
            <div style={{ fontSize: 13, color: 'var(--white)' }}>
              ★ {agent.rating} <span style={{ color: 'var(--muted)' }}>({agent.reviews} reviews)</span>
            </div>
          )}
          {agent.address && (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>◎ {agent.address}</div>
          )}
        </div>

        {/* Carriers */}
        {agent.carriers.length > 0 && agent.carriers[0] !== 'Unknown' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {agent.carriers.map(c => (
              <span key={c} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '2px 8px', border: '1px solid var(--border-light)', color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {agent.hiring && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '3px 10px', border: '1px solid rgba(0,230,118,0.4)', color: 'var(--green)', letterSpacing: 1 }}>
              ▸ HIRING{agent.hiring_roles.length > 0 ? ` — ${agent.hiring_roles[0]}` : ''}
            </div>
          )}
          {agent.youtube_channel && (
            <a href={agent.youtube_channel} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '3px 10px', background: 'rgba(255,0,0,0.08)', border: '1px solid #ff4444', color: '#ff4444', letterSpacing: 1, textDecoration: 'none' }}>
              ▸ YOUTUBE{agent.youtube_subscribers ? ` — ${agent.youtube_subscribers}` : ''}
            </a>
          )}
        </div>
      </div>

      {/* AI analyst notes */}
      {agent.notes && (
        <div style={{ margin: '16px 24px 0', padding: '14px 16px', background: 'var(--orange-dim)', borderLeft: '2px solid var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5, color: 'var(--white)', lineHeight: 1.7 }}>
          {agent.notes}
        </div>
      )}

      {/* Hiring roles */}
      {agent.hiring && agent.hiring_roles.length > 0 && (
        <div style={{ margin: '12px 24px 0', padding: '10px 14px', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 2, marginBottom: 6 }}>ACTIVE JOB POSTINGS</div>
          {agent.hiring_roles.map(r => (
            <div key={r} style={{ fontSize: 13, color: 'var(--white)' }}>• {r}</div>
          ))}
        </div>
      )}

      {/* About */}
      {agent.about && (
        <div style={{ margin: '12px 24px 0', padding: '12px 16px', background: '#1e1c18', border: '1px solid var(--border)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--white)', lineHeight: 1.7 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>ABOUT</div>
          {agent.about}
        </div>
      )}

      {/* Links */}
      <div style={{ margin: '12px 24px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {agent.contact_email && (
          <a href={`mailto:${agent.contact_email}`}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '4px 10px', border: '1px solid var(--border-light)', color: 'var(--white)', letterSpacing: 1, textDecoration: 'none' }}>
            @ {agent.contact_email}
          </a>
        )}
        {(agent.social_links || []).map((link, i) => {
          const label = link.includes('facebook') ? 'FB' : link.includes('linkedin') ? 'LI' : link.includes('instagram') ? 'IG' : link.includes('twitter') || link.includes('x.com') ? 'TW' : '↗'
          return (
            <a key={i} href={link} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '4px 10px', border: '1px solid var(--border-light)', color: 'var(--white)', letterSpacing: 1, textDecoration: 'none' }}>
              {label}
            </a>
          )
        })}
        {agent.website && (
          <a href={agent.website} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 1, textDecoration: 'none', padding: '4px 0' }}>
            {agent.website} ↗
          </a>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function SearchPageInner() {
  const searchParams = useSearchParams()

  const [city, setCity]                   = useState('')
  const [state, setState]                 = useState('KS')
  const [mode, setMode]                   = useState('medicare')
  const [loading, setLoading]             = useState(false)
  const [currentStep, setCurrentStep]     = useState(-1)
  const [agents, setAgents]               = useState<Agent[]>([])
  const [searched, setSearched]           = useState(false)
  const [searchLabel, setSearchLabel]     = useState('')
  const [error, setError]                 = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showAll, setShowAll]             = useState(false)
  const [searchCollapsed, setSearchCollapsed] = useState(false)

  // City autocomplete
  const [suggestions, setSuggestions]     = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [acLoading, setAcLoading]         = useState(false)
  const acRef   = useRef<HTMLDivElement>(null)
  const acTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load saved search from URL param
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) loadSavedSearch(id)
  }, [])

  // Close autocomplete on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (acRef.current && !acRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleCityChange(val: string) {
    setCity(val)
    if (acTimer.current) clearTimeout(acTimer.current)
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    setAcLoading(true)
    acTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(val)}`)
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions((data.suggestions || []).length > 0)
      } catch {}
      setAcLoading(false)
    }, 250)
  }

  function selectSuggestion(s: CitySuggestion) {
    setCity(s.city)
    setState(s.state)
    setSuggestions([])
    setShowSuggestions(false)
  }

  async function loadSavedSearch(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/searches?id=${id}`)
      const data = await res.json()
      if (data.search) {
        setAgents(data.search.agents_json || [])
        setCity(data.search.city)
        setState(data.search.state)
        setSearchLabel(`${data.search.city.toUpperCase()}, ${data.search.state}`)
        setSearched(true)
        setSearchCollapsed(true)
      }
    } catch {}
    setLoading(false)
  }

  async function runSearch(overrideCity?: string, overrideState?: string) {
    const searchCity  = overrideCity  || city
    const searchState = overrideState || state
    if (!searchCity.trim()) return

    setLoading(true)
    setSearched(false)
    setAgents([])
    setError('')
    setCurrentStep(0)
    setSelectedIndex(null)
    setShowAll(false)

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => prev < LOADING_STEPS.length - 1 ? prev + 1 : prev)
    }, 1800)

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: searchCity.trim(), state: searchState, limit: 20, mode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAgents(data.agents || [])
      setCity(searchCity)
      setState(searchState)
      setSearchLabel(`${searchCity.toUpperCase()}, ${searchState}`)
      setSearchCollapsed(true)
    } catch (err: any) {
      setError(err.message || 'Search failed. Try again.')
    }

    clearInterval(stepInterval)
    setCurrentStep(-1)
    setLoading(false)
    setSearched(true)
  }

  const selectedAgent = selectedIndex !== null ? agents[selectedIndex] : null

  // Only show HOT and WARM by default; reveal COLD on toggle
  const visibleAgents = showAll ? agents : agents.filter(a => a.flag !== 'cold')
  const coldCount     = agents.filter(a => a.flag === 'cold').length
  const hotCount      = agents.filter(a => a.flag === 'hot').length
  const warmCount     = agents.filter(a => a.flag === 'warm').length

  return (
    <div style={{ padding: '40px', maxWidth: 1400, minHeight: '100vh' }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadSlide { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a1814; }
      `}</style>

      {/* ── Page header (hidden once searched) ── */}
      {!searchCollapsed && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            Market Search
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>
            FIND AGENTS<span style={{ color: 'var(--orange)' }}>.</span>
          </h1>
        </div>
      )}

      {/* ── Collapsed search bar (post-search) ── */}
      {searchCollapsed ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'var(--card)', border: '1px solid var(--border-light)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)', letterSpacing: 1 }}>
              {searchLabel} · {agents.length} results
            </span>
          </div>
          <button
            onClick={() => { setSearchCollapsed(false); setSearched(false); setAgents([]) }}
            style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '5px 12px', cursor: 'pointer' }}
          >
            NEW SEARCH ↓
          </button>
        </div>
      ) : (
        /* ── Search form ── */
        <>
          <div style={{
            display: 'flex', gap: 0,
            border: `1px solid ${loading ? 'var(--orange)' : 'var(--border-light)'}`,
            background: 'var(--card)', marginBottom: 12,
            boxShadow: loading ? '0 0 0 1px var(--orange)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            {/* Mode selector */}
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
              disabled={loading}
              style={{ width: 180, padding: '18px 12px', background: 'transparent', border: 'none', borderRight: '1px solid var(--border-light)', outline: 'none', color: 'var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer', appearance: 'none', textAlign: 'center', letterSpacing: 1, flexShrink: 0 }}
            >
              {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>

            {/* City autocomplete */}
            <div ref={acRef} style={{ position: 'relative', flex: 1 }}>
              <input
                value={city}
                onChange={e => handleCityChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); runSearch() } if (e.key === 'Escape') setShowSuggestions(false) }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="City"
                disabled={loading}
                autoComplete="off"
                style={{ width: '100%', padding: '18px 20px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }}
              />
              {acLoading && (
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <div style={{ width: 10, height: 10, border: '1px solid var(--border-light)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: -1, right: -1, background: 'var(--card)', border: '1px solid var(--border-light)', borderTop: 'none', zIndex: 300 }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onMouseDown={() => selectSuggestion(s)}
                      style={{ padding: '11px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1f1d19')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)' }}>{s.city}</span>
                        {s.county && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1, marginLeft: 8 }}>{s.county} CO.</span>}
                      </div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, flexShrink: 0 }}>{s.state}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search button */}
            <button
              onClick={() => runSearch()}
              disabled={loading || !city.trim()}
              style={{ padding: '18px 36px', background: loading ? '#333' : 'var(--orange)', border: 'none', borderLeft: '1px solid var(--border-light)', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: 'var(--black)', transition: 'background 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {loading ? 'SCANNING...' : 'SEARCH'}
            </button>
          </div>

          {/* Search tips (shown before first search only) */}
          {!searched && !loading && (
            <div style={{ marginTop: 32, marginBottom: 40 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
                Search Tips
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                {SEARCH_TIPS.map(tip => (
                  <div
                    key={tip.label}
                    onClick={() => {
                      const [c, s] = tip.example.split(', ')
                      setCity(c)
                      if (s) setState(s)
                      runSearch(c, s || state)
                    }}
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{tip.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--orange)', marginBottom: 4 }}>{tip.example}</div>
                    <div style={{ fontSize: 11, color: '#444' }}>{tip.tip}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Loading state ── */}
      {loading && currentStep >= 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--orange)', animation: 'loadSlide 1s ease-in-out infinite' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LOADING_STEPS.map((step, i) => (
              <div key={step} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10, color: i < currentStep ? 'var(--green)' : i === currentStep ? 'var(--orange)' : '#333', transition: 'color 0.3s' }}>
                <span style={{ fontSize: 8 }}>{i < currentStep ? '●' : i === currentStep ? '◐' : '○'}</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '16px 20px', border: '1px solid var(--red)', background: 'rgba(255,23,68,0.05)', color: 'var(--red)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1, marginBottom: 32 }}>
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {searched && !loading && (
        <>
          {/* Results header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
              {searchLabel} — {MODES.find(m => m.value === mode)?.label} Agents
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)' }}>◈ {hotCount} HOT</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--yellow)' }}>{warmCount} WARM</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--orange)' }}>{agents.length} TOTAL</div>
            </div>
          </div>

          {/* Signal badges */}
          {agents.length > 0 && (
            <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)' }}>
                ◈ {agents.filter(a => a.hiring).length} ACTIVELY HIRING
              </div>
              <div style={{ flex: 1, padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#ff4444' }}>
                ▸ {agents.filter(a => a.youtube_channel).length} HAVE YOUTUBE
              </div>
              <div style={{ flex: 1, padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)' }}>
                ◎ {agents.filter(a => a.website).length} HAVE WEBSITE
              </div>
            </div>
          )}

          {agents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#222', marginBottom: 12 }}>NO AGENTS FOUND</div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Try a larger city or different search terms.</div>
            </div>
          ) : (
            /* ── TWO COLUMN: list + detail ── */
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 0, alignItems: 'start' }}>

              {/* LEFT: Agent list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderRight: '1px solid var(--border)' }}>
                {visibleAgents.map((agent, i) => (
                  <CompactAgentCard
                    key={i}
                    agent={agent}
                    index={i}
                    isSelected={selectedIndex === i}
                    onSelect={() => setSelectedIndex(i)}
                  />
                ))}

                {/* Show COLD toggle */}
                {coldCount > 0 && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    style={{ margin: '4px 0', padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, cursor: 'pointer', textAlign: 'center' }}
                  >
                    {showAll ? `▲ HIDE ${coldCount} PASS` : `▼ SHOW ${coldCount} PASS`}
                  </button>
                )}
              </div>

              {/* RIGHT: Detail panel */}
              <div style={{ position: 'sticky', top: 16 }}>
                <DetailPanel agent={selectedAgent} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 40px', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading...</div>}>
      <SearchPageInner />
    </Suspense>
  )
}
