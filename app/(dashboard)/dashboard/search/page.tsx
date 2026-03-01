'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import AnathemaPanel from '@/components/products/anathema/AnathemaPanel'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

const SEARCH_TIPS = [
  { label: 'Major metro', example: 'Kansas City, MO', tip: 'Use the largest city in the metro' },
  { label: 'Suburb market', example: 'Overland Park, KS', tip: 'Suburban cities often have dense independent agents' },
  { label: 'Rural market', example: 'Salina, KS', tip: 'Smaller cities = less competition, easier to recruit' },
  { label: 'Retirement hub', example: 'Sarasota, FL', tip: 'High Medicare-eligible population = more agents' },
]

const MODES = [
  { value: 'medicare',   label: 'Medicare / Senior',    desc: 'Medicare Advantage, Supplement, PDP' },
  { value: 'life',       label: 'Life / Final Expense', desc: 'Term, whole life, final expense' },
  { value: 'aca',        label: 'ACA / Health',         desc: 'Marketplace, group health, ACA brokers' },
  { value: 'annuities',  label: 'Annuities',            desc: 'Fixed indexed, MYGA, retirement income' },
  { value: 'financial',  label: 'Financial Advisors',   desc: 'Wealth management, CFP, retirement planning' },
]

type CitySuggestion = { city: string; state: string; label: string }

const SEARCH_TERMS: Record<string, { term: string; category: string }[]> = {
  medicare: [
    { term: 'Medicare supplement agent', category: 'Medicare' },
    { term: 'Medicare advantage broker', category: 'Medicare' },
    { term: 'Medicare insurance agent', category: 'Medicare' },
    { term: 'Medigap broker', category: 'Medicare' },
    { term: 'Senior health insurance agent', category: 'Medicare' },
  ],
  life: [
    { term: 'Final expense insurance agent', category: 'Life' },
    { term: 'Life insurance agent', category: 'Life' },
    { term: 'Term life insurance broker', category: 'Life' },
    { term: 'Burial insurance agent', category: 'Life' },
    { term: 'Independent life insurance broker', category: 'Life' },
  ],
  aca: [
    { term: 'ACA marketplace broker', category: 'Health' },
    { term: 'Health insurance agent', category: 'Health' },
    { term: 'Marketplace insurance agent', category: 'Health' },
    { term: 'Group health insurance broker', category: 'Health' },
    { term: 'Individual health insurance broker', category: 'Health' },
  ],
  annuities: [
    { term: 'Annuity agent', category: 'Annuities' },
    { term: 'Fixed indexed annuity broker', category: 'Annuities' },
    { term: 'Retirement income advisor', category: 'Annuities' },
    { term: 'MYGA broker', category: 'Annuities' },
    { term: 'Independent annuity agent', category: 'Annuities' },
  ],
  financial: [
    { term: 'Independent financial advisor', category: 'Financial' },
    { term: 'Wealth management advisor', category: 'Financial' },
    { term: 'Retirement planning advisor', category: 'Financial' },
    { term: 'Financial planner', category: 'Financial' },
    { term: 'CFP advisor', category: 'Financial' },
  ],
}

type Agent = {
  name: string; type: string; phone: string; address: string
  rating: number; reviews: number; website: string | null
  carriers: string[]; captive: boolean; score: number
  flag: 'hot' | 'warm' | 'cold'; notes: string; years: number | null
  hiring: boolean; hiring_roles: string[]
  youtube_channel: string | null; youtube_subscribers: string | null; youtube_video_count: number
  about: string | null; contact_email: string | null; social_links: string[]
}

const LOADING_STEPS = [
  'Querying Google local listings',
  'Deep crawling agent websites',
  'Checking job postings',
  'Scanning YouTube presence',
  'Scoring recruitability',
]

function ScoreCircle({ score, size = 52 }: { score: number; size?: number }) {
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}`, background: `${color}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.38, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color, letterSpacing: 1, textTransform: 'uppercase' }}>SCORE</div>
    </div>
  )
}

function RecruitBadge({ flag }: { flag: 'hot' | 'warm' | 'cold' }) {
  const map = { hot: { color: 'var(--green)', label: '◈ HOT' }, warm: { color: 'var(--yellow)', label: 'WARM' }, cold: { color: '#333', label: 'PASS' } }
  const { color, label } = map[flag]
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '2px 6px', border: `1px solid ${color}`, color, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap' }}>
      {label}
    </div>
  )
}

