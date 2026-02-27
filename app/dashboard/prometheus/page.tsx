'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Analysis = {
  fmo_name: string
  website: string
  overview: string
  size_signal: 'LARGE' | 'MID-SIZE' | 'SMALL' | 'UNKNOWN'
  what_they_offer: {
    carriers: string[]
    contract_highlights: string
    lead_program: string
    technology: string[]
    training: string
    marketing_support: string
  }
  incentive_trips: {
    current_trip: string
    past_trips: string[]
    qualification: string
    trip_intel: string
  }
  their_pitch: {
    headline_claim: string
    key_selling_points: string[]
    target_agent: string
    differentiators: string
  }
  weak_points: {
    agent_complaints: string
    gaps: string
    red_flags: string
  }
  competitive_intel: {
    tree_affiliation: string
    recent_changes: string
    market_position: string
  }
  your_counter: {
    opening_line: string
    key_angles: string[]
    trip_angle: string
    carrier_angle: string
    close: string
  }
  pages_found: string[]
  data_confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence_note: string
}

const LOADING_STEPS = [
  'Discovering FMO website',
  'Crawling homepage + about',
  'Scanning agent/join pages',
  'Extracting carrier contracts',
  'Hunting incentive trips',
  'Digging lead programs',
  'Pulling tech stack',
  'Running SERP intelligence',
  'Analyzing agent reviews',
  'Generating intel briefing',
]

const STAGE_LOGS: Record<number, string[]> = {
  0: ['[OK] FMO name received', '[OK] Searching for official website', '[FOUND] Domain identified'],
  1: ['[OK] Fetching homepage', '[OK] Fetching about page', '[FOUND] Company overview extracted'],
  2: ['[OK] Probing /agents', '[OK] Probing /join', '[OK] Probing /partner-with-us', '[FOUND] Agent value prop located'],
  3: ['[OK] Probing /carriers', '[OK] Probing /products', '[FOUND] Carrier stack extracted'],
  4: ['[OK] Probing /trips', '[OK] Probing /incentives', '[OK] Probing /events', '[FOUND] Trip intel compiled'],
  5: ['[OK] Probing /leads', '[OK] Probing /lead-program', '[OK] Probing /marketing', '[FOUND] Lead program analyzed'],
  6: ['[OK] Probing /technology', '[OK] Probing /tools', '[OK] Probing /platform', '[FOUND] Tech stack identified'],
  7: ['[OK] Searching trip destinations 2025 2026', '[OK] Searching agent complaints', '[OK] Searching commission overrides', '[FOUND] SERP intelligence compiled'],
  8: ['[OK] Analyzing agent reviews', '[OK] Cross-referencing complaints', '[OK] Identifying weak points', '[FOUND] Competitive gaps mapped'],
  9: ['[OK] Sending to intelligence engine', '[OK] Building counter-pitch...', '[OK] Compiling briefing...', '[OK] Report ready'],
}

function ConfidenceBadge({ confidence }: { confidence: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const map = {
    HIGH: { color: 'var(--green)', label: '● HIGH CONFIDENCE' },
    MEDIUM: { color: 'var(--yellow)', label: '◐ MEDIUM CONFIDENCE' },
    LOW: { color: '#555', label: '○ LOW CONFIDENCE' },
  }
  const { color, label } = map[confidence]
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 10px', border: `1px solid ${color}`, color, letterSpacing: 1 }}>
      {label}
    </div>
  )
}

function SizeBadge({ size }: { size: string }) {
  const color = size === 'LARGE' ? 'var(--orange)' : size === 'MID-SIZE' ? 'var(--yellow)' : size === 'SMALL' ? 'var(--muted)' : '#444'
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 10px', border: `1px solid ${color}`, color, letterSpacing: 1 }}>
      {size}
    </div>
  )
}

