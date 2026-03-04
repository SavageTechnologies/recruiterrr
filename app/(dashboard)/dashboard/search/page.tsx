'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const MODES = [
  { value: 'medicare',  label: 'Medicare / Senior',    desc: 'Medicare Advantage, Supplement, PDP' },
  { value: 'life',      label: 'Life / Final Expense', desc: 'Term, whole life, final expense' },
  { value: 'annuities', label: 'FIA / MYGA',           desc: 'Fixed index annuities, MYGA, safe money' },
  // { value: 'financial', label: 'Financial Advisors',   desc: 'Wealth management, CFP, retirement planning' },
]

const OPERATOR_TIPS = [
  {
    tag: 'PRIORITY',
    color: 'var(--green)',
    headline: 'HOT means call today.',
    body: 'The HOT flag means independent signals fired — no captive contract language, no FMO branding, hiring activity, YouTube presence. These have the shortest path to a real conversation. Work HOT first, every time.',
  },
  {
    tag: 'SIGNAL',
    color: '#ff4444',
    headline: 'YouTube is your biggest tell.',
    body: 'An agent building a personal brand is thinking beyond their current upline. Producers don\'t make videos when they\'re happy where they are. Click the YT badge and watch what they\'re posting before you dial.',
  },
  {
    tag: 'INTEL',
    color: 'var(--orange)',
    headline: 'Their website tells you everything.',
    body: 'Before you call, click the website link and spend 60 seconds on it. Carrier logos on the homepage = independent. One company\'s branding everywhere = captive. "Powered by" or FMO co-branding = they already have an upline. Know before you dial.',
  },
  {
    tag: 'OPENER',
    color: 'var(--orange)',
    headline: 'The HIRING badge is a backdoor.',
    body: 'An agent actively hiring subagents has a book of business and is growing — and is probably dealing with support or lead problems from their upline. "I saw you\'re building a team" beats any other opener.',
  },
  {
    tag: 'READING',
    color: 'var(--muted)',
    headline: 'Reviews tell you who they are.',
    body: 'High rating + lots of reviews = established producer with a real client base. That\'s who you want. Both are recruitable but the conversation is completely different. Check the count before you call.',
  },
  {
    tag: 'STRATEGY',
    color: 'var(--muted)',
    headline: 'Search the city, not the agent.',
    body: 'You\'re mapping a market, not hunting one person. Run the search, look at the cluster. If 8 of 30 agents have YouTube, that\'s a market full of ambitious producers. If most are captive, move on.',
  },
]

const ANNUITY_TIPS = [
  {
    tag: 'FIA / MYGA',
    color: 'var(--green)',
    headline: 'They won\'t look like annuity agents.',
    body: 'The best FIA producers call themselves "retirement planners" or "financial advisors" — not annuity agents. They serve the same retirement-age client but are insurance-only licensed. Look past the title and into the notes.',
  },
  {
    tag: 'SIGNAL',
    color: '#ff4444',
    headline: '"Safe money" is the magic phrase.',
    body: 'If their website or notes mention "safe money", "principal protection", "no market risk", or "guaranteed income" — that\'s a pure FIA producer. These phrases are industry-specific shorthand that only insurance-licensed annuity agents use.',
  },
  {
    tag: 'INTEL',
    color: 'var(--orange)',
    headline: 'Carrier names confirm the kill.',
    body: 'Athene, North American, American Equity, Allianz, Nationwide, Pacific Life, Global Atlantic, Midland National — if you see any of these on their site, they\'re selling FIAs. That\'s your green light.',
  },
  {
    tag: 'AVOID',
    color: '#ff4444',
    headline: 'Fee-only = walk away.',
    body: 'Fee-only fiduciaries are philosophically anti-annuity. "AUM", "assets under management", "portfolio management" — these are securities-first advisors. The score will reflect it. Don\'t waste time on COLD results here.',
  },
  {
    tag: 'NUANCE',
    color: 'var(--muted)',
    headline: '"Fiduciary" alone means nothing.',
    body: 'Insurance agents can legally call themselves fiduciaries — and many do now. Don\'t let the word spook you. Only walk away if you see "fee-only fiduciary" or "fiduciary financial advisor" with AUM language. Context is everything.',
  },
  {
    tag: 'STRATEGY',
    color: 'var(--muted)',
    headline: 'Retirement income = your target market.',
    body: 'Search results will include some hybrid advisors who do both securities and insurance. WARM scores here often mean "I do some annuities" — that\'s a conversation worth having. Don\'t skip WARM on annuity searches the way you might on Medicare.',
  },
]

