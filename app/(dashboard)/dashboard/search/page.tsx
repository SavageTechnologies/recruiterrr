'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Agent, CitySuggestion }  from '@/components/search/types'
import { CompactAgentCard }            from '@/components/search/CompactAgentCard'
import { DetailPanel }                 from '@/components/search/DetailPanel'
import { MarketSummary }               from '@/components/search/MarketSummary'
import { MODES, LOADING_PHASES }       from '@/components/search/searchData'

// Minimal static list — just abbr + name, no city data. Cities come from the DB.
const US_STATES = [
  { abbr: 'AL', name: 'Alabama' },       { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' },       { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' },    { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' },   { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' },       { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' },        { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' },      { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' },          { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' },      { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' },         { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' },     { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' },      { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' },      { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' },    { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' },{ abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' },          { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' },        { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' },  { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' },  { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' },         { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' },       { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' },    { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' },     { abbr: 'WY', name: 'Wyoming' },
]

// ─────────────────────────────────────────────────────────────────────────────

function SearchPageInner() {
  const searchParams = useSearchParams()
  const [city, setCity]                       = useState('')
  const [state, setState]                     = useState('')
  const [mode, setMode]                       = useState('')
  const [loading, setLoading]                 = useState(false)
  const [currentStep, setCurrentStep]         = useState(-1)
  const [agents, setAgents]                   = useState<Agent[]>([])
  const [searched, setSearched]               = useState(false)
  const [searchLabel, setSearchLabel]         = useState('')
  const [error, setError]                     = useState('')
  const [selectedIndex, setSelectedIndex]     = useState<number | null>(null)
  const [showAll, setShowAll]                 = useState(false)
  const [searchCollapsed, setSearchCollapsed] = useState(false)
  const [suggestions, setSuggestions]         = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [acLoading, setAcLoading]             = useState(false)

  // Browse drawer state
  const [browseOpen, setBrowseOpen]           = useState(true)
  const [browseState, setBrowseState]         = useState<string | null>(null)
  const [browseStateName, setBrowseStateName] = useState('')
  const [browseCities, setBrowseCities]       = useState<{ city: string; county: string }[]>([])
  const [browseCitiesLoading, setBrowseCitiesLoading] = useState(false)
  const [cityFilter, setCityFilter]           = useState('')

  const acRef     = useRef<HTMLDivElement>(null)
  const acTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) loadSavedSearch(id)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (acRef.current && !acRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (detailRef.current) detailRef.current.scrollTop = 0
  }, [selectedIndex])

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

  // Called from the browse drawer — selects a city and closes everything
  function selectBrowseCity(c: string, st: string) {
    setCity(c)
    setState(st)
    setBrowseOpen(false)
    setBrowseState(null)
    setBrowseCities([])
    setCityFilter('')
  }

  // Fetch cities for a state from the DB when user drills in
  async function openBrowseState(abbr: string, name: string) {
    setBrowseState(abbr)
    setBrowseStateName(name)
    setCityFilter('')
    setBrowseCitiesLoading(true)
    try {
      const res = await fetch(`/api/autocomplete?state=${abbr}`)
      const data = await res.json()
      setBrowseCities(data.cities || [])
    } catch {
      setBrowseCities([])
    }
    setBrowseCitiesLoading(false)
  }

  function closeBrowse() {
    setBrowseOpen(false)
    setBrowseState(null)
    setBrowseCities([])
    setCityFilter('')
  }

  async function loadSavedSearch(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/searches?id=${id}`)
      const data = await res.json()
      if (data.search) {
        setAgents(data.search.agents_json || [])
        setCity(data.search.city); setState(data.search.state)
        setSearchLabel(`${data.search.city.toUpperCase()}, ${data.search.state}`)
        setSearched(true); setSearchCollapsed(true)
      }
    } catch {}
    setLoading(false)
  }

  async function runSearch(overrideCity?: string, overrideState?: string) {
    const searchCity  = overrideCity  || city
    const searchState = overrideState || state
    if (!searchCity.trim() || !searchState || !mode) return

    setLoading(true); setSearched(false); setAgents([])
    setError(''); setCurrentStep(0); setSelectedIndex(null); setShowAll(false)

    const PHASE_TIMINGS = [2000, 5000, 9000, 13000, 17000, 23000]
    const timers: ReturnType<typeof setTimeout>[] = []
    PHASE_TIMINGS.forEach((ms, i) => { timers.push(setTimeout(() => setCurrentStep(i), ms)) })

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: searchCity.trim(), state: searchState, limit: 20, mode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAgents(data.agents || [])
      setCity(searchCity); setState(searchState)
      setSearchLabel(`${searchCity.toUpperCase()}, ${searchState}`)
      setSearchCollapsed(true)
    } catch (err: any) {
      setError(err.message || 'Search failed. Try again.')
    }

    timers.forEach(clearTimeout)
    setCurrentStep(-1); setLoading(false); setSearched(true)
  }

  const selectedAgent = selectedIndex !== null ? agents[selectedIndex] : null
  const visibleAgents = showAll ? agents : agents.filter(a => a.flag !== 'cold')
  const coldCount     = agents.filter(a => a.flag === 'cold').length
  const hotCount      = agents.filter(a => a.flag === 'hot').length
  const warmCount     = agents.filter(a => a.flag === 'warm').length

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400 }}>

      {!searchCollapsed && (
        <div style={{ marginBottom: 22 }}>
          <div className="page-eyebrow">Agent Search</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'var(--text-hero)', letterSpacing: 2, color: 'var(--text-1)', lineHeight: 0.9 }}>
            FIND AGENTS<span style={{ color: 'var(--orange)' }}>.</span>
          </h1>
        </div>
      )}

      <>
        {searchCollapsed ? (
          <CollapsedBar
            searchLabel={searchLabel} agents={agents}
            hotCount={hotCount} warmCount={warmCount}
            onReset={() => { setSearchCollapsed(false); setSearched(false); setAgents([]); setSelectedIndex(null) }}
          />
        ) : (
          <>
            <SearchForm
              city={city} state={state} mode={mode} loading={loading}
              acRef={acRef} acLoading={acLoading}
              suggestions={suggestions} showSuggestions={showSuggestions}
              onCityChange={handleCityChange}
              onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); runSearch() } if (e.key === 'Escape') setShowSuggestions(false) }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onModeChange={e => setMode(e.target.value)}
              onSelectSuggestion={selectSuggestion}
              onSearch={() => runSearch()}
            />

            {/* ── Market browser — always open ── */}
            {browseOpen && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginBottom: 28,
                boxShadow: '0 2px 12px var(--shadow-sm)',
                animation: 'slideDown 0.18s ease both',
              }}>

                {/* Drawer header */}
                <div style={{
                  padding: '11px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12,
                }}>
                  {!browseState ? (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 2 }}>
                      SELECT A STATE
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => { setBrowseState(null); setBrowseCities([]); setCityFilter('') }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)',
                          letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5,
                          transition: 'color 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                      >
                        ← ALL STATES
                      </button>
                      <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, color: 'var(--text-1)', letterSpacing: 1.5 }}>
                        {browseStateName.toUpperCase()}
                      </div>
                      {!browseCitiesLoading && (
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-4)', letterSpacing: 1 }}>
                          {browseCities.length} markets
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* State grid */}
                {!browseState && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                    gap: 0,
                  }}>
                    {US_STATES.map((s, i) => (
                      <div
                        key={s.abbr}
                        onClick={() => openBrowseState(s.abbr, s.name)}
                        style={{
                          padding: '12px 8px', cursor: 'pointer',
                          borderRight: '1px solid var(--border)',
                          borderBottom: '1px solid var(--border)',
                          textAlign: 'center',
                          transition: 'background 0.1s',
                          animation: `fadeIn 0.2s ease ${i * 0.005}s both`,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, color: 'var(--text-1)', letterSpacing: 1, lineHeight: 1 }}>{s.abbr}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, color: 'var(--text-4)', marginTop: 3, lineHeight: 1.3 }}>{s.name}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* City list */}
                {browseState && (
                  <div style={{
                    padding: '14px 16px',
                    display: 'flex', flexWrap: 'wrap', gap: 6,
                    maxHeight: 260, overflowY: 'auto',
                    minHeight: 80,
                  }}>
                    {browseCitiesLoading && (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-3)', padding: '20px 0', width: '100%', textAlign: 'center' }}>
                        Loading...
                      </div>
                    )}
                    {!browseCitiesLoading && browseCities.length === 0 && (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-3)', padding: '20px 0' }}>
                        {cityFilter ? `No cities match "${cityFilter}"` : 'No cities found.'}
                      </div>
                    )}
                    {!browseCitiesLoading && browseCities.map((c, i) => (
                      <button
                        key={c.city}
                        onClick={() => selectBrowseCity(c.city, browseState)}
                        style={{
                          padding: '7px 13px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 11, fontWeight: 500, letterSpacing: 0.3,
                          color: 'var(--text-2)',
                          transition: 'all 0.1s',
                          animation: `slideIn 0.14s ease ${i * 0.012}s both`,
                          boxShadow: '0 1px 2px var(--shadow-sm)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'var(--orange-dim)'
                          e.currentTarget.style.borderColor = 'var(--orange-border)'
                          e.currentTarget.style.color = 'var(--orange)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'var(--bg-card)'
                          e.currentTarget.style.borderColor = 'var(--border)'
                          e.currentTarget.style.color = 'var(--text-2)'
                          e.currentTarget.style.boxShadow = '0 1px 2px var(--shadow-sm)'
                        }}
                      >
                        {c.city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {loading && currentStep >= 0 && LOADING_PHASES[currentStep] && (
          <div style={{ marginBottom: 36 }}>
            <div style={{
              padding: '14px 18px',
              background: 'var(--bg-card)', border: '1px solid var(--orange-border)',
              borderLeft: '3px solid var(--orange)', borderRadius: 'var(--radius)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--orange)', fontSize: 9, animation: 'pulse 1s infinite' }}>◐</span>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
                    {LOADING_PHASES[currentStep].label}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-3)', letterSpacing: 0.5 }}>
                    {LOADING_PHASES[currentStep].detail}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '14px 18px', border: '1px solid var(--sig-red-border)',
            background: 'var(--sig-red-dim)', color: 'var(--sig-red)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 1,
            marginBottom: 28, borderRadius: 'var(--radius)',
          }}>
            {error}
          </div>
        )}

        {searched && !loading && (
          <SearchResults
            agents={agents} visibleAgents={visibleAgents}
            selectedIndex={selectedIndex} selectedAgent={selectedAgent}
            hotCount={hotCount} warmCount={warmCount} coldCount={coldCount}
            showAll={showAll} searchLabel={searchLabel} mode={mode}
            detailRef={detailRef}
            onSelectAgent={setSelectedIndex}
            onToggleShowAll={() => setShowAll(v => !v)}
          />
        )}
      </>
    </div>
  )
}

// ── CollapsedBar ──────────────────────────────────────────────────────────────

function CollapsedBar({ searchLabel, agents, hotCount, warmCount, onReset }: {
  searchLabel: string; agents: Agent[]; hotCount: number; warmCount: number; onReset: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 16px', background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      marginBottom: 14, boxShadow: '0 1px 4px var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sig-green)' }} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-1)', fontWeight: 600 }}>{searchLabel}</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)' }}>· {agents.length} agents</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--sig-green)', fontWeight: 500 }}>● {hotCount} HOT</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--sig-yellow)' }}>{warmCount} WARM</span>
      </div>
      <button onClick={onReset} className="btn-ghost">NEW SEARCH ↓</button>
    </div>
  )
}

// ── SearchForm ────────────────────────────────────────────────────────────────

function SearchForm({ city, state, mode, loading, acRef, acLoading, suggestions, showSuggestions,
  onCityChange, onKeyDown, onFocus, onModeChange, onSelectSuggestion, onSearch }: {
  city: string; state: string; mode: string; loading: boolean
  acRef: React.RefObject<HTMLDivElement | null>; acLoading: boolean
  suggestions: CitySuggestion[]; showSuggestions: boolean
  onCityChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onFocus: () => void
  onModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onSelectSuggestion: (s: CitySuggestion) => void
  onSearch: () => void
}) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bg-card)',
      border: `1.5px solid ${loading ? 'var(--orange)' : 'var(--border-strong)'}`,
      borderRadius: 'var(--radius-md)', marginBottom: 10,
      boxShadow: loading ? `0 0 0 3px var(--orange-dim)` : '0 2px 8px var(--shadow-sm)',
      transition: 'border-color 0.2s, box-shadow 0.2s', overflow: 'visible', position: 'relative',
    }}>
      <select value={mode} onChange={onModeChange} disabled={loading}
        style={{
          width: 185, padding: '16px 12px', background: mode ? 'transparent' : 'var(--orange-dim)',
          border: 'none', borderRight: `1px solid ${mode ? 'var(--border)' : 'var(--orange-border)'}`,
          outline: 'none',
          color: mode ? 'var(--orange)' : 'var(--text-3)',
          fontFamily: "'DM Sans', sans-serif", fontSize: 11,
          cursor: 'pointer', appearance: 'none', textAlign: 'center', letterSpacing: 1, flexShrink: 0,
          transition: 'background 0.2s, color 0.2s',
        }}>
        <option value="" disabled>Select type...</option>
        {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>

      <div ref={acRef} style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        <input value={city} onChange={e => onCityChange(e.target.value)}
          onKeyDown={onKeyDown} onFocus={onFocus}
          placeholder="City" disabled={loading} autoComplete="off"
          style={{
            flex: 1, padding: '16px 20px', background: 'transparent',
            border: 'none', outline: 'none', color: 'var(--text-1)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 'var(--text-base)',
          }} />

        {/* ── State pill — only shown once a city/state is resolved ── */}
        {state && (
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 12, flexShrink: 0 }}>
            <div style={{ width: 1, height: 18, background: 'var(--border)', marginRight: 10 }} />
            <div style={{
              padding: '3px 9px',
              background: 'var(--orange-dim)',
              border: '1px solid var(--orange-border)',
              borderRadius: 100,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
              color: 'var(--orange)',
              whiteSpace: 'nowrap',
            }}>
              {state}
            </div>
          </div>
        )}

        {acLoading && (
          <div style={{ position: 'absolute', right: 60, top: '50%', transform: 'translateY(-50%)' }}>
            <div style={{ width: 10, height: 10, border: '2px solid var(--border)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)', zIndex: 300,
            boxShadow: '0 8px 24px var(--shadow-md)', overflow: 'hidden',
          }}>
            {suggestions.map((s, i) => (
              <div key={i} onMouseDown={() => onSelectSuggestion(s)}
                style={{
                  padding: '11px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{s.city}</span>
                  {s.county && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 1, marginLeft: 8 }}>{s.county} CO.</span>}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--orange)', letterSpacing: 2, fontWeight: 500 }}>{s.state}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={onSearch} disabled={loading || !city.trim() || !mode}
        style={{
          padding: '14px 32px', background: loading ? 'var(--border)' : 'var(--orange)',
          border: 'none', borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2,
          color: 'white', transition: 'opacity 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
        {loading ? 'SCANNING...' : 'SEARCH'}
      </button>
    </div>
  )
}

// ── SearchResults ─────────────────────────────────────────────────────────────

function SearchResults({ agents, visibleAgents, selectedIndex, selectedAgent, hotCount, warmCount, coldCount,
  showAll, searchLabel, mode, detailRef, onSelectAgent, onToggleShowAll }: {
  agents: Agent[]; visibleAgents: Agent[]; selectedIndex: number | null; selectedAgent: Agent | null
  hotCount: number; warmCount: number; coldCount: number; showAll: boolean
  searchLabel: string; mode: string
  detailRef: React.RefObject<HTMLDivElement | null>
  onSelectAgent: (i: number) => void
  onToggleShowAll: () => void
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-2)', letterSpacing: 1 }}>
          <strong style={{ color: 'var(--text-1)' }}>{searchLabel}</strong> — {MODES.find(m => m.value === mode)?.label}
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--sig-green)', fontWeight: 500 }}>● {hotCount} HOT</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--sig-yellow)' }}>{warmCount} WARM</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--text-1)' }}>{agents.length} TOTAL</div>
        </div>
      </div>

      {agents.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: 'var(--text-4)', marginBottom: 10 }}>NO AGENTS FOUND</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>Try a larger city or different search terms.</div>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: '320px 1fr',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          overflow: 'hidden', boxShadow: '0 2px 12px var(--shadow-sm)',
        }}>
          <div style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', gap: 5 }}>
              {[
                { label: `${hotCount} HOT`,    color: 'var(--sig-green)',  bg: 'var(--sig-green-dim)',  border: 'var(--sig-green-border)' },
                { label: `${warmCount} WARM`,  color: 'var(--sig-yellow)', bg: 'var(--sig-yellow-dim)', border: 'var(--sig-yellow-border)' },
                { label: `${agents.filter(a => a.hiring).length} HIRING`, color: 'var(--sig-green)', bg: 'var(--sig-green-dim)', border: 'var(--sig-green-border)' },
                { label: `${agents.filter(a => a.youtube_channel).length} YT`, color: 'var(--sig-red)', bg: 'var(--sig-red-dim)', border: 'var(--sig-red-border)' },
              ].map(f => (
                <div key={f.label} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, padding: '3px 9px',
                  border: `1px solid ${f.border}`, color: f.color, background: f.bg,
                  borderRadius: 100, letterSpacing: 0.5, fontWeight: 500,
                }}>{f.label}</div>
              ))}
            </div>

            {visibleAgents.map((agent, i) => (
              <CompactAgentCard key={i} agent={agent} index={i}
                isSelected={selectedIndex === i} onSelect={() => onSelectAgent(i)} />
            ))}

            {coldCount > 0 && (
              <button onClick={onToggleShowAll}
                style={{
                  width: '100%', padding: '10px', background: 'transparent',
                  border: 'none', borderTop: '1px solid var(--border)',
                  color: 'var(--text-3)', fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10, letterSpacing: 1, cursor: 'pointer', textAlign: 'center',
                }}>
                {showAll ? `▲ HIDE ${coldCount} PASS` : `▼ SHOW ${coldCount} PASS`}
              </button>
            )}
          </div>

          <div ref={detailRef} style={{
            position: 'sticky', top: 16,
            maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
            background: 'var(--bg-card)',
          }}>
            {selectedAgent
              ? <DetailPanel agent={selectedAgent} city={''} state={''} />
              : <MarketSummary agents={agents} searchLabel={searchLabel} mode={mode} />
            }
          </div>
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '60px 40px', color: 'var(--text-3)', fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>
        Loading...
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  )
}
