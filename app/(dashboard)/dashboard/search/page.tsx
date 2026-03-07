'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

import type { Agent, CitySuggestion }            from '@/components/search/types'
import { CompactAgentCard }                      from '@/components/search/CompactAgentCard'
import { DetailPanel }                           from '@/components/search/DetailPanel'
import { MarketSummary }                         from '@/components/search/MarketSummary'
import { MODES, LOADING_PHASES, OPERATOR_TIPS, ANNUITY_TIPS } from '@/components/search/searchData'

const GuyAnimation = dynamic(() => import('@/components/search/GuyAnimation'), { ssr: false })

// ─────────────────────────────────────────────────────────────────────────────

function SearchPageInner() {
  const searchParams = useSearchParams()
  const [city, setCity]                       = useState('')
  const [state, setState]                     = useState('KS')
  const [mode, setMode]                       = useState('medicare')
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
    setCity(s.city); setState(s.state)
    setSuggestions([]); setShowSuggestions(false)
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
    if (!searchCity.trim()) return

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
              city={city} mode={mode} loading={loading}
              acRef={acRef} acLoading={acLoading}
              suggestions={suggestions} showSuggestions={showSuggestions}
              onCityChange={handleCityChange}
              onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); runSearch() } if (e.key === 'Escape') setShowSuggestions(false) }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onModeChange={e => setMode(e.target.value)}
              onSelectSuggestion={selectSuggestion}
              onSearch={() => runSearch()}
            />
            {!searched && !loading && <OperatorTips mode={mode} />}
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
            <GuyAnimation />
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

function SearchForm({ city, mode, loading, acRef, acLoading, suggestions, showSuggestions,
  onCityChange, onKeyDown, onFocus, onModeChange, onSelectSuggestion, onSearch }: {
  city: string; mode: string; loading: boolean
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
          width: 185, padding: '16px 12px', background: 'transparent',
          border: 'none', borderRight: '1px solid var(--border)', outline: 'none',
          color: 'var(--orange)', fontFamily: "'DM Sans', sans-serif", fontSize: 11,
          cursor: 'pointer', appearance: 'none', textAlign: 'center', letterSpacing: 1, flexShrink: 0,
        }}>
        {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>

      <div ref={acRef} style={{ position: 'relative', flex: 1 }}>
        <input value={city} onChange={e => onCityChange(e.target.value)}
          onKeyDown={onKeyDown} onFocus={onFocus}
          placeholder="City" disabled={loading} autoComplete="off"
          style={{
            width: '100%', padding: '16px 20px', background: 'transparent',
            border: 'none', outline: 'none', color: 'var(--text-1)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 'var(--text-base)',
          }} />

        {acLoading && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
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

      <button onClick={onSearch} disabled={loading || !city.trim()}
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

// ── OperatorTips ──────────────────────────────────────────────────────────────

function OperatorTips({ mode }: { mode: string }) {
  const tips = mode === 'annuities' ? ANNUITY_TIPS : OPERATOR_TIPS
  return (
    <div style={{ marginTop: 28, marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-2)', letterSpacing: 2, textTransform: 'uppercase' }}>Operator Intelligence</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          — {mode === 'annuities' ? 'how to find FIA & MYGA producers' : 'how to get the most out of every search'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {tips.map((tip, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderTop: `2px solid ${tip.color}`, padding: '18px',
            borderRadius: 'var(--radius)', boxShadow: '0 1px 3px var(--shadow-sm)',
          }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: tip.color, letterSpacing: 2, marginBottom: 8, fontWeight: 600 }}>{tip.tag}</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-1)', marginBottom: 7, lineHeight: 1.3 }}>{tip.headline}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>{tip.body}</div>
          </div>
        ))}
      </div>
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