function TerminalLog({ lines }: { lines: string[] }) {
  return (
    <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '16px', height: 220, overflowY: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5, lineHeight: 2 }}>
      <div style={{ color: 'var(--muted)', marginBottom: 4, fontSize: 10 }}>prometheus@intel:~$ ./scan</div>
      {lines.map((line, i) => (
        <div key={i} style={{
          color: line.startsWith('[OK]') ? 'var(--green)' : line.startsWith('[WARN]') ? 'var(--yellow)' : line.startsWith('[ALERT]') ? 'var(--red)' : line.startsWith('[FOUND]') ? 'var(--orange)' : 'var(--muted)',
          animation: 'slideIn 0.2s ease both',
        }}>
          {line}
        </div>
      ))}
      <div style={{ display: 'inline-block', width: 8, height: 12, background: 'var(--orange)', animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>{label}</div>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value || value === 'Unknown' || value === 'Not found') return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, marginBottom: 14, alignItems: 'start' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{value}</div>
    </div>
  )
}

function Tags({ label, items }: { label: string; items: string[] }) {
  const filtered = (items || []).filter(Boolean)
  if (!filtered.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, marginBottom: 14, alignItems: 'start' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, paddingTop: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {filtered.map((item, i) => (
          <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '3px 10px', border: '1px solid var(--border-light)', color: 'var(--white)', letterSpacing: 0.5 }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function CounterAngle({ angle, i }: { angle: string; i: number }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 10, alignItems: 'flex-start' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', minWidth: 20, paddingTop: 2 }}>0{i + 1}</div>
      <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{angle}</div>
    </div>
  )
}

const QUERY_KEY_LABELS: Record<string, string> = {
  trips: 'TRIPS / INCENTIVES',
  carriers: 'CARRIERS / CONTRACTS',
  reviews: 'AGENT REVIEWS',
  complaints: 'AGENT COMPLAINTS',
  recruiting: 'RECRUITING PITCH',
  news: 'RECENT NEWS',
}

function SerpEntry({ entry }: { entry: any }) {
  const [open, setOpen] = useState(false)
  const hasResults = (entry.results || []).length > 0
  const label = QUERY_KEY_LABELS[entry.key] || entry.key.toUpperCase()

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--dark)' }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer' }}
      >
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.5,
          color: hasResults ? 'var(--green)' : '#444',
          minWidth: 16,
        }}>
          {hasResults ? '●' : '○'}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, minWidth: 160 }}>
          {label}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.query}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', minWidth: 60, textAlign: 'right' }}>
          {hasResults ? `${entry.results.length} results` : 'no results'}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', marginLeft: 8 }}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded results */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hasResults ? entry.results.map((r: any, i: number) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: 10, alignItems: 'start' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', paddingTop: 2 }}>{i + 1}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500, lineHeight: 1.4 }}>{r.title}</span>
                  {r.link && (
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', textDecoration: 'none', flexShrink: 0 }}
                    >
                      ↗
                    </a>
                  )}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', lineHeight: 1.6 }}>{r.snippet}</div>
              </div>
            </div>
          )) : (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333' }}>
              {(entry.signals_fired || []).join(' · ') || 'No results returned'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PrometheusPageInner() {
  const searchParams = useSearchParams()
  const [fmoName, setFmoName] = useState('')
  const [website, setWebsite] = useState('')
  const [scanning, setScanning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [logLines, setLogLines] = useState<string[]>([])
  const [result, setResult] = useState<{ fmo_name: string; domain: string | null; pages: string[]; analysis: Analysis; cached?: boolean; cached_at?: string; serp_debug?: any[] } | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'offer' | 'trips' | 'pitch' | 'weaknesses' | 'counter' | 'sources'>('offer')
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
        setResult({
          fmo_name: data.scan.domain,
          domain: data.scan.analysis_json?.website || null,
          pages: data.scan.pages_scanned || [],
          analysis: data.scan.analysis_json,
          serp_debug: data.scan.serp_debug || [],
        })
      }
    } catch {}
  }

  function addLog(line: string) {
    setLogLines(prev => [...prev.slice(-50), line])
  }

  async function runScan(forceRefresh = false) {
    if (!fmoName.trim() || scanning) return
    setScanning(true)
    setResult(null)
    setError('')
    setLogLines([])
    setCurrentStep(0)

    let si = 0
    let li = 0
    function tick() {
      if (si >= LOADING_STEPS.length) return
      setCurrentStep(si)
      const stageLogs = STAGE_LOGS[si] || []
      if (li < stageLogs.length) {
        addLog(stageLogs[li]); li++
        timerRef.current = setTimeout(tick, 300)
      } else {
        li = 0; si++
        if (si < LOADING_STEPS.length) timerRef.current = setTimeout(tick, 400)
      }
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
        addLog('[ALERT] Rate limit hit — try again in a few minutes')
        setError('RATE LIMIT — Too many scans. Try again in a few minutes.')
        setScanning(false)
        setCurrentStep(-1)
        return
      }

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (timerRef.current) clearTimeout(timerRef.current)
      setCurrentStep(LOADING_STEPS.length - 1)

      if (data.cached) {
        addLog(`[OK] Cached scan loaded — ${fmoName.trim()}`)
        addLog(`[OK] Scanned ${new Date(data.cached_at).toLocaleDateString()} · ${data.pages?.length || 0} pages`)
      } else {
        addLog(`[OK] Scan complete — ${fmoName.trim()}`)
        addLog(`[FOUND] ${data.pages?.length || 0} pages crawled · ${data.analysis?.data_confidence || 'MEDIUM'} confidence`)
      }
      if (data.analysis?.incentive_trips?.current_trip && data.analysis.incentive_trips.current_trip !== 'Not found in scan') {
        addLog(`[FOUND] Trip intel: ${data.analysis.incentive_trips.current_trip}`)
      }
      if (data.analysis?.what_they_offer?.carriers?.length) {
        addLog(`[FOUND] ${data.analysis.what_they_offer.carriers.length} carrier(s) identified`)
      }
      setResult(data)
      setActiveTab('offer')
    } catch (err: any) {
      if (timerRef.current) clearTimeout(timerRef.current)
      addLog(`[ALERT] Scan failed: ${err.message}`)
      setError(err.message || 'Scan failed. Please try again.')
    }
    setScanning(false)
    setCurrentStep(-1)
  }

  const analysis = result?.analysis

  const TABS = [
    { key: 'offer', label: 'WHAT THEY OFFER' },
    { key: 'trips', label: 'TRIPS & INCENTIVES' },
    { key: 'pitch', label: 'THEIR PITCH' },
    { key: 'weaknesses', label: 'WEAK POINTS' },
    { key: 'counter', label: '▶ YOUR COUNTER' },
    { key: 'sources', label: '⬡ SOURCES' },
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
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
          Competitive Intelligence
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>
          PROMETHEUS<span style={{ color: 'var(--orange)' }}>.</span>
        </h1>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 2, border: `1px solid ${scanning ? 'var(--orange)' : 'var(--border-light)'}`, background: 'var(--card)', transition: 'border-color 0.2s', boxShadow: scanning ? '0 0 0 1px var(--orange)' : 'none' }}>
        <input
          value={fmoName}
          onChange={e => setFmoName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runScan(false)}
          placeholder="FMO or IMO name — e.g. Integrity Marketing Group, AmeriLife, Brokers Alliance"
          disabled={scanning}
          style={{ flex: 1, padding: '18px 24px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }}
        />
        <button
          onClick={runScan.bind(null, false)}
          disabled={scanning || !fmoName.trim()}
          style={{ padding: '18px 32px', background: scanning ? '#333' : 'var(--orange)', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: 'var(--black)', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
        >
          {scanning ? 'SCANNING...' : 'RUN INTEL'}
        </button>
      </div>

      <div style={{ marginBottom: 2 }}>
        <input
          value={website}
          onChange={e => setWebsite(e.target.value)}
          placeholder="Website URL (optional — skip auto-discovery)"
          disabled={scanning}
          style={{ width: '100%', padding: '12px 24px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5, boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, marginBottom: 32 }}>
        ENTER ANY FMO OR IMO NAME · PROMETHEUS FINDS THEIR SITE AND EXTRACTS FULL COMPETITIVE INTEL
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
                  <span style={{ fontSize: 8 }}>{i < currentStep ? '●' : i === currentStep ? '◐' : '○'}</span>
                  {step}
                </div>
              ))}
            </div>
            <TerminalLog lines={logLines} />
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
      {result && analysis && !scanning && (
        <div style={{ animation: 'slideIn 0.3s ease both' }}>

          {/* Cached notice */}
          {result.cached && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #2a2a1a', background: 'rgba(255,200,0,0.04)', padding: '8px 16px', marginBottom: 12 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#887a3a', letterSpacing: 1.5 }}>
                ◷ CACHED SCAN · {result.cached_at ? new Date(result.cached_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </span>
              <button
                onClick={() => runScan(true)}
                style={{ background: 'transparent', border: '1px solid #333', color: '#555', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.5, padding: '3px 10px', cursor: 'pointer' }}
              >
                FORCE REFRESH
              </button>
            </div>
          )}

          {/* Result header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--white)', letterSpacing: 2, lineHeight: 1 }}>
                {analysis.fmo_name || result.fmo_name}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 4 }}>
                {result.domain && <span>{result.domain} · </span>}
                {result.pages?.length || 0} pages crawled
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <SizeBadge size={analysis.size_signal || 'UNKNOWN'} />
              <ConfidenceBadge confidence={analysis.data_confidence || 'MEDIUM'} />
            </div>
          </div>

          {/* Overview */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--orange)', padding: '20px 28px', marginBottom: 2 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>OVERVIEW</div>
            <p style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.7, margin: 0 }}>{analysis.overview}</p>
            {analysis.competitive_intel?.tree_affiliation && (
              <div style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 1 }}>
                TREE AFFILIATION: {analysis.competitive_intel.tree_affiliation}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 2, marginTop: 2, flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <div
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 18px',
                  background: activeTab === tab.key ? (tab.key === 'counter' ? 'var(--orange)' : 'var(--card)') : 'transparent',
                  border: `1px solid ${activeTab === tab.key ? (tab.key === 'counter' ? 'var(--orange)' : 'var(--border-light)') : 'var(--border)'}`,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: 2,
                  cursor: 'pointer',
                  color: activeTab === tab.key ? (tab.key === 'counter' ? 'var(--black)' : 'var(--orange)') : 'var(--muted)',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {/* WHAT THEY OFFER */}
          {activeTab === 'offer' && (
            <Section label="What They Offer Agents">
              <Tags label="Carriers" items={analysis.what_they_offer?.carriers || []} />
              <Row label="Contracts" value={analysis.what_they_offer?.contract_highlights} />
              <Row label="Lead Program" value={analysis.what_they_offer?.lead_program} />
              <Tags label="Technology" items={analysis.what_they_offer?.technology || []} />
              <Row label="Training" value={analysis.what_they_offer?.training} />
              <Row label="Marketing Support" value={analysis.what_they_offer?.marketing_support} />
            </Section>
          )}

          {/* TRIPS */}
          {activeTab === 'trips' && (
            <Section label="Incentive Trips & Awards">
              {analysis.incentive_trips?.current_trip ? (
                <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', borderLeft: '3px solid var(--orange)', padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, marginBottom: 6 }}>CURRENT / UPCOMING TRIP</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--white)', letterSpacing: 2 }}>
                    {analysis.incentive_trips.current_trip}
                  </div>
                </div>
              ) : (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#444', marginBottom: 16 }}>No trip data found in scan.</div>
              )}
              <Row label="Qualification" value={analysis.incentive_trips?.qualification} />
              <Row label="Intel" value={analysis.incentive_trips?.trip_intel} />
              {(analysis.incentive_trips?.past_trips || []).filter(Boolean).length > 0 && (
                <Tags label="Past Destinations" items={analysis.incentive_trips.past_trips} />
              )}
            </Section>
          )}

          {/* THEIR PITCH */}
          {activeTab === 'pitch' && (
            <Section label="How They Recruit Agents">
              {analysis.their_pitch?.headline_claim && (
                <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', borderLeft: '3px solid var(--border-light)', padding: '16px 20px', marginBottom: 20, fontSize: 15, color: 'var(--white)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{analysis.their_pitch.headline_claim}"
                </div>
              )}
              <Row label="Target Agent" value={analysis.their_pitch?.target_agent} />
              <Row label="Differentiators" value={analysis.their_pitch?.differentiators} />
              {(analysis.their_pitch?.key_selling_points || []).filter(Boolean).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, marginBottom: 14 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, paddingTop: 2 }}>Selling Points</div>
                  <div>
                    {analysis.their_pitch.key_selling_points.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--orange)', flexShrink: 0, marginTop: 2 }}>✦</span>
                        <span style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analysis.competitive_intel?.market_position && (
                <Row label="Market Position" value={analysis.competitive_intel.market_position} />
              )}
              {analysis.competitive_intel?.recent_changes && (
                <Row label="Recent Changes" value={analysis.competitive_intel.recent_changes} />
              )}
            </Section>
          )}

          {/* WEAK POINTS */}
          {activeTab === 'weaknesses' && (
            <Section label="Weak Points & Vulnerabilities">
              {analysis.weak_points?.agent_complaints && (
                <div style={{ background: 'rgba(255,23,68,0.04)', border: '1px solid rgba(255,23,68,0.2)', padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--red)', letterSpacing: 2, marginBottom: 8 }}>AGENT COMPLAINTS</div>
                  <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{analysis.weak_points.agent_complaints}</div>
                </div>
              )}
              <Row label="Gaps" value={analysis.weak_points?.gaps} />
              {analysis.weak_points?.red_flags && (
                <div style={{ background: 'rgba(255,23,68,0.04)', border: '1px solid rgba(255,23,68,0.15)', padding: '16px 20px', marginTop: 8 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--red)', letterSpacing: 2, marginBottom: 8 }}>RED FLAGS</div>
                  <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{analysis.weak_points.red_flags}</div>
                </div>
              )}
              {analysis.confidence_note && (
                <div style={{ marginTop: 16, fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', lineHeight: 1.7 }}>
                  DATA NOTE: {analysis.confidence_note}
                </div>
              )}
            </Section>
          )}

          {/* YOUR COUNTER */}
          {activeTab === 'counter' && (
            <div style={{ background: '#1a1512', border: '1px solid var(--orange)', padding: '32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, marginBottom: 24 }}>▶ YOUR COUNTER-PITCH BRIEFING</div>

              {analysis.your_counter?.opening_line && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>OPENING LINE</div>
                  <div style={{ background: 'var(--dark)', border: '1px solid var(--orange)', borderLeft: '3px solid var(--orange)', padding: '16px 20px', fontSize: 15, color: 'var(--white)', lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{analysis.your_counter.opening_line}"
                  </div>
                </div>
              )}

              {(analysis.your_counter?.key_angles || []).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 14 }}>KEY ANGLES</div>
                  {analysis.your_counter.key_angles.map((angle, i) => (
                    <CounterAngle key={i} angle={angle} i={i} />
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 16 }}>
                {analysis.your_counter?.trip_angle && (
                  <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '16px 20px' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 8 }}>TRIP ANGLE</div>
                    <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{analysis.your_counter.trip_angle}</div>
                  </div>
                )}
                {analysis.your_counter?.carrier_angle && (
                  <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '16px 20px' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 8 }}>CARRIER ANGLE</div>
                    <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>{analysis.your_counter.carrier_angle}</div>
                  </div>
                )}
              </div>

              {analysis.your_counter?.close && (
                <div style={{ background: 'var(--orange)', padding: '20px 24px' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(0,0,0,0.5)', letterSpacing: 2, marginBottom: 8 }}>THE CLOSE</div>
                  <div style={{ fontSize: 14, color: 'var(--black)', lineHeight: 1.6, fontWeight: 600 }}>{analysis.your_counter.close}</div>
                </div>
              )}
            </div>
          )}

          {/* SOURCES */}
          {activeTab === 'sources' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24 }}>Evidence Trail</div>

              {/* Domain discovery block */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>WEBSITE DISCOVERY</div>
                {result.domain ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)', padding: '10px 16px' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)' }}>● FOUND</span>
                    <a href={`https://${result.domain}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--white)', letterSpacing: 1, textDecoration: 'none' }}>
                      {result.domain}
                    </a>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)' }}>↗</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', marginLeft: 'auto' }}>
                      {result.pages?.length || 0} pages crawled: {result.pages?.join(', ') || 'none'}
                    </span>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,23,68,0.04)', border: '1px solid rgba(255,23,68,0.15)', padding: '10px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#666', letterSpacing: 1 }}>
                    ○ NO SITE FOUND — Intel is SERP-only. Carriers and details may be less reliable.
                  </div>
                )}
                {/* Discovery debug entry */}
                {(() => {
                  const discoveryEntry = (result.serp_debug || []).find((e: any) => e.key === 'website_discovery')
                  if (!discoveryEntry?.signals_fired?.length) return null
                  return (
                    <div style={{ marginTop: 6, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 0.5, paddingLeft: 4 }}>
                      {discoveryEntry.signals_fired.map((s: string, i: number) => <div key={i}>→ {s}</div>)}
                    </div>
                  )
                })()}
              </div>

              {/* SERP query entries */}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>SERP QUERIES FIRED</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(result.serp_debug || [])
                  .filter((e: any) => e.key !== 'website_discovery')
                  .map((entry: any, ei: number) => (
                  <SerpEntry key={ei} entry={entry} />
                ))}
                {!(result.serp_debug || []).filter((e: any) => e.key !== 'website_discovery').length && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333' }}>
                    No SERP debug data — rescan to generate evidence trail.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rescan */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setResult(null); setFmoName(''); setWebsite('') }}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}
            >
              RUN NEW SCAN
            </button>
            {!result?.cached && (
              <button
                onClick={() => runScan(true)}
                style={{ background: 'transparent', border: '1px solid #333', color: '#444', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}
              >
                FORCE REFRESH
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!scanning && !result && (
        <div style={{ marginTop: 40 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>What Prometheus Extracts</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { n: '01', title: 'Carrier Stack', tip: 'Every carrier they contract. Know exactly what they offer before you counter.' },
              { n: '02', title: 'Incentive Trips', tip: '2025 & 2026 destinations, thresholds, and how to use their trip against them.' },
              { n: '03', title: 'Lead Programs', tip: 'Do they provide leads? At what cost? Any exclusivity claims? We find out.' },
              { n: '04', title: 'Their Recruiting Pitch', tip: 'Word for word what they tell agents about why to join. Know it before the call.' },
              { n: '05', title: 'Weak Points', tip: 'Agent complaints, gaps in their offer, red flags in their contracts.' },
              { n: '06', title: 'Your Counter-Pitch', tip: 'A fully custom script built from their vulnerabilities. Open with it. Close with it.' },
            ].map(c => (
              <div
                key={c.n}
                style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px 24px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--orange)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
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