const LOADING_STEPS = [
  'Querying Google local listings',
  'Deep crawling agent websites',
  'Checking job postings',
  'Scanning YouTube presence',
  'Scoring recruitability',
]

const LOOKUP_STEPS = [
  'Searching the open web',
  'Locating agent website',
  'Crawling website content',
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
  // Lookup-only fields
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence_note?: string
  source_url?: string | null
  source_title?: string | null
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

  // Shared state
  const [city, setCity]                   = useState('')
  const [state, setState]                 = useState('KS')
  const [mode, setMode]                   = useState('medicare')

  // Search mode toggle
  const [searchMode, setSearchMode]       = useState<'market' | 'lookup'>('market')

  // Market sweep state
  const [loading, setLoading]             = useState(false)
  const [currentStep, setCurrentStep]     = useState(-1)
  const [agents, setAgents]               = useState<Agent[]>([])
  const [searched, setSearched]           = useState(false)
  const [searchLabel, setSearchLabel]     = useState('')
  const [error, setError]                 = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showAll, setShowAll]             = useState(false)
  const [searchCollapsed, setSearchCollapsed] = useState(false)

  // Agent lookup state
  const [lookupName, setLookupName]           = useState('')
  const [lookupLoading, setLookupLoading]     = useState(false)
  const [lookupStep, setLookupStep]           = useState(-1)
  const [lookupResult, setLookupResult]       = useState<Agent | null>(null)
  const [lookupError, setLookupError]         = useState('')

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

  async function runLookup() {
    if (!lookupName.trim() || lookupLoading) return
    setLookupLoading(true)
    setLookupResult(null)
    setLookupError('')
    setLookupStep(0)

    const stepInterval = setInterval(() => {
      setLookupStep(prev => prev < LOOKUP_STEPS.length - 1 ? prev + 1 : prev)
    }, 2000)

    try {
      const res = await fetch('/api/search/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: lookupName.trim(), city: city.trim(), state, mode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLookupResult(data.agent)
    } catch (err: any) {
      setLookupError(err.message || 'Lookup failed. Try again.')
    }

    clearInterval(stepInterval)
    setLookupStep(-1)
    setLookupLoading(false)
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

      {/* ── Page header (hidden once market search collapses) ── */}
      {!searchCollapsed && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            {searchMode === 'market' ? 'Market Search' : 'Agent Lookup'}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>
              {searchMode === 'market'
                ? <span>FIND AGENTS<span style={{ color: 'var(--orange)' }}>.</span></span>
                : <span>AGENT LOOKUP<span style={{ color: 'var(--orange)' }}>.</span></span>
              }
            </h1>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
              {(['market', 'lookup'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setSearchMode(m)
                    setLookupResult(null)
                    setLookupError('')
                  }}
                  style={{
                    background: searchMode === m ? 'var(--card)' : 'transparent',
                    border: `1px solid ${searchMode === m ? 'var(--border-light)' : 'var(--border)'}`,
                    color: searchMode === m ? 'var(--orange)' : 'var(--muted)',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10, letterSpacing: 2,
                    padding: '8px 18px', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {m === 'market' ? '◈ MARKET SWEEP' : '⊕ AGENT LOOKUP'}
                </button>
              ))}
            </div>
          </div>
          {searchMode === 'lookup' && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 1, marginTop: 6 }}>
              Find and score a specific agent by name — works without a Google Business listing.
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MARKET SWEEP UI
          ════════════════════════════════════════════════════════ */}
      {searchMode === 'market' && (
        <>
          {/* Collapsed search bar (post-search) */}
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
            /* Search form */
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

              {/* Operator tips (shown before first search only) */}
              {!searched && !loading && (
                <div style={{ marginTop: 32, marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
                      Operator Intelligence
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>
                      — {mode === 'annuities' ? 'how to find FIA & MYGA producers hiding in plain sight' : 'how to get the most out of every search'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    {(mode === 'annuities' ? ANNUITY_TIPS : OPERATOR_TIPS).map((tip, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'var(--card)', border: '1px solid var(--border)',
                          borderTop: `2px solid ${tip.color}`,
                          padding: '20px 22px',
                        }}
                      >
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: tip.color, letterSpacing: 2, marginBottom: 10 }}>
                          {tip.tag}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 8, lineHeight: 1.3 }}>
                          {tip.headline}
                        </div>
                        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.7 }}>
                          {tip.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading state */}
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

          {/* Error */}
          {error && (
            <div style={{ padding: '16px 20px', border: '1px solid var(--red)', background: 'rgba(255,23,68,0.05)', color: 'var(--red)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1, marginBottom: 32 }}>
              {error}
            </div>
          )}

          {/* Results */}
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
                /* Two column: list + detail */
                <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 0, alignItems: 'start' }}>
                  {/* Left: Agent list */}
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
                    {coldCount > 0 && (
                      <button
                        onClick={() => setShowAll(v => !v)}
                        style={{ margin: '4px 0', padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, cursor: 'pointer', textAlign: 'center' }}
                      >
                        {showAll ? `▲ HIDE ${coldCount} PASS` : `▼ SHOW ${coldCount} PASS`}
                      </button>
                    )}
                  </div>

                  {/* Right: Detail panel */}
                  <div style={{ position: 'sticky', top: 16 }}>
                    <DetailPanel agent={selectedAgent} />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          AGENT LOOKUP UI
          ════════════════════════════════════════════════════════ */}
      {searchMode === 'lookup' && (
        <div>
          {/* Lookup form */}
          <div style={{
            display: 'flex', gap: 0,
            border: `1px solid ${lookupLoading ? 'var(--orange)' : 'var(--border-light)'}`,
            background: 'var(--card)', marginBottom: 2,
            boxShadow: lookupLoading ? '0 0 0 1px var(--orange)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            {/* Vertical mode — shared with market sweep */}
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
              disabled={lookupLoading}
              style={{ width: 180, padding: '18px 12px', background: 'transparent', border: 'none', borderRight: '1px solid var(--border-light)', outline: 'none', color: 'var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer', appearance: 'none', textAlign: 'center', letterSpacing: 1, flexShrink: 0 }}
            >
              {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>

            {/* Agent name */}
            <input
              value={lookupName}
              onChange={e => setLookupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runLookup()}
              placeholder="Agent or agency name — e.g. John Smith Insurance"
              disabled={lookupLoading}
              autoComplete="off"
              style={{ flex: 1, padding: '18px 20px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }}
            />

            <button
              onClick={runLookup}
              disabled={lookupLoading || !lookupName.trim()}
              style={{ padding: '18px 36px', background: 'transparent', border: 'none', borderLeft: '1px solid var(--border-light)', cursor: lookupLoading || !lookupName.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3, color: lookupLoading ? '#333' : 'var(--orange)', transition: 'color 0.15s', whiteSpace: 'nowrap' }}
            >
              {lookupLoading ? 'SCANNING...' : '⊕ LOOKUP'}
            </button>
          </div>

          {/* Optional city + state row */}
          <div ref={acRef} style={{ position: 'relative', marginBottom: 2 }}>
            <input
              value={city}
              onChange={e => handleCityChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); runLookup() } if (e.key === 'Escape') setShowSuggestions(false) }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="City (optional — improves accuracy)"
              disabled={lookupLoading}
              autoComplete="off"
              style={{ width: '100%', padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5, boxSizing: 'border-box' }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border-light)', borderTop: 'none', zIndex: 300 }}>
                {suggestions.map((s, i) => (
                  <div key={i} onMouseDown={() => selectSuggestion(s)}
                    style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1f1d19')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)' }}>{s.city}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2 }}>{s.state}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, marginBottom: 24 }}>
            SEARCHES THE OPEN WEB · WORKS WITHOUT A GOOGLE BUSINESS LISTING · CITY + STATE OPTIONAL BUT IMPROVE ACCURACY
          </div>

          {/* Lookup loading */}
          {lookupLoading && lookupStep >= 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--orange)', animation: 'loadSlide 1s ease-in-out infinite' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {LOOKUP_STEPS.map((step, i) => (
                  <div key={step} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10, color: i < lookupStep ? 'var(--green)' : i === lookupStep ? 'var(--orange)' : '#333', transition: 'color 0.3s' }}>
                    <span style={{ fontSize: 8 }}>{i < lookupStep ? '●' : i === lookupStep ? '◐' : '○'}</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lookup error */}
          {lookupError && (
            <div style={{ padding: '16px 20px', border: '1px solid var(--red)', background: 'rgba(255,23,68,0.05)', color: 'var(--red)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1, marginBottom: 24 }}>
              {lookupError}
            </div>
          )}

          {/* Lookup result */}
          {lookupResult && !lookupLoading && (
            <div style={{ animation: 'slideIn 0.3s ease both' }}>

              {/* Confidence bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', marginBottom: 2,
                background: lookupResult.confidence === 'HIGH' ? 'rgba(0,230,118,0.04)' : lookupResult.confidence === 'MEDIUM' ? 'rgba(255,214,0,0.04)' : 'rgba(255,85,0,0.04)',
                border: `1px solid ${lookupResult.confidence === 'HIGH' ? 'rgba(0,230,118,0.2)' : lookupResult.confidence === 'MEDIUM' ? 'rgba(255,214,0,0.2)' : 'rgba(255,85,0,0.2)'}`,
              }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2,
                  color: lookupResult.confidence === 'HIGH' ? 'var(--green)' : lookupResult.confidence === 'MEDIUM' ? 'var(--yellow)' : 'var(--orange)',
                }}>
                  {lookupResult.confidence === 'HIGH' ? '● HIGH CONFIDENCE' : lookupResult.confidence === 'MEDIUM' ? '◐ MEDIUM CONFIDENCE' : '○ LOW CONFIDENCE'}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1 }}>
                  {lookupResult.confidence_note}
                </span>
                {lookupResult.source_url && (
                  <a href={lookupResult.source_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1, textDecoration: 'none', marginLeft: 'auto' }}>
                    SOURCE ↗
                  </a>
                )}
              </div>

              {/* Result card */}
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border-light)',
                borderLeft: `3px solid ${lookupResult.flag === 'hot' ? 'var(--green)' : lookupResult.flag === 'warm' ? 'var(--yellow)' : 'var(--border)'}`,
              }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>{lookupResult.name}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{lookupResult.type}</div>
                    {lookupResult.about && (
                      <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.7)', lineHeight: 1.65, marginBottom: 12, margin: '0 0 12px 0' }}>{lookupResult.about}</p>
                    )}
                    {/* AI notes */}
                    {lookupResult.notes && (
                      <div style={{ padding: '12px 14px', background: 'var(--orange-dim)', borderLeft: '2px solid var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5, color: 'var(--white)', lineHeight: 1.7, marginBottom: 12 }}>
                        {lookupResult.notes}
                      </div>
                    )}
                    {/* Quick links */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {lookupResult.website && (
                        <a href={lookupResult.website} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', border: '1px solid var(--border-light)', color: 'var(--orange)', textDecoration: 'none', letterSpacing: 1 }}>
                          WEBSITE ↗
                        </a>
                      )}
                      {lookupResult.youtube_channel && (
                        <a href={lookupResult.youtube_channel} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', border: '1px solid #ff4444', color: '#ff4444', textDecoration: 'none', letterSpacing: 1 }}>
                          YOUTUBE ↗
                        </a>
                      )}
                      {lookupResult.contact_email && (
                        <a href={`mailto:${lookupResult.contact_email}`}
                          style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', border: '1px solid var(--border)', color: '#666', textDecoration: 'none', letterSpacing: 1 }}>
                          ✉ {lookupResult.contact_email}
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <ScoreCircle score={lookupResult.score} size={64} />
                    <RecruitBadge flag={lookupResult.flag} />
                  </div>
                </div>

                {/* Carriers */}
                {(lookupResult.carriers || []).length > 0 && lookupResult.carriers[0] !== 'Unknown' && (
                  <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1, marginRight: 4 }}>CARRIERS</span>
                    {lookupResult.carriers.map((c, i) => (
                      <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px', border: '1px solid var(--border-light)', color: 'var(--muted)', letterSpacing: 0.5 }}>{c}</span>
                    ))}
                  </div>
                )}

                {/* Anathema CTA */}
                <div style={{ padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <a
                    href={`/dashboard/anathema?name=${encodeURIComponent(lookupResult.name)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`}
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '6px 14px', border: '1px solid rgba(0,230,118,0.3)', color: 'var(--green)', textDecoration: 'none', letterSpacing: 2 }}
                  >
                    ◈ RUN ANATHEMA SCAN →
                  </a>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>
                    Deep-scan for captive affiliation
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setLookupResult(null); setLookupName('') }}
                style={{ marginTop: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '7px 14px', cursor: 'pointer' }}
              >
                CLEAR
              </button>
            </div>
          )}

          {/* Empty state tips for lookup */}
          {!lookupResult && !lookupLoading && !lookupError && (
            <div style={{ marginTop: 32 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>HOW AGENT LOOKUP WORKS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {[
                  { n: '01', title: 'Open web search', body: 'Searches Google organic results for the agent\'s name — not just Google Business listings. Works even if they have no local listing.' },
                  { n: '02', title: 'Website crawl', body: 'Finds their website from search results and crawls it for carrier signals, independent language, and contact info.' },
                  { n: '03', title: 'AI scoring', body: 'Same scoring engine as Market Sweep. HOT, WARM, or COLD with a confidence rating based on how much data was found.' },
                ].map(c => (
                  <div key={c.n} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px 22px' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, marginBottom: 10 }}>{c.n}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 8, lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: '#555', lineHeight: 1.7 }}>{c.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