// Compact card — never expands, click selects into right panel
function CompactAgentCard({
  agent, index, isSelected, onSelect, onAnathema, cardRef
}: {
  agent: Agent; index: number; isSelected: boolean
  onSelect: () => void; onAnathema: (e: React.MouseEvent) => void
  cardRef: (el: HTMLDivElement | null) => void
}) {
  const flagColor = agent.flag === 'hot' ? 'var(--green)' : agent.flag === 'warm' ? 'var(--yellow)' : 'var(--border)'

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      style={{
        background: isSelected ? '#1a1814' : 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: isSelected ? `3px solid ${flagColor}` : '3px solid transparent',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        animation: `slideIn 0.3s ease ${index * 0.04}s both`,
        position: 'relative',
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
        {/* Left content */}
        <div style={{ minWidth: 0 }}>
          {/* Name + type */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{agent.type}</div>

          {/* Rating + location */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            {agent.rating > 0 && (
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>★ {agent.rating} ({agent.reviews})</div>
            )}
            {agent.address && (
              <div style={{ fontSize: 11, color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{agent.address}</div>
            )}
          </div>

          {agent.phone && (
            <div style={{ fontSize: 11, color: '#555', marginBottom: 6, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}>{agent.phone}</div>
          )}

          {/* Tags row */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={onAnathema}
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '2px 7px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase', transition: 'background 0.1s', flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,230,118,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              ◈ ANATHEMA
            </button>
            {agent.hiring && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, padding: '2px 6px', border: '1px solid var(--border)', color: 'var(--muted)', letterSpacing: 1 }}>HIRING</div>
            )}
            {agent.youtube_channel && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, padding: '2px 6px', border: '1px solid #ff4444', color: '#ff4444', letterSpacing: 1 }}>YT</div>
            )}
            {agent.website && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, padding: '2px 6px', border: '1px solid var(--border-light)', color: '#444', letterSpacing: 1 }}>WEB</div>
            )}
          </div>
        </div>

        {/* Right: score + badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <ScoreCircle score={agent.score} size={44} />
          <RecruitBadge flag={agent.flag} />
        </div>
      </div>
    </div>
  )
}

// Detail panel — agent info + ANATHEMA
function DetailPanel({
  agent, city, state, cachedResult, onResult
}: {
  agent: Agent | null; city: string; state: string
  cachedResult?: any; onResult?: (r: any) => void
}) {
  if (!agent) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--card)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden', minHeight: 400
      }}>
        <style>{`
          @keyframes heroScanline { 0% { top: -2px; } 100% { top: 100%; } }
          .hero-scanline { position: absolute; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,230,118,0.15), transparent); animation: heroScanline 3s linear infinite; pointer-events: none; }
        `}</style>
        <div className="hero-scanline" />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#1a1a1a', letterSpacing: 4, userSelect: 'none' }}>ANATHEMA</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2a2a2a', letterSpacing: 3, marginTop: 8 }}>SELECT AN AGENT TO VIEW INTEL</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', overflow: 'auto' }}>
      {/* Agent header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)', marginBottom: 3 }}>{agent.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{agent.type}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <ScoreCircle score={agent.score} size={56} />
            <RecruitBadge flag={agent.flag} />
          </div>
        </div>

        {/* Meta info */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 10 }}>
          {agent.phone && <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{agent.phone}</div>}
          {agent.rating > 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>★ {agent.rating} ({agent.reviews} reviews)</div>}
          {agent.address && <div style={{ fontSize: 13, color: 'var(--muted)' }}>◎ {agent.address}</div>}
        </div>

        {/* Carriers */}
        {agent.carriers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {agent.carriers.map(c => (
              <span key={c} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 7px', border: '1px solid var(--border-light)', color: c === 'Unknown' ? '#333' : 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{c}</span>
            ))}
          </div>
        )}

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {agent.hiring && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', letterSpacing: 1 }}>
              ▸ HIRING{agent.hiring_roles.length > 0 ? ` — ${agent.hiring_roles[0]}` : ''}
            </div>
          )}
          {agent.youtube_channel && (
            <a href={agent.youtube_channel} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px', background: 'rgba(255,0,0,0.08)', border: '1px solid #ff4444', color: '#ff4444', letterSpacing: 1, textDecoration: 'none' }}>
              ▸ YOUTUBE{agent.youtube_subscribers ? ` — ${agent.youtube_subscribers}` : ''}
            </a>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {agent.notes && (
        <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: 'var(--orange-dim)', borderLeft: '2px solid var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5, color: 'var(--muted)', lineHeight: 1.6 }}>
          {agent.notes}
        </div>
      )}

      {/* Hiring roles */}
      {agent.hiring && agent.hiring_roles.length > 0 && (
        <div style={{ margin: '12px 24px 0', padding: '10px 14px', background: 'rgba(0,200,100,0.05)', border: '1px solid rgba(0,200,100,0.2)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 2, marginBottom: 6 }}>ACTIVE JOB POSTINGS</div>
          {agent.hiring_roles.map(r => <div key={r} style={{ fontSize: 12, color: 'var(--muted)' }}>• {r}</div>)}
        </div>
      )}

      {/* About */}
      {agent.about && (
        <div style={{ margin: '12px 24px 0', padding: '12px 16px', background: '#1a1814', border: '1px solid var(--border)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>ABOUT</div>
          {agent.about}
        </div>
      )}

      {/* Links */}
      <div style={{ margin: '10px 24px 0', display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 4 }}>
        {agent.contact_email && (
          <a href={`mailto:${agent.contact_email}`}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', border: '1px solid var(--border-light)', color: 'var(--muted)', letterSpacing: 1, textDecoration: 'none' }}>
            @ {agent.contact_email}
          </a>
        )}
        {(agent.social_links || []).map((link, i) => {
          const label = link.includes('facebook') ? 'FB' : link.includes('linkedin') ? 'LI' : link.includes('instagram') ? 'IG' : link.includes('twitter') || link.includes('x.com') ? 'TW' : '↗ SOCIAL'
          return (
            <a key={i} href={link} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', border: '1px solid var(--border-light)', color: 'var(--muted)', letterSpacing: 1, textDecoration: 'none' }}>
              {label}
            </a>
          )
        })}
        {agent.website && (
          <a href={agent.website} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 1, textDecoration: 'none', padding: '4px 0' }}>
            {agent.website} ↗
          </a>
        )}
      </div>

      {/* Divider */}
      <div style={{ margin: '16px 0', borderTop: '1px solid var(--border)' }} />

      {/* ANATHEMA Panel — keyed on agent name forces full remount on switch */}
      <AnathemaPanel key={agent.name} agent={agent} city={city} state={state} cachedResult={cachedResult} onResult={onResult} />
    </div>
  )
}

function SearchPageInner() {
  const searchParams = useSearchParams()
  const [city, setCity] = useState('')
  const [state, setState] = useState('KS')
  const [limit, setLimit] = useState(10)
  const [mode, setMode] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [agents, setAgents] = useState<Agent[]>([])
  const [searched, setSearched] = useState(false)
  const [searchLabel, setSearchLabel] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [querySuggestions, setQuerySuggestions] = useState<{ term: string; category: string }[]>([])
  const [showQuerySuggestions, setShowQuerySuggestions] = useState(false)
  const queryRef = useRef<HTMLDivElement>(null)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [acLoading, setAcLoading] = useState(false)
  const acRef = useRef<HTMLDivElement>(null)
  const acTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Two-column state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [anathemaCache, setAnathemaCache] = useState<Record<number, any>>({})
  const [searchCollapsed, setSearchCollapsed] = useState(false)

  // Refs for connecting line
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [linePath, setLinePath] = useState('')
  const [lineColor, setLineColor] = useState('rgba(0,230,118,0.5)')

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) loadSavedSearch(id)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (acRef.current && !acRef.current.contains(e.target as Node)) setShowSuggestions(false)
      if (queryRef.current && !queryRef.current.contains(e.target as Node)) setShowQuerySuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Update connecting line when selected card changes or on scroll
  const updateLine = useCallback(() => {
    if (selectedIndex === null || !cardRefs.current[selectedIndex] || !panelRef.current || !containerRef.current) {
      setLinePath('')
      return
    }
    const card = cardRefs.current[selectedIndex]!
    const panel = panelRef.current
    const container = containerRef.current

    const containerRect = container.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()

    // Relative to container
    const x1 = cardRect.right - containerRect.left
    const y1 = cardRect.top - containerRect.top + cardRect.height / 2
    const x2 = panelRect.left - containerRect.left
    const y2 = panelRect.top - containerRect.top + 60 // aim at top portion of panel

    const cx1 = x1 + (x2 - x1) * 0.4
    const cx2 = x2 - (x2 - x1) * 0.4

    setLinePath(`M ${x1},${y1} C ${cx1},${y1} ${cx2},${y2} ${x2},${y2}`)
  }, [selectedIndex])

  useEffect(() => {
    updateLine()
  }, [selectedIndex, agents, updateLine])

  useEffect(() => {
    if (selectedIndex === null) return
    const agent = agents[selectedIndex]
    if (!agent) return
    const color = agent.flag === 'hot' ? 'rgba(0,230,118,0.5)' : agent.flag === 'warm' ? 'rgba(255,193,7,0.5)' : 'rgba(80,80,80,0.4)'
    setLineColor(color)
  }, [selectedIndex, agents])

  // Scroll listener for line update
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => updateLine()
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [updateLine])

  function handleQueryChange(val: string) {
    setQuery(val)
    if (val.length === 0) {
      setQuerySuggestions(mode ? (SEARCH_TERMS[mode] || []).slice(0, 6) : [])
      setShowQuerySuggestions(true)
      return
    }
    const lower = val.toLowerCase()
    const terms = mode ? (SEARCH_TERMS[mode] || []) : Object.values(SEARCH_TERMS).flat()
    const filtered = terms.filter(t => t.term.toLowerCase().includes(lower) || t.category.toLowerCase().includes(lower))
    setQuerySuggestions(filtered.slice(0, 8))
    setShowQuerySuggestions(filtered.length > 0)
  }

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
    const searchCity = overrideCity || city
    const searchState = overrideState || state
    if (!searchCity.trim() || !mode) return
    setLoading(true)
    setSearched(false)
    setAgents([])
    setError('')
    setCurrentStep(0)
    setSelectedIndex(null)
    setAnathemaCache({})
    cardRefs.current = []

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => prev < LOADING_STEPS.length - 1 ? prev + 1 : prev)
    }, Math.max(1000, (limit * 200)))

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: searchCity.trim(), state: searchState, limit, mode, query: query.trim() }),
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

  return (
    <div style={{ padding: '40px 40px 40px', maxWidth: 1400, minHeight: '100vh' }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadSlide { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a1814; }
      `}</style>

      {/* Header — only shown when not collapsed */}
      {!searchCollapsed && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Market Search</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>
            FIND AGENTS<span style={{ color: 'var(--orange)' }}>.</span>
          </h1>
        </div>
      )}

      {/* SEARCH FORM — expanded or collapsed */}
      {searchCollapsed ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'var(--card)', border: '1px solid var(--border-light)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)', letterSpacing: 1 }}>
              {query ? `${query} · ` : ''}{searchLabel} · {agents.length} results
            </span>
          </div>
          <button
            onClick={() => setSearchCollapsed(false)}
            style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '5px 12px', cursor: 'pointer' }}
          >
            MODIFY SEARCH ↓
          </button>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', marginBottom: 12, display: 'flex', gap: 0, border: `1px solid ${loading ? 'var(--orange)' : 'var(--border-light)'}`, background: 'var(--card)', transition: 'border-color 0.2s', boxShadow: loading ? '0 0 0 1px var(--orange)' : 'none' }}>
            {/* Query */}
            <div ref={queryRef} style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <input
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onFocus={() => { setQuerySuggestions(query.length === 0 ? (mode ? (SEARCH_TERMS[mode] || []).slice(0, 6) : []) : querySuggestions); setShowQuerySuggestions(true) }}
                onKeyDown={e => { if (e.key === 'Enter') { setShowQuerySuggestions(false); runSearch() } if (e.key === 'Escape') setShowQuerySuggestions(false) }}
                placeholder="Search agents, specialties..."
                disabled={loading}
                autoComplete="off"
                style={{ width: '100%', padding: '18px 24px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }}
              />
              {showQuerySuggestions && querySuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: -1, right: -1, background: 'var(--card)', border: '1px solid var(--border-light)', borderTop: 'none', zIndex: 300 }}>
                  {querySuggestions.map((s, i) => (
                    <div key={i} onMouseDown={() => { setQuery(s.term); setShowQuerySuggestions(false) }}
                      style={{ padding: '11px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < querySuggestions.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1f1d19')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)' }}>{s.term}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{s.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ width: 1, background: 'var(--border-light)', flexShrink: 0 }} />
            <select value={mode} onChange={e => { setMode(e.target.value); setQuery('') }} disabled={loading}
              style={{ width: 170, padding: '18px 12px', background: 'transparent', border: 'none', outline: 'none', color: mode ? 'var(--orange)' : 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer', appearance: 'none', textAlign: 'center', letterSpacing: 1, flexShrink: 0 }}>
              <option value="" disabled>SELECT LINE ▾</option>
              {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>

            <div style={{ width: 1, background: 'var(--border-light)', flexShrink: 0 }} />
            <div ref={acRef} style={{ position: 'relative', flexShrink: 0 }}>
              <input
                value={city}
                onChange={e => handleCityChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); runSearch() } if (e.key === 'Escape') setShowSuggestions(false) }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="City"
                disabled={loading}
                autoComplete="off"
                style={{ width: 130, padding: '18px 14px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: 1 }}
              />
              {acLoading && (
                <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                  <div style={{ width: 10, height: 10, border: '1px solid var(--border-light)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: -1, width: 220, background: 'var(--card)', border: '1px solid var(--border-light)', borderTop: 'none', zIndex: 300 }}>
                  {suggestions.map((s, i) => (
                    <div key={i} onMouseDown={() => selectSuggestion(s)}
                      style={{ padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1f1d19')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)' }}>{s.city}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2 }}>{s.state}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ width: 1, background: 'var(--border-light)', flexShrink: 0 }} />
            <select value={state} onChange={e => setState(e.target.value)} disabled={loading}
              style={{ width: 72, padding: '18px 8px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 13, cursor: 'pointer', appearance: 'none', textAlign: 'center', flexShrink: 0 }}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div style={{ width: 1, background: 'var(--border-light)', flexShrink: 0 }} />
            <select value={limit} onChange={e => setLimit(Number(e.target.value))} disabled={loading}
              style={{ width: 64, padding: '18px 8px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, cursor: 'pointer', appearance: 'none', textAlign: 'center', flexShrink: 0 }}>
              <option value={10}>10</option><option value={20}>20</option><option value={30}>30</option><option value={40}>40</option><option value={50}>50</option>
            </select>

            <button onClick={() => runSearch()} disabled={loading || !city.trim() || !mode}
              style={{ padding: '18px 32px', background: loading ? '#333' : 'var(--orange)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: 'var(--black)', transition: 'background 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {loading ? 'SCANNING...' : 'SEARCH'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1 }}>
              {mode ? `${limit} agents · ${MODES.find(m => m.value === mode)?.desc} · job posting + youtube enrichment` : 'SELECT A LINE TO SEARCH'}
            </div>
          </div>
        </>
      )}

      {/* Search tips — only pre-search */}
      {!searched && !loading && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Search Tips</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            {SEARCH_TIPS.map(tip => (
              <div key={tip.label}
                onClick={() => {
                  const [c, s] = tip.example.split(', ')
                  setCity(c)
                  if (s) setState(s)
                  runSearch(c, s || state)
                }}
                style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
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
        <div style={{ marginBottom: 40 }}>
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
          {/* Stats bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
              {searchLabel} — {MODES.find(m => m.value === mode)?.label} Agents
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)' }}>◈ {agents.filter(a => a.flag === 'hot').length} HOT</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--yellow)' }}>{agents.filter(a => a.flag === 'warm').length} WARM</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--orange)' }}>{agents.length} TOTAL</div>
            </div>
          </div>

          {/* Filter chips */}
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
            /* TWO COLUMN LAYOUT */
            <div ref={containerRef} style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 0, alignItems: 'start', position: 'relative' }}>
              {/* SVG connecting line overlay */}
              {linePath && (
                <svg
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}
                  aria-hidden="true"
                >
                  <path
                    d={linePath}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={1.5}
                    strokeDasharray="none"
                    opacity={0.55}
                  />
                </svg>
              )}

              {/* LEFT: Agent list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderRight: '1px solid var(--border)' }}>
                {agents.map((agent, i) => (
                  <CompactAgentCard
                    key={i}
                    agent={agent}
                    index={i}
                    isSelected={selectedIndex === i}
                    onSelect={() => {
                      setSelectedIndex(i)
                      setTimeout(updateLine, 50)
                    }}
                    onAnathema={(e) => {
                      e.stopPropagation()
                      setSelectedIndex(i)
                      setTimeout(updateLine, 50)
                    }}
                    cardRef={el => { cardRefs.current[i] = el }}
                  />
                ))}
              </div>

              {/* RIGHT: Detail / Scan Panel */}
              {(capturedIdx => (
                <div ref={panelRef} style={{ position: 'sticky', top: 16 }}>
                  <DetailPanel
                    key={capturedIdx ?? 'empty'}
                    agent={selectedAgent}
                    city={city}
                    state={state}
                    cachedResult={capturedIdx !== null ? anathemaCache[capturedIdx] : undefined}
                    onResult={capturedIdx !== null ? (r) => setAnathemaCache(prev => ({ ...prev, [capturedIdx]: r })) : undefined}
                  />
                </div>
              ))(selectedIndex)}
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
