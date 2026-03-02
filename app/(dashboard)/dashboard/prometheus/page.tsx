'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PrometheusScansTable from '@/components/tables/PrometheusScansTable'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AgentQuote = {
  quote: string
  sentiment: 'positive' | 'negative' | 'mixed'
  topic: string
  source: string
}

type Contact = {
  name: string
  title: string
  email: string | null
  phone: string | null
  linkedin: string | null
  source: string
}

type Analysis = {
  fmo_name: string
  website: string
  tree_affiliation: string
  size_signal: 'LARGE' | 'MID-SIZE' | 'SMALL' | 'UNKNOWN'
  overview: string
  recent_news: string
  contacts: Contact[]
  recruiting_activity: {
    actively_recruiting: boolean
    signals: string[]
    target_agent_profile: string
    recruiting_pitch_headline: string
  }
  what_they_offer: {
    carriers: string[]
    products: string[]
    contract_terms: string
    lead_program: string
    technology: string[]
    training: string
    trip_current: string
    trip_threshold: string
    trip_past: string[]
    events: string[]
  }
  agent_sentiment: {
    agent_quotes: AgentQuote[]
    common_praise: string[]
    common_complaints: string[]
    contract_flags: string[]
  }
  sales_angles: {
    tech_gap: string
    retention_problem: string
    recruiting_pain: string
    size_and_budget_read: string
  }
  pages_found: string[]
  data_confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence_note: string
}

// ─── LOADING ──────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  'Discovering FMO website',
  'Crawling homepage + about',
  'Scanning agent / join pages',
  'Extracting carrier contracts',
  'Hunting incentive trips + events',
  'Pulling tech stack + tools',
  'Searching for leadership contacts',
  'Running SERP intelligence',
  'Pulling agent reviews + Glassdoor',
  'Extracting facts + sales angles',
]

