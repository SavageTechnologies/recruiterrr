'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AgentQuote = {
  quote: string
  sentiment: 'positive' | 'negative' | 'mixed'
  topic: string
  source: string
}

type Analysis = {
  fmo_name: string
  website: string
  tree_affiliation: string
  size_signal: 'LARGE' | 'MID-SIZE' | 'SMALL' | 'UNKNOWN'
  overview: string
  recent_news: string
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
  }
  agent_sentiment: {
    agent_quotes: AgentQuote[]
    common_praise: string[]
    common_complaints: string[]
    contract_flags: string[]
  }
  recruiting_pitch: {
    headline: string
    claims: string[]
    target_agent: string
  }
  gaps: {
    missing_carriers: string[]
    weak_areas: string
    ownership_risk: string
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
  'Hunting incentive trips',
  'Pulling lead programs',
  'Checking tech stack',
  'Running SERP intelligence',
  'Pulling agent reviews + Glassdoor',
  'Extracting facts',
]

const STAGE_LOGS: Record<number, string[]> = {
  0: ['[OK] FMO name received', '[OK] Searching for official domain', '[FOUND] Domain identified'],
  1: ['[OK] Fetching homepage', '[OK] Fetching about page', '[FOUND] Overview extracted'],
  2: ['[OK] Probing /agents', '[OK] Probing /join', '[FOUND] Agent value prop located'],
  3: ['[OK] Probing /carriers', '[OK] Probing /products', '[FOUND] Carrier stack extracted'],
  4: ['[OK] Probing /trips', '[OK] Probing /incentives', '[FOUND] Trip intel compiled'],
  5: ['[OK] Probing /leads', '[OK] Probing /marketing', '[FOUND] Lead program analyzed'],
  6: ['[OK] Probing /technology', '[OK] Probing /tools', '[FOUND] Tech stack identified'],
  7: ['[OK] Running trip SERP', '[OK] Running carrier SERP', '[OK] Running contract SERP', '[FOUND] SERP data compiled'],
  8: ['[OK] Querying Reddit/forums', '[OK] Querying Glassdoor', '[OK] Pulling agent complaints', '[FOUND] Agent voice captured'],
  9: ['[OK] Sending to analysis engine', '[OK] Extracting facts...', '[OK] Compiling briefing...', '[OK] Intel ready'],
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

function SerpEntry({ entry }: { entry: any }) {
  const [open, setOpen] = useState(false)
  const hasResults = (entry.results || []).length > 0
  const label = QUERY_KEY_LABELS[entry.key] || entry.key.toUpperCase()
  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--dark)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer' }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: hasResults ? 'var(--green)' : '#444', minWidth: 16 }}>{hasResults ? '●' : '○'}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, minWidth: 180 }}>{label}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.query}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', minWidth: 60, textAlign: 'right' }}>{hasResults ? `${entry.results.length} results` : 'no results'}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hasResults ? entry.results.map((r: any, i: number) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: 10 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', paddingTop: 2 }}>{i + 1}</span>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 3, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500 }}>{r.title}</span>
                  {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', textDecoration: 'none' }}>↗</a>}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', lineHeight: 1.6 }}>{r.snippet}</div>
              </div>
            </div>
          )) : (
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
  const [result, setResult] = useState<{ fmo_name: string; domain: string | null; pages: string[]; analysis: Analysis; cached?: boolean; cached_at?: string; serp_debug?: any[] } | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'intel' | 'voice' | 'offer' | 'gaps' | 'sources'>('intel')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) loadSavedScan(id)
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

  async function runScan(forceRefresh = false) {
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
        body: JSON.stringify({ fmo_name: fmoName.trim(), website: website.trim() || undefined, force_refresh: forceRefresh }),
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
      addLog(`[OK] ${data.cached ? 'Cached scan loaded' : 'Scan complete'} — ${fmoName.trim()}`)
      addLog(`[FOUND] ${data.pages?.length || 0} pages · ${data.analysis?.data_confidence || 'MEDIUM'} confidence`)
      if ((data.analysis?.agent_sentiment?.agent_quotes || []).length) addLog(`[FOUND] ${data.analysis.agent_sentiment.agent_quotes.length} agent quote(s) extracted`)
      if ((data.analysis?.what_they_offer?.carriers || []).length) addLog(`[FOUND] ${data.analysis.what_they_offer.carriers.length} carrier(s) identified`)
      setResult(data); setActiveTab('intel')
    } catch (err: any) {
      if (timerRef.current) clearTimeout(timerRef.current)
      addLog(`[ALERT] Scan failed: ${err.message}`)
      setError(err.message || 'Scan failed. Please try again.')
    }
    setScanning(false); setCurrentStep(-1)
  }

  const analysis = result?.analysis

  const TABS = [
    { key: 'intel',   label: 'INTEL BRIEF'    },
    { key: 'voice',   label: 'AGENT VOICE'    },
    { key: 'offer',   label: 'WHAT THEY OFFER'},
    { key: 'gaps',    label: 'GAPS & FLAGS'   },
    { key: 'sources', label: '⬡ SOURCES'      },
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
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Competitive Intelligence</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>PROMETHEUS<span style={{ color: 'var(--orange)' }}>.</span></h1>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 2, border: `1px solid ${scanning ? 'var(--orange)' : 'var(--border-light)'}`, background: 'var(--card)', transition: 'border-color 0.2s', boxShadow: scanning ? '0 0 0 1px var(--orange)' : 'none' }}>
        <input value={fmoName} onChange={e => setFmoName(e.target.value)} onKeyDown={e => e.key === 'Enter' && runScan(false)}
          placeholder="FMO or IMO name — e.g. Integrity Marketing Group, AmeriLife, Brokers Alliance"
          disabled={scanning}
          style={{ flex: 1, padding: '18px 24px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }} />
        <button onClick={() => runScan(false)} disabled={scanning || !fmoName.trim()}
          style={{ padding: '18px 32px', background: scanning ? '#333' : 'var(--orange)', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: 'var(--black)', whiteSpace: 'nowrap' }}>
          {scanning ? 'SCANNING...' : 'RUN INTEL'}
        </button>
      </div>
      <div style={{ marginBottom: 2 }}>
        <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL (optional — skip auto-discovery)" disabled={scanning}
          style={{ width: '100%', padding: '12px 24px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5, boxSizing: 'border-box' }} />
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, marginBottom: 32 }}>
        ENTER ANY FMO OR IMO · PROMETHEUS EXTRACTS FACTS FROM THEIR SITE, SERP, AGENT REVIEWS & GLASSDOOR
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

          {/* Cached notice */}
          {result.cached && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #2a2a1a', background: 'rgba(255,200,0,0.04)', padding: '8px 16px', marginBottom: 12 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#887a3a', letterSpacing: 1.5 }}>◷ CACHED · {result.cached_at ? new Date(result.cached_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
              <button onClick={() => runScan(true)} style={{ background: 'transparent', border: '1px solid #333', color: '#555', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.5, padding: '3px 10px', cursor: 'pointer' }}>FORCE REFRESH</button>
            </div>
          )}

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

              {/* Recruiting pitch */}
              {analysis.recruiting_pitch?.headline && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>THEIR RECRUITING PITCH</div>
                  <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', borderLeft: '3px solid var(--border-light)', padding: '14px 18px', fontSize: 14, color: 'var(--white)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 10 }}>
                    "{analysis.recruiting_pitch.headline}"
                  </div>
                  {(analysis.recruiting_pitch.claims || []).filter(Boolean).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {analysis.recruiting_pitch.claims.map((claim, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 3, fontSize: 10 }}>→</span>
                          <span style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{claim}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Carrier highlight */}
              {(analysis.what_they_offer?.carriers || []).length > 0 && (
                <Tags label="Carriers" items={analysis.what_they_offer.carriers} />
              )}

              <Row label="Target Agent" value={analysis.recruiting_pitch?.target_agent} />
              <Row label="Lead Program" value={analysis.what_they_offer?.lead_program} />
              <Row label="Confidence Note" value={analysis.confidence_note} />
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
                      <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.7, fontStyle: 'italic' }}>"{q.quote}"</div>
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

          {/* ── WHAT THEY OFFER ── */}
          {activeTab === 'offer' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, marginBottom: 24 }}>WHAT THEY OFFER</div>
              <Tags label="Carriers" items={analysis.what_they_offer?.carriers || []} />
              <Tags label="Products" items={analysis.what_they_offer?.products || []} />
              <Row label="Contracts" value={analysis.what_they_offer?.contract_terms} />
              <Row label="Lead Program" value={analysis.what_they_offer?.lead_program} />
              <Tags label="Technology" items={analysis.what_they_offer?.technology || []} />
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
            </div>
          )}

          {/* ── GAPS & FLAGS ── */}
          {activeTab === 'gaps' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, marginBottom: 24 }}>GAPS & FLAGS</div>

              {analysis.gaps?.ownership_risk && analysis.gaps.ownership_risk !== 'None found in scan' && (
                <div style={{ padding: '16px 18px', background: 'rgba(255,23,68,0.04)', border: '1px solid rgba(255,23,68,0.2)', marginBottom: 16 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--red)', letterSpacing: 2, marginBottom: 8 }}>OWNERSHIP / CONTRACT RISK</div>
                  <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{analysis.gaps.ownership_risk}</div>
                </div>
              )}

              <Tags label="Missing Carriers" items={analysis.gaps?.missing_carriers || []} />
              <Row label="Weak Areas" value={analysis.gaps?.weak_areas} />
              <Row label="Confidence Note" value={analysis.confidence_note} />
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
                  <SerpEntry key={ei} entry={entry} />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={() => { setResult(null); setFmoName(''); setWebsite('') }} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>
              RUN NEW SCAN
            </button>
            <button onClick={() => runScan(true)} style={{ background: 'transparent', border: '1px solid #333', color: '#444', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>
              FORCE REFRESH
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!scanning && !result && (
        <div style={{ marginTop: 40 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>What Prometheus Extracts</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { n: '01', title: 'Carrier Stack',       tip: 'Every carrier they contract. Names only — no guesses.' },
              { n: '02', title: 'Incentive Trips',      tip: '2025 & 2026 destinations and qualifying thresholds when found.' },
              { n: '03', title: 'Agent Voice',          tip: 'Actual quotes from Reddit, forums, and Glassdoor — sourced and tagged by topic.' },
              { n: '04', title: 'Contract Flags',       tip: 'Specific captive language, release clauses, or chargeback terms agents have flagged.' },
              { n: '05', title: 'Gaps in Their Offer',  tip: 'Carriers they\'re missing, weak areas, and ownership risk.' },
              { n: '06', title: 'Evidence Trail',       tip: 'Every SERP query, every source. You can see exactly where the intel came from.' },
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
