'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

const SEARCH_TIPS = [
  { label: 'Major metro', example: 'Kansas City, MO', tip: 'Use the largest city in the metro' },
  { label: 'Suburb market', example: 'Overland Park, KS', tip: 'Suburban cities often have dense independent agents' },
  { label: 'Rural market', example: 'Salina, KS', tip: 'Smaller cities = less competition, easier to recruit' },
  { label: 'Retirement hub', example: 'Sarasota, FL', tip: 'High Medicare-eligible population = more agents' },
]

type Agent = {
  name: string; type: string; phone: string; address: string
  rating: number; reviews: number; website: string | null
  carriers: string[]; captive: boolean; score: number
  flag: 'hot' | 'warm' | 'cold'; notes: string; years: number | null
  hiring: boolean; hiring_roles: string[]
  youtube_channel: string | null; youtube_subscribers: string | null; youtube_video_count: number
}

const LOADING_STEPS = [
  'Querying Google local listings',
  'Crawling agent websites',
  'Checking job postings',
  'Scanning YouTube presence',
  'Scoring recruitability',
]

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div style={{ width: 64, height: 64, borderRadius: '50%', border: `2px solid ${color}`, background: `${color}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color, letterSpacing: 1, textTransform: 'uppercase' }}>SCORE</div>
    </div>
  )
}

function RecruitBadge({ flag }: { flag: 'hot' | 'warm' | 'cold' }) {
  const map = { hot: { color: 'var(--green)', label: '🔥 HOT' }, warm: { color: 'var(--yellow)', label: 'WARM' }, cold: { color: '#333', label: 'PASS' } }
  const { color, label } = map[flag]
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px', border: `1px solid ${color}`, color, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
      {label}
    </div>
  )
}

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '24px 28px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', animation: `slideIn 0.3s ease ${index * 0.05}s both` }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-light)'; (e.currentTarget as HTMLDivElement).style.background = '#181818' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--card)' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>{agent.name}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{agent.type}</div>

          {/* Enrichment badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {agent.hiring && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px', background: 'rgba(0,200,100,0.08)', border: '1px solid var(--green)', color: 'var(--green)', letterSpacing: 1 }}>
                💼 HIRING{agent.hiring_roles.length > 0 ? ` — ${agent.hiring_roles[0]}` : ''}
              </div>
            )}
            {agent.youtube_channel && (
              <a href={agent.youtube_channel} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px', background: 'rgba(255,0,0,0.08)', border: '1px solid #ff4444', color: '#ff4444', letterSpacing: 1, textDecoration: 'none' }}>
                🎬 YOUTUBE{agent.youtube_subscribers ? ` — ${agent.youtube_subscribers}` : ''}
              </a>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
            {agent.phone && <div style={{ fontSize: 13, color: 'var(--muted)' }}>📞 {agent.phone}</div>}
            {agent.rating > 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>⭐ {agent.rating} ({agent.reviews} reviews)</div>}
            {agent.address && <div style={{ fontSize: 13, color: 'var(--muted)' }}>📍 {agent.address}</div>}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {agent.carriers.map(c => (
              <span key={c} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '3px 8px', border: '1px solid var(--border-light)', color: c === 'Unknown' ? '#333' : 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{c}</span>
            ))}
          </div>

          {expanded && (
            <>
              {agent.notes && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--orange-dim)', borderLeft: '2px solid var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {agent.notes}
                </div>
              )}
              {agent.hiring && agent.hiring_roles.length > 0 && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(0,200,100,0.05)', border: '1px solid rgba(0,200,100,0.2)' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 2, marginBottom: 6 }}>ACTIVE JOB POSTINGS</div>
                  {agent.hiring_roles.map(r => <div key={r} style={{ fontSize: 12, color: 'var(--muted)' }}>• {r}</div>)}
                </div>
              )}
              {agent.website && (
                <a href={agent.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ display: 'inline-block', marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 1 }}>
                  {agent.website} ↗
                </a>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 80 }}>
          <ScoreCircle score={agent.score} />
          <RecruitBadge flag={agent.flag} />
        </div>
      </div>
    </div>
  )
}

function SearchPageInner() {
  const searchParams = useSearchParams()
  const [city, setCity] = useState('')
  const [state, setState] = useState('KS')
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [agents, setAgents] = useState<Agent[]>([])
  const [searched, setSearched] = useState(false)
  const [searchLabel, setSearchLabel] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) loadSavedSearch(id)
  }, [])

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
      }
    } catch {}
    setLoading(false)
  }

  async function runSearch(overrideCity?: string, overrideState?: string) {
    const searchCity = overrideCity || city
    const searchState = overrideState || state
    if (!searchCity.trim()) return
    setLoading(true)
    setSearched(false)
    setAgents([])
    setError('')
    setCurrentStep(0)

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => prev < LOADING_STEPS.length - 1 ? prev + 1 : prev)
    }, Math.max(1000, (limit * 200)))

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: searchCity.trim(), state: searchState, limit }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAgents(data.agents || [])
      setCity(searchCity)
      setState(searchState)
      setSearchLabel(`${searchCity.toUpperCase()}, ${searchState}`)
    } catch (err: any) {
      setError(err.message || 'Search failed. Try again.')
    }

    clearInterval(stepInterval)
    setCurrentStep(-1)
    setLoading(false)
    setSearched(true)
  }

  return (
    <div style={{ padding: '60px 40px', maxWidth: 1100 }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadSlide { 0% { left: -40%; } 100% { left: 100%; } }
        select option { background: #1a1814; }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Market Search</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>
          FIND AGENTS<span style={{ color: 'var(--orange)' }}>.</span>
        </h1>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, border: `1px solid ${loading ? 'var(--orange)' : 'var(--border-light)'}`, background: 'var(--card)', transition: 'border-color 0.2s', boxShadow: loading ? '0 0 0 1px var(--orange)' : 'none' }}>
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runSearch()}
          placeholder="City (e.g. Kansas City)"
          disabled={loading}
          style={{ flex: 1, padding: '18px 24px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }}
        />
        <div style={{ width: 1, background: 'var(--border-light)' }} />
        <select value={state} onChange={e => setState(e.target.value)} disabled={loading}
          style={{ width: 80, padding: '18px 12px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 13, cursor: 'pointer', appearance: 'none', textAlign: 'center' }}>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ width: 1, background: 'var(--border-light)' }} />
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} disabled={loading}
          style={{ width: 80, padding: '18px 12px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, cursor: 'pointer', appearance: 'none', textAlign: 'center' }}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={40}>40</option>
          <option value={50}>50</option>
        </select>
        <button onClick={() => runSearch()} disabled={loading || !city.trim()}
          style={{ padding: '18px 32px', background: loading ? '#333' : 'var(--orange)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: 'var(--black)', transition: 'background 0.15s', whiteSpace: 'nowrap' }}>
          {loading ? 'SCANNING...' : 'SEARCH'}
        </button>
      </div>

      {/* Result count hint */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1 }}>
          RESULTS: {limit} agents · includes job posting + youtube enrichment
        </div>
      </div>

      {/* Search tips */}
      {!searched && !loading && (
        <div style={{ marginBottom: 40 }}>
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

      {/* Loading */}
      {loading && currentStep >= 0 && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--orange)', animation: 'loadSlide 1s ease-in-out infinite' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LOADING_STEPS.map((step, i) => (
              <div key={step} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10, color: i < currentStep ? 'var(--green)' : i === currentStep ? 'var(--orange)' : '#333', transition: 'color 0.3s' }}>
                <span style={{ fontSize: 8 }}>{i < currentStep ? '●' : i === currentStep ? '◐' : '○'}</span>
                {step}{i === 2 || i === 3 ? <span style={{ color: '#2a2a2a', fontSize: 9 }}> — enriching {limit} agents</span> : ''}
              </div>
            ))}
          </div>
          {limit >= 30 && (
            <div style={{ marginTop: 20, fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2a2a2a', letterSpacing: 1 }}>
              ⚠ LARGER SEARCHES TAKE 60-90 SECONDS — HANG TIGHT
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ padding: '16px 20px', border: '1px solid var(--red)', background: 'rgba(255,23,68,0.05)', color: 'var(--red)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1, marginBottom: 32 }}>
          {error}
        </div>
      )}

      {searched && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
              {searchLabel} — Medicare Agents
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)' }}>
                🔥 {agents.filter(a => a.flag === 'hot').length} HOT
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--yellow)' }}>
                {agents.filter(a => a.flag === 'warm').length} WARM
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--orange)' }}>
                {agents.length} TOTAL
              </div>
            </div>
          </div>

          {/* Enrichment summary */}
          {agents.length > 0 && (
            <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
              <div style={{ flex: 1, padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)' }}>
                💼 {agents.filter(a => a.hiring).length} ACTIVELY HIRING
              </div>
              <div style={{ flex: 1, padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#ff4444' }}>
                🎬 {agents.filter(a => a.youtube_channel).length} HAVE YOUTUBE
              </div>
              <div style={{ flex: 1, padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)' }}>
                🌐 {agents.filter(a => a.website).length} HAVE WEBSITE
              </div>
            </div>
          )}

          {agents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#222', marginBottom: 12 }}>NO AGENTS FOUND</div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Try a larger city or different search terms.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 2 }}>
              {agents.map((agent, i) => <AgentCard key={i} agent={agent} index={i} />)}
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