const STAGE_LOGS: Record<number, string[]> = {
  0: ['[OK] FMO name received', '[OK] Searching for official domain', '[FOUND] Domain identified'],
  1: ['[OK] Fetching homepage', '[OK] Fetching about page', '[FOUND] Overview extracted'],
  2: ['[OK] Probing /agents', '[OK] Probing /join', '[FOUND] Agent value prop located'],
  3: ['[OK] Probing /carriers', '[OK] Probing /products', '[FOUND] Carrier stack extracted'],
  4: ['[OK] Probing /trips', '[OK] Probing /incentives', '[FOUND] Trip intel compiled'],
  5: ['[OK] Probing /technology', '[OK] Probing /tools', '[FOUND] Tech stack identified'],
  6: ['[OK] Probing /team', '[OK] Probing /about/leadership', '[FOUND] Contacts identified'],
  7: ['[OK] Running trip SERP', '[OK] Running carrier SERP', '[OK] Running leadership SERP', '[FOUND] SERP data compiled'],
  8: ['[OK] Querying Reddit/forums', '[OK] Querying Glassdoor', '[OK] Pulling agent complaints', '[FOUND] Agent voice captured'],
  9: ['[OK] Sending to analysis engine', '[OK] Extracting facts...', '[OK] Building sales angles...', '[OK] Intel ready'],
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function TerminalLog({ lines }: { lines: string[] }) {
  return (
    <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '16px', height: 220, overflowY: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5, lineHeight: 2 }}>
      <div style={{ color: 'var(--muted)', marginBottom: 4, fontSize: 10 }}>prometheus@intel:~$ ./scan</div>
      {lines.map((line, i) => (
        <div key={i} style={{ color: line.startsWith('[OK]') ? 'var(--green)' : line.startsWith('[FOUND]') ? 'var(--orange)' : line.startsWith('[ALERT]') ? 'var(--red)' : 'var(--muted)' }}>
          {line}
        </div>
      ))}
      <div style={{ display: 'inline-block', width: 8, height: 12, background: 'var(--orange)', animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const map = { HIGH: { color: 'var(--green)', label: '● HIGH CONFIDENCE' }, MEDIUM: { color: 'var(--yellow)', label: '◐ MEDIUM CONFIDENCE' }, LOW: { color: '#555', label: '○ LOW CONFIDENCE' } }
  const { color, label } = map[confidence]
  return <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 10px', border: `1px solid ${color}`, color, letterSpacing: 1 }}>{label}</div>
}

function SizeBadge({ size }: { size: string }) {
  const color = size === 'LARGE' ? 'var(--orange)' : size === 'MID-SIZE' ? 'var(--yellow)' : size === 'SMALL' ? 'var(--muted)' : '#444'
  return <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 10px', border: `1px solid ${color}`, color, letterSpacing: 1 }}>{size}</div>
}

function Tags({ label, items }: { label: string; items: string[] }) {
  const filtered = (items || []).filter(Boolean)
  if (!filtered.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, marginBottom: 14, alignItems: 'start' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, paddingTop: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {filtered.map((item, i) => (
          <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '3px 10px', border: '1px solid var(--border-light)', color: 'var(--white)', letterSpacing: 0.5 }}>{item}</span>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value || value === 'Unknown' || value === 'Not found in scan' || value === 'Not found') return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, marginBottom: 14, alignItems: 'start' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{value}</div>
    </div>
  )
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  const color = sentiment === 'positive' ? 'var(--green)' : sentiment === 'negative' ? 'var(--red)' : 'var(--yellow)'
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
}

const QUERY_KEY_LABELS: Record<string, string> = {
  trips: 'TRIPS / INCENTIVES',
  carriers: 'CARRIERS / CONTRACTS',
  agent_voice: 'AGENT VOICE',
  complaints: 'AGENT COMPLAINTS',
  contracts: 'CONTRACT INTEL',
  news: 'RECENT NEWS',
  glassdoor: 'GLASSDOOR',
}

function SerpEntry({ entry, fmoName, domain }: { entry: any; fmoName: string; domain: string | null }) {
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const hasResults = (entry.results || []).length > 0
  const label = QUERY_KEY_LABELS[entry.key] || entry.key.toUpperCase()

  // Build search terms from fmo name and domain — strip common industry stopwords so
  // generic terms like "insurance" / "agency" don't match unrelated results
  const STOPWORDS = new Set([
    'insurance', 'agency', 'group', 'financial', 'services', 'associates',
    'advisors', 'advisor', 'partners', 'health', 'life', 'medicare', 'benefits',
    'solutions', 'general', 'national', 'american', 'united', 'independent',
    'brokerage', 'broker', 'planning', 'management', 'consulting', 'and', 'the',
  ])
  const matchTokens = [
    ...fmoName.toLowerCase().split(/\s+/).filter(t => t.length > 2 && !STOPWORDS.has(t)),
    ...(domain ? [domain.toLowerCase().replace(/^www\./, '').split('.')[0]] : []),
  ].filter(t => t.length > 2)

  function isRelevant(r: any) {
    const hay = `${r.title || ''} ${r.snippet || ''} ${r.link || ''}`.toLowerCase()
    return matchTokens.some(token => hay.includes(token))
  }

  const results = entry.results || []
  const relevantResults = results.filter(isRelevant)
  const noiseResults = results.filter((r: any) => !isRelevant(r))
  const displayResults = showAll ? results : relevantResults
  const noiseCount = noiseResults.length

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--dark)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer' }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: hasResults ? 'var(--green)' : '#444', minWidth: 16 }}>{hasResults ? '●' : '○'}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, minWidth: 180 }}>{label}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.query}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: relevantResults.length > 0 ? 'var(--green)' : '#444', minWidth: 80, textAlign: 'right' }}>
          {relevantResults.length} relevant
        </span>
        {noiseCount > 0 && (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', minWidth: 60, textAlign: 'right' }}>
            +{noiseCount} noise
          </span>
        )}
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hasResults ? (
            <>
              {displayResults.length === 0 && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', padding: '8px 0' }}>
                  NO RELEVANT RESULTS — all {results.length} results were industry noise
                </div>
              )}
              {displayResults.map((r: any, i: number) => {
                const relevant = isRelevant(r)
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: 10, opacity: relevant ? 1 : 0.3 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: relevant ? 'var(--green)' : '#333', paddingTop: 2 }}>{relevant ? '◈' : '·'}</span>
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 3, alignItems: 'baseline' }}>
                        <span style={{ fontSize: 12, color: relevant ? 'var(--white)' : '#444', fontWeight: 500 }}>{r.title}</span>
                        {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', textDecoration: 'none' }}>↗</a>}
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: relevant ? '#555' : '#333', lineHeight: 1.6 }}>{r.snippet}</div>
                    </div>
                  </div>
                )
              })}

              {/* Toggle noise */}
              {noiseCount > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); setShowAll(v => !v) }}
                  style={{ alignSelf: 'flex-start', marginTop: 4, background: 'transparent', border: '1px solid #2a2a2a', color: '#444', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '4px 10px', cursor: 'pointer' }}
                >
                  {showAll ? `HIDE ${noiseCount} NOISE RESULTS ▲` : `SHOW ${noiseCount} INDUSTRY NOISE ▼`}
                </button>
              )}
            </>
          ) : (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333' }}>{(entry.signals_fired || []).join(' · ') || 'No results'}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function PrometheusPageInner() {
  const searchParams = useSearchParams()
  const [fmoName, setFmoName] = useState('')
  const [website, setWebsite] = useState('')
  const [scanning, setScanning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [logLines, setLogLines] = useState<string[]>([])
  const [result, setResult] = useState<{ fmo_name: string; domain: string | null; pages: string[]; analysis: Analysis; serp_debug?: any[] } | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'intel' | 'contacts' | 'recruiting' | 'offer' | 'angles' | 'voice' | 'sources'>('intel')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [scans, setScans] = useState<any[]>([])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) loadSavedScan(id)
    fetch('/api/prometheus')
      .then(r => r.json())
      .then(d => setScans(d.scans || []))
      .catch(() => {})
  }, [])

  async function loadSavedScan(id: string) {
    try {
      const res = await fetch(`/api/prometheus?id=${id}`)
      const data = await res.json()
      if (data.scan) {
        setFmoName(data.scan.domain)
        setResult({ fmo_name: data.scan.domain, domain: data.scan.analysis_json?.website || null, pages: data.scan.pages_scanned || [], analysis: data.scan.analysis_json, serp_debug: data.scan.serp_debug || [] })
      }
    } catch {}
  }

  function addLog(line: string) { setLogLines(prev => [...prev.slice(-50), line]) }

  async function runScan() {
    if (!fmoName.trim() || scanning) return
    setScanning(true); setResult(null); setError(''); setLogLines([]); setCurrentStep(0)

    let si = 0, li = 0
    function tick() {
      if (si >= LOADING_STEPS.length) return
      setCurrentStep(si)
      const stageLogs = STAGE_LOGS[si] || []
      if (li < stageLogs.length) { addLog(stageLogs[li]); li++; timerRef.current = setTimeout(tick, 300) }
      else { li = 0; si++; if (si < LOADING_STEPS.length) timerRef.current = setTimeout(tick, 400) }
    }
    tick()

    try {
      const res = await fetch('/api/prometheus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fmo_name: fmoName.trim(), website: website.trim() || undefined }),
      })
      if (res.status === 429) {
        if (timerRef.current) clearTimeout(timerRef.current)
        addLog('[ALERT] Rate limit hit — try again later')
        setError('RATE LIMIT — Too many scans. Try again in a few minutes.')
        setScanning(false); setCurrentStep(-1); return
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (timerRef.current) clearTimeout(timerRef.current)
      setCurrentStep(LOADING_STEPS.length - 1)
      addLog(`[OK] Scan complete — ${fmoName.trim()}`)
      addLog(`[FOUND] ${data.pages?.length || 0} pages · ${data.analysis?.data_confidence || 'MEDIUM'} confidence`)
      if ((data.analysis?.contacts || []).length) addLog(`[FOUND] ${data.analysis.contacts.length} contact(s) identified`)
      if ((data.analysis?.agent_sentiment?.agent_quotes || []).length) addLog(`[FOUND] ${data.analysis.agent_sentiment.agent_quotes.length} agent quote(s) extracted`)
      if ((data.analysis?.what_they_offer?.carriers || []).length) addLog(`[FOUND] ${data.analysis.what_they_offer.carriers.length} carrier(s) identified`)
      setResult(data); setActiveTab('intel')
      // Refresh scan history
      fetch('/api/prometheus').then(r => r.json()).then(d => setScans(d.scans || [])).catch(() => {})
    } catch (err: any) {
      if (timerRef.current) clearTimeout(timerRef.current)
      addLog(`[ALERT] Scan failed: ${err.message}`)
      setError(err.message || 'Scan failed. Please try again.')
    }
    setScanning(false); setCurrentStep(-1)
  }

  const analysis = result?.analysis

  const TABS = [
    { key: 'intel',      label: 'INTEL BRIEF'       },
    { key: 'contacts',   label: '◎ CONTACTS'        },
    { key: 'recruiting', label: 'RECRUITING SIGNALS' },
    { key: 'offer',      label: 'WHAT THEY OFFER'   },
    { key: 'angles',     label: '⚡ SALES ANGLES'   },
    { key: 'voice',      label: 'AGENT VOICE'       },
    { key: 'sources',    label: '⬡ SOURCES'         },
  ] as const

  return (
    <div style={{ padding: '60px 40px', maxWidth: 1100 }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadSlide { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>FMO Sales Intelligence</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>PROMETHEUS<span style={{ color: 'var(--orange)' }}>.</span></h1>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 2, border: `1px solid ${scanning ? 'var(--orange)' : 'var(--border-light)'}`, background: 'var(--card)', transition: 'border-color 0.2s', boxShadow: scanning ? '0 0 0 1px var(--orange)' : 'none' }}>
        <input value={fmoName} onChange={e => setFmoName(e.target.value)} onKeyDown={e => e.key === 'Enter' && runScan()}
          placeholder="FMO or IMO name — e.g. Brokers Alliance, Senior Market Sales, AmeriLife"
          disabled={scanning}
          style={{ flex: 1, padding: '18px 24px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }} />
        <button onClick={() => runScan()} disabled={scanning || !fmoName.trim()}
          style={{ padding: '18px 32px', background: scanning ? '#333' : 'var(--orange)', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: 'var(--black)', whiteSpace: 'nowrap' }}>
          {scanning ? 'SCANNING...' : 'RUN INTEL'}
        </button>
      </div>
      <div style={{ marginBottom: 2 }}>
        <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL (optional — skip auto-discovery)" disabled={scanning}
          style={{ width: '100%', padding: '12px 24px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5, boxSizing: 'border-box' }} />
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, marginBottom: 32 }}>
        ENTER ANY FMO OR IMO · PROMETHEUS FINDS CONTACTS, SALES ANGLES, THEIR FULL PACKAGE, AND AGENT SENTIMENT
      </div>

      {/* Loading */}
      {scanning && currentStep >= 0 && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--orange)', animation: 'loadSlide 1s ease-in-out infinite' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LOADING_STEPS.map((step, i) => (
                <div key={step} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10, color: i < currentStep ? 'var(--green)' : i === currentStep ? 'var(--orange)' : '#333', transition: 'color 0.3s' }}>
                  <span style={{ fontSize: 8 }}>{i < currentStep ? '●' : i === currentStep ? '◐' : '○'}</span>{step}
                </div>
              ))}
            </div>
            <TerminalLog lines={logLines} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div style={{ padding: '16px 20px', border: '1px solid var(--red)', background: 'rgba(255,23,68,0.05)', color: 'var(--red)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1, marginBottom: 32 }}>{error}</div>}

      {/* Results */}
      {result && analysis && !scanning && (
        <div style={{ animation: 'slideIn 0.3s ease both' }}>

          {/* Result header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--white)', letterSpacing: 2, lineHeight: 1 }}>{analysis.fmo_name || result.fmo_name}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 4 }}>
                {result.domain && <span>{result.domain} · </span>}{result.pages?.length || 0} pages crawled
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <SizeBadge size={analysis.size_signal || 'UNKNOWN'} />
              <ConfidenceBadge confidence={analysis.data_confidence || 'MEDIUM'} />
            </div>
          </div>

          {/* Overview */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--orange)', padding: '20px 28px', marginBottom: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>OVERVIEW</div>
              {analysis.tree_affiliation && analysis.tree_affiliation !== 'Unknown' && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 1, border: '1px solid var(--orange)', padding: '2px 10px' }}>{analysis.tree_affiliation.toUpperCase()}</div>
              )}
            </div>
            <p style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.7, margin: 0 }}>{analysis.overview}</p>
            {analysis.recent_news && analysis.recent_news !== 'None found in scan' && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,165,0,0.06)', borderLeft: '2px solid var(--orange)' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--orange)', letterSpacing: 2, marginBottom: 4 }}>RECENT NEWS</div>
                <div style={{ fontSize: 12, color: 'var(--white)', lineHeight: 1.6 }}>{analysis.recent_news}</div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 2, marginTop: 2, flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <div key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ padding: '10px 18px', background: activeTab === tab.key ? 'var(--card)' : 'transparent', border: `1px solid ${activeTab === tab.key ? 'var(--border-light)' : 'var(--border)'}`, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, cursor: 'pointer', color: activeTab === tab.key ? 'var(--orange)' : 'var(--muted)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {tab.label}
              </div>
            ))}
          </div>

          {/* ── INTEL BRIEF ── */}
          {activeTab === 'intel' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, marginBottom: 24 }}>INTEL BRIEF</div>

              {/* Trip highlight */}
              {analysis.what_they_offer?.trip_current && analysis.what_they_offer.trip_current !== 'Not found in scan' && (
                <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', borderLeft: '3px solid var(--orange)', padding: '16px 20px', marginBottom: 20 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, marginBottom: 6 }}>CURRENT / UPCOMING TRIP</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--white)', letterSpacing: 2, marginBottom: 4 }}>{analysis.what_they_offer.trip_current}</div>
                  {analysis.what_they_offer.trip_threshold && analysis.what_they_offer.trip_threshold !== 'Not found in scan' && (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)' }}>THRESHOLD: {analysis.what_they_offer.trip_threshold}</div>
                  )}
                </div>
              )}

              {/* Recruiting activity badge */}
              {analysis.recruiting_activity && (
                <div style={{ marginBottom: 20, padding: '14px 18px', background: analysis.recruiting_activity.actively_recruiting ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${analysis.recruiting_activity.actively_recruiting ? 'rgba(0,230,118,0.25)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: analysis.recruiting_activity.actively_recruiting ? 10 : 0 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: analysis.recruiting_activity.actively_recruiting ? 'var(--green)' : '#444', letterSpacing: 2 }}>
                      {analysis.recruiting_activity.actively_recruiting ? '● ACTIVELY RECRUITING' : '○ NO ACTIVE RECRUITING SIGNALS'}
                    </span>
                  </div>
                  {analysis.recruiting_activity.actively_recruiting && analysis.recruiting_activity.signals?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {analysis.recruiting_activity.signals.slice(0, 3).map((s, i) => (
                        <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', display: 'flex', gap: 8 }}>
                          <span style={{ color: 'var(--green)' }}>→</span>{s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recruiting pitch */}
              {analysis.recruiting_activity?.recruiting_pitch_headline && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>THEIR RECRUITING PITCH</div>
                  <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', borderLeft: '3px solid var(--border-light)', padding: '14px 18px', fontSize: 14, color: 'var(--white)', lineHeight: 1.6, fontStyle: 'italic' }}>
                    &ldquo;{analysis.recruiting_activity.recruiting_pitch_headline}&rdquo;
                  </div>
                </div>
              )}

              {/* Carrier highlight */}
              {(analysis.what_they_offer?.carriers || []).length > 0 && (
                <Tags label="Carriers" items={analysis.what_they_offer.carriers} />
              )}

              <Row label="Target Agent" value={analysis.recruiting_activity?.target_agent_profile} />
              <Row label="Lead Program" value={analysis.what_they_offer?.lead_program} />
              <Row label="Confidence Note" value={analysis.confidence_note} />
            </div>
          )}

          {/* ── CONTACTS ── */}
          {activeTab === 'contacts' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, marginBottom: 24 }}>CONTACTS</div>
              {(analysis.contacts || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {analysis.contacts.map((c, i) => (
                    <div key={i} style={{ padding: '16px 20px', background: 'var(--dark)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                      <div>
                        <div style={{ fontSize: 14, color: 'var(--white)', fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 1, marginBottom: 8 }}>{c.title}</div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          {c.email && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)' }}>✉ {c.email}</span>}
                          {c.phone && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)' }}>☎ {c.phone}</span>}
                          {c.linkedin && (
                            <a href={c.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', textDecoration: 'none' }}>in LinkedIn ↗</a>
                          )}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1, textAlign: 'right', paddingTop: 2 }}>{c.source}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#333', padding: '20px 0' }}>
                  No named contacts found in this scan. Try a LinkedIn search for {result.fmo_name} leadership.
                </div>
              )}
            </div>
          )}

          {/* ── RECRUITING SIGNALS ── */}
          {activeTab === 'recruiting' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, marginBottom: 24 }}>RECRUITING SIGNALS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: analysis.recruiting_activity?.actively_recruiting ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${analysis.recruiting_activity?.actively_recruiting ? 'rgba(0,230,118,0.25)' : '#2a2a2a'}` }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: analysis.recruiting_activity?.actively_recruiting ? 'var(--green)' : '#444', letterSpacing: 1 }}>
                  {analysis.recruiting_activity?.actively_recruiting ? '● ACTIVELY RECRUITING' : '○ NO ACTIVE RECRUITING SIGNALS FOUND'}
                </span>
              </div>
              {(analysis.recruiting_activity?.signals || []).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>EVIDENCE</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {analysis.recruiting_activity.signals.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 3, fontSize: 10 }}>→</span>
                        <span style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Row label="Target Agent" value={analysis.recruiting_activity?.target_agent_profile} />
              <Row label="Their Pitch" value={analysis.recruiting_activity?.recruiting_pitch_headline} />
              {(analysis.what_they_offer?.events || []).length > 0 && (
                <Tags label="Events" items={analysis.what_they_offer.events} />
              )}
            </div>
          )}

          {/* ── WHAT THEY OFFER ── */}
          {activeTab === 'offer' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, marginBottom: 24 }}>WHAT THEY OFFER</div>
              <Tags label="Carriers" items={analysis.what_they_offer?.carriers || []} />
              <Tags label="Products" items={analysis.what_they_offer?.products || []} />
              <Row label="Contracts" value={analysis.what_they_offer?.contract_terms} />
              <Row label="Lead Program" value={analysis.what_they_offer?.lead_program} />
              <Tags label="Technology" items={analysis.what_they_offer?.technology || []} />
              {(analysis.what_they_offer?.technology || []).length === 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, marginBottom: 14 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>Technology</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', fontStyle: 'italic' }}>None mentioned — potential tech gap</div>
                </div>
              )}
              <Row label="Training" value={analysis.what_they_offer?.training} />
              {analysis.what_they_offer?.trip_current && analysis.what_they_offer.trip_current !== 'Not found in scan' && (
                <Row label="Current Trip" value={analysis.what_they_offer.trip_current} />
              )}
              {analysis.what_they_offer?.trip_threshold && analysis.what_they_offer.trip_threshold !== 'Not found in scan' && (
                <Row label="Trip Threshold" value={analysis.what_they_offer.trip_threshold} />
              )}
              {(analysis.what_they_offer?.trip_past || []).length > 0 && (
                <Tags label="Past Trips" items={analysis.what_they_offer.trip_past} />
              )}
              {(analysis.what_they_offer?.events || []).length > 0 && (
                <Tags label="Events" items={analysis.what_they_offer.events} />
              )}
            </div>
          )}

          {/* ── SALES ANGLES ── */}
          {activeTab === 'angles' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, marginBottom: 24 }}>SALES ANGLES</div>
              {analysis.sales_angles?.size_and_budget_read && (
                <div style={{ padding: '16px 18px', background: 'rgba(255,165,0,0.04)', border: '1px solid rgba(255,165,0,0.15)', marginBottom: 12 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, marginBottom: 8 }}>SIZE & BUDGET READ</div>
                  <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{analysis.sales_angles.size_and_budget_read}</div>
                </div>
              )}
              {analysis.sales_angles?.tech_gap && analysis.sales_angles.tech_gap !== 'Not found in scan' && (
                <div style={{ padding: '16px 18px', background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)', marginBottom: 12 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 2, marginBottom: 8 }}>TECH GAP</div>
                  <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{analysis.sales_angles.tech_gap}</div>
                </div>
              )}
              {analysis.sales_angles?.retention_problem && analysis.sales_angles.retention_problem !== 'Not found in scan' && (
                <div style={{ padding: '16px 18px', background: 'rgba(255,23,68,0.04)', border: '1px solid rgba(255,23,68,0.15)', marginBottom: 12 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--red)', letterSpacing: 2, marginBottom: 8 }}>RETENTION PROBLEM</div>
                  <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{analysis.sales_angles.retention_problem}</div>
                </div>
              )}
              {analysis.sales_angles?.recruiting_pain && analysis.sales_angles.recruiting_pain !== 'Not found in scan' && (
                <div style={{ padding: '16px 18px', background: 'rgba(255,165,0,0.04)', border: '1px solid rgba(255,165,0,0.15)', marginBottom: 12 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, marginBottom: 8 }}>RECRUITING PAIN</div>
                  <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{analysis.sales_angles.recruiting_pain}</div>
                </div>
              )}
              {/* Agent complaints as additional angles */}
              {(analysis.agent_sentiment?.common_complaints || []).length > 0 && (
                <div style={{ marginTop: 8, padding: '16px 18px', background: 'rgba(255,23,68,0.03)', border: '1px solid #2a1a1a' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#664444', letterSpacing: 2, marginBottom: 12 }}>AGENT PAIN POINTS (additional angles)</div>
                  {analysis.agent_sentiment.common_complaints.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--red)', flexShrink: 0, fontSize: 10, marginTop: 3 }}>−</span>
                      <span style={{ fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── AGENT VOICE ── */}
          {activeTab === 'voice' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, marginBottom: 24 }}>AGENT VOICE</div>

              {/* Quotes */}
              {(analysis.agent_sentiment?.agent_quotes || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
                  {analysis.agent_sentiment.agent_quotes.map((q, i) => (
                    <div key={i} style={{ padding: '14px 18px', background: 'var(--dark)', border: '1px solid var(--border)', borderLeft: `3px solid ${q.sentiment === 'positive' ? 'var(--green)' : q.sentiment === 'negative' ? 'var(--red)' : 'var(--yellow)'}` }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <SentimentDot sentiment={q.sentiment} />
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--muted)', letterSpacing: 2 }}>{q.topic?.toUpperCase()}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 1 }}>{q.source}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.7, fontStyle: 'italic' }}>&ldquo;{q.quote}&rdquo;</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#333', marginBottom: 24 }}>No agent quotes found in this scan.</div>
              )}

              {/* Praise vs complaints side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {(analysis.agent_sentiment?.common_praise || []).length > 0 && (
                  <div style={{ padding: '16px 18px', background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 2, marginBottom: 12 }}>WHAT AGENTS LIKE</div>
                    {analysis.agent_sentiment.common_praise.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--green)', flexShrink: 0, fontSize: 10, marginTop: 3 }}>+</span>
                        <span style={{ fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(analysis.agent_sentiment?.common_complaints || []).length > 0 && (
                  <div style={{ padding: '16px 18px', background: 'rgba(255,23,68,0.04)', border: '1px solid rgba(255,23,68,0.15)' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--red)', letterSpacing: 2, marginBottom: 12 }}>WHAT AGENTS COMPLAIN ABOUT</div>
                    {analysis.agent_sentiment.common_complaints.map((c, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--red)', flexShrink: 0, fontSize: 10, marginTop: 3 }}>−</span>
                        <span style={{ fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(analysis.agent_sentiment?.contract_flags || []).length > 0 && (
                <div style={{ marginTop: 2, padding: '16px 18px', background: 'rgba(255,165,0,0.04)', border: '1px solid rgba(255,165,0,0.2)' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, marginBottom: 12 }}>CONTRACT FLAGS FROM AGENTS</div>
                  {analysis.agent_sentiment.contract_flags.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--orange)', flexShrink: 0, fontSize: 10, marginTop: 3 }}>⚑</span>
                      <span style={{ fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SOURCES ── */}
          {activeTab === 'sources' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, marginBottom: 24 }}>EVIDENCE TRAIL</div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>WEBSITE</div>
                {result.domain ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)', padding: '10px 16px' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)' }}>● FOUND</span>
                    <a href={`https://${result.domain}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--white)', textDecoration: 'none' }}>{result.domain}</a>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', marginLeft: 'auto' }}>{result.pages?.length || 0} pages: {result.pages?.join(', ')}</span>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,23,68,0.04)', border: '1px solid rgba(255,23,68,0.15)', padding: '10px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#666' }}>
                    ○ NO SITE FOUND — Intel is SERP-only
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>SERP QUERIES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(result.serp_debug || []).filter((e: any) => e.key !== 'website_discovery').map((entry: any, ei: number) => (
                  <SerpEntry key={ei} entry={entry} fmoName={result.fmo_name} domain={result.domain} />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={() => { setResult(null); setFmoName(''); setWebsite('') }} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>
              ← RUN NEW SCAN
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!scanning && !result && (
        <div style={{ marginTop: 40 }}>

          {/* Past scans */}
          {scans.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>SCAN HISTORY</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>{scans.length} total</div>
              </div>
              <PrometheusScansTable scans={scans} onSelect={(id, domain) => { setFmoName(domain); loadSavedScan(id) }} />
            </div>
          )}

          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>What Prometheus Extracts</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { n: '01', title: 'Contacts',              tip: 'Named leaders with titles — CEO, VP, founder. Pulled from team pages, SERP, and press releases.' },
              { n: '02', title: 'Recruiting Activity',   tip: 'Is this FMO actively trying to grow agents right now? Job postings, ads, recent announcements.' },
              { n: '03', title: 'Sales Angles',          tip: 'Tech gaps, retention problems, and recruiting pain — the specific reasons they need a tool.' },
              { n: '04', title: 'Their Full Package',    tip: 'Carriers, trips, lead program, events, tech stack. Walk in knowing their offer cold.' },
              { n: '05', title: 'Agent Voice',           tip: 'What agents actually say on Reddit, forums, and Glassdoor. Pain points = your opening.' },
              { n: '06', title: 'Evidence Trail',        tip: 'Every SERP query, every source. You see exactly where the intel came from.' },
            ].map(c => (
              <div key={c.n} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px 24px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--orange)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, marginBottom: 10 }}>{c.n}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)', marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>{c.tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PrometheusPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 40px', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading...</div>}>
      <PrometheusPageInner />
    </Suspense>
  )
}
