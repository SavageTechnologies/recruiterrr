'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
type CheckResult = { pass: boolean | null; points: number; finding: string }
type Analysis = {
  score: number
  verdict: 'COMPLIANT' | 'REVIEW NEEDED' | 'HIGH RISK'
  domain_age_signal: string
  is_shared_lead_vendor: boolean
  checks: {
    prior_express_written_consent: CheckResult
    seller_identification: CheckResult
    contact_method_disclosure: CheckResult
    clear_conspicuous_placement: CheckResult
    privacy_policy_present: CheckResult
    shared_lead_warning: CheckResult
    opt_out_language: CheckResult
  }
  reputation_intel: string
  recommendations: Array<{ priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'; title: string; detail: string }>
  generated_language: { tcpa_disclaimer: string; vendor_demand_letter: string; opt_out_line: string }
  summary: string
}

// ─── Scan stages ─────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'resolve',    label: 'RESOLVING DOMAIN',           sub: 'DNS lookup & domain validation',           duration: 800  },
  { id: 'homepage',  label: 'FETCHING HOMEPAGE',           sub: 'Downloading public page content',          duration: 1400 },
  { id: 'privacy',   label: 'CRAWLING PRIVACY POLICY',     sub: 'Scanning legal & policy pages',            duration: 1200 },
  { id: 'leadform',  label: 'SCANNING LEAD CAPTURE PAGES', sub: 'Locating opt-in forms & consent language', duration: 1400 },
  { id: 'serp',      label: 'RUNNING SERP INTELLIGENCE',   sub: 'Cross-referencing complaint databases',    duration: 2000 },
  { id: 'analysis',  label: 'TCPA DEEP ANALYSIS',          sub: 'AI compliance engine processing',          duration: 3000 },
  { id: 'report',    label: 'GENERATING REPORT',           sub: 'Compiling findings & recommendations',     duration: 800  },
]

// ─── Radar SVG ───────────────────────────────────────────────────────────────
function RadarDisplay({ scanning, score, verdict }: { scanning: boolean; score?: number; verdict?: string }) {
  const [tick, setTick] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    if (!scanning) return
    const id = setInterval(() => setTick(t => t + 1), 50)
    return () => clearInterval(id)
  }, [scanning])

  useEffect(() => {
    if (score === undefined) return
    let current = 0
    const target = score
    const id = setInterval(() => {
      current += Math.ceil((target - current) / 8) || 1
      if (current >= target) { setDisplayScore(target); clearInterval(id) }
      else setDisplayScore(current)
    }, 30)
    return () => clearInterval(id)
  }, [score])

  const angle = (tick * 3) % 360
  const rad = (angle * Math.PI) / 180
  const cx = 140; const cy = 140; const r = 110

  const scoreColor = score === undefined ? '#00e5ff'
    : score >= 75 ? '#00e676' : score >= 45 ? '#ffd600' : '#ff1744'

  const verdictLabel = verdict || ''

  return (
    <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto' }}>
      <svg width={280} height={280} style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <radialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid rings */}
        {[110, 80, 50, 25].map(ri => (
          <circle key={ri} cx={cx} cy={cy} r={ri} fill="none" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity={scanning ? 0.15 : 0.07} />
        ))}
        {/* Cross hairs */}
        {[0, 45, 90, 135].map(a => {
          const ra = (a * Math.PI) / 180
          return <line key={a} x1={cx - Math.cos(ra) * r} y1={cy - Math.sin(ra) * r} x2={cx + Math.cos(ra) * r} y2={cy + Math.sin(ra) * r} stroke="#00e5ff" strokeWidth="0.5" strokeOpacity={scanning ? 0.12 : 0.05} />
        })}

        {/* Sweep arm — only when scanning */}
        {scanning && (
          <>
            <line
              x1={cx} y1={cy}
              x2={cx + Math.cos(rad) * r}
              y2={cy + Math.sin(rad) * r}
              stroke="#00e5ff" strokeWidth="1.5"
              style={{ filter: 'url(#glow)' }}
            />
            <path
              d={`M ${cx} ${cy} L ${cx + Math.cos(rad - 0.5) * r} ${cy + Math.sin(rad - 0.5) * r} A ${r} ${r} 0 0 1 ${cx + Math.cos(rad) * r} ${cy + Math.sin(rad) * r} Z`}
              fill="url(#sweepGrad)"
            />
            {/* Blip dots */}
            {[0.15, 0.4, 0.7, 0.85].map((pct, i) => (
              <circle
                key={i}
                cx={cx + Math.cos(rad - 1.2 + i * 0.3) * r * pct}
                cy={cy + Math.sin(rad - 1.2 + i * 0.3) * r * pct}
                r="2"
                fill="#00e5ff"
                opacity={0.6 - i * 0.1}
              />
            ))}
          </>
        )}

        {/* Score ring when done */}
        {!scanning && score !== undefined && (
          <circle
            cx={cx} cy={cy} r={80}
            fill="none"
            stroke={scoreColor}
            strokeWidth="3"
            strokeDasharray={`${(displayScore / 100) * 502} 502`}
            strokeLinecap="round"
            strokeDashoffset="125"
            style={{ filter: `drop-shadow(0 0 8px ${scoreColor})`, transition: 'stroke 0.5s' }}
          />
        )}

        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00e5ff" strokeWidth="1" strokeOpacity={scanning ? 0.3 : 0.1} />
      </svg>

      {/* Center content */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
        {scanning ? (
          <>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5ff', letterSpacing: 3, marginBottom: 4, animation: 'pulse 1s ease-in-out infinite' }}>SCANNING</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#00e5ff', letterSpacing: 2, opacity: 0.5 }}>PROMETHEUS</div>
          </>
        ) : score !== undefined ? (
          <>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: scoreColor, lineHeight: 1, filter: `drop-shadow(0 0 12px ${scoreColor})` }}>{displayScore}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: scoreColor, letterSpacing: 2 }}>CONFIDENCE</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: scoreColor, letterSpacing: 2, marginTop: 4 }}>{verdictLabel}</div>
          </>
        ) : (
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#2a2a2a', letterSpacing: 3 }}>STANDBY</div>
        )}
      </div>
    </div>
  )
}

// ─── Terminal Log ─────────────────────────────────────────────────────────────
function TerminalLog({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [lines])
  return (
    <div ref={ref} style={{
      background: '#0d0d0b', border: '1px solid #1a1a16',
      padding: '16px', height: 180, overflowY: 'auto',
      fontFamily: "'DM Mono', monospace", fontSize: 11,
      letterSpacing: 0.5, lineHeight: 2,
    }}>
      <div style={{ color: '#2a6b2a', marginBottom: 4 }}>prometheus@tcpa-intel:~$ ./scan</div>
      {lines.map((line, i) => (
        <div key={i} style={{
          color: line.startsWith('[OK]') ? '#00e676'
            : line.startsWith('[WARN]') ? '#ffd600'
              : line.startsWith('[ALERT]') ? '#ff1744'
                : line.startsWith('[FOUND]') ? '#00e5ff'
                  : '#4a4a40',
          animation: 'fadeLineIn 0.2s ease both',
        }}>
          {line}
        </div>
      ))}
      <div style={{ display: 'inline-block', width: 8, height: 14, background: '#00e5ff', animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
    </div>
  )
}

// ─── Check Row ────────────────────────────────────────────────────────────────
function CheckRow({ label, check, maxPoints, critical }: { label: string; check: CheckResult; maxPoints: number; critical?: boolean }) {
  const [open, setOpen] = useState(false)
  const pass = check.pass === true
  const unclear = check.pass === null
  const isNegative = maxPoints < 0

  const color = pass ? 'var(--green)' : unclear ? '#555' : isNegative ? 'var(--red)' : critical ? 'var(--red)' : 'var(--yellow)'
  const icon = pass ? '✓' : unclear ? '?' : '✗'

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: pass ? 'rgba(0,230,118,0.03)' : unclear ? 'rgba(255,255,255,0.02)' : critical ? 'rgba(255,23,68,0.05)' : 'rgba(255,214,0,0.03)',
        border: `1px solid ${pass ? 'rgba(0,230,118,0.15)' : unclear ? '#1e1e1a' : critical ? 'rgba(255,23,68,0.2)' : 'rgba(255,214,0,0.15)'}`,
        padding: '14px 18px', marginBottom: 2, cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 600, color, minWidth: 16 }}>{icon}</div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--white)' }}>{label}</div>
        {critical && !pass && !unclear && (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px', background: 'rgba(255,23,68,0.1)', border: '1px solid var(--red)', color: 'var(--red)', letterSpacing: 2 }}>CRITICAL</span>
        )}
        {isNegative && !pass && !unclear && (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px', background: 'rgba(255,23,68,0.1)', border: '1px solid var(--red)', color: 'var(--red)', letterSpacing: 2 }}>PENALTY</span>
        )}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color, minWidth: 40, textAlign: 'right' }}>
          {pass ? `+${maxPoints > 0 ? maxPoints : 0}` : isNegative && !pass && !unclear ? `${maxPoints}` : '+0'} pts
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', marginLeft: 4 }}>{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div style={{ marginTop: 10, paddingLeft: 30, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', lineHeight: 1.7, borderLeft: `2px solid ${color}`, marginLeft: 8 }}>
          {check.finding}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PrometheusPage() {
  const [domain, setDomain] = useState('')
  const [scanning, setScanning] = useState(false)
  const [stageIndex, setStageIndex] = useState(-1)
  const [logLines, setLogLines] = useState<string[]>([])
  const [result, setResult] = useState<{ domain: string; pages: string[]; analysis: Analysis } | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'checks' | 'intel' | 'language'>('checks')
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null)

  function addLog(line: string) {
    setLogLines(prev => [...prev.slice(-40), line])
  }

  function cleanDomainDisplay(d: string) {
    return d.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }

  async function runScan() {
    if (!domain.trim() || scanning) return
    const clean = cleanDomainDisplay(domain)

    setScanning(true)
    setResult(null)
    setError('')
    setLogLines([])
    setStageIndex(0)

    // Simulate stage progression with log lines
    const stageLogs: Record<string, string[]> = {
      resolve: [
        `[OK] Resolving ${clean}...`,
        `[OK] DNS lookup complete`,
        `[FOUND] Domain is reachable`,
      ],
      homepage: [
        `[OK] Connecting to https://${clean}`,
        `[FOUND] Homepage fetched — parsing content`,
        `[OK] Stripping scripts & styles`,
        `[OK] Extracting visible text`,
      ],
      privacy: [
        `[OK] Probing /privacy-policy`,
        `[OK] Probing /privacy`,
        `[OK] Probing /legal`,
        `[FOUND] Scanning policy document for TCPA language`,
      ],
      leadform: [
        `[OK] Probing /contact`,
        `[OK] Probing /get-quote`,
        `[OK] Probing /free-quote`,
        `[FOUND] Scanning opt-in forms for consent language`,
        `[OK] Checking for shared lead indicators`,
      ],
      serp: [
        `[OK] Querying complaint databases`,
        `[OK] Searching "${clean}" TCPA lawsuit`,
        `[OK] Searching "${clean}" BBB complaint`,
        `[OK] Cross-referencing FCC enforcement data`,
        `[FOUND] SERP intelligence compiled`,
      ],
      analysis: [
        `[OK] Sending data to TCPA analysis engine`,
        `[OK] Checking prior express written consent...`,
        `[OK] Checking seller identification...`,
        `[OK] Checking contact method disclosure...`,
        `[OK] Checking disclaimer placement...`,
        `[OK] Checking privacy policy...`,
        `[OK] Scanning for shared lead patterns...`,
        `[OK] Checking opt-out language...`,
        `[OK] Running reputation analysis...`,
        `[OK] Generating recommendations...`,
        `[OK] Drafting compliant language...`,
      ],
      report: [
        `[OK] Compiling compliance report`,
        `[OK] Calculating confidence score`,
        `[OK] Report ready`,
      ],
    }

    let si = 0
    let li = 0

    function tick() {
      const stage = STAGES[si]
      if (!stage) return

      setStageIndex(si)
      if (li < stageLogs[stage.id].length) {
        addLog(stageLogs[stage.id][li])
        li++
        stageTimerRef.current = setTimeout(tick, 220)
      } else {
        li = 0
        si++
        if (si < STAGES.length) {
          stageTimerRef.current = setTimeout(tick, 300)
        }
      }
    }
    tick()

    try {
      const res = await fetch('/api/prometheus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: clean }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (stageTimerRef.current) clearTimeout(stageTimerRef.current)
      setStageIndex(STAGES.length - 1)

      const verdict = data.analysis.verdict
      const score = data.analysis.score
      addLog(`[OK] Scan complete`)
      addLog(score >= 75 ? `[OK] VERDICT: ${verdict} — Score: ${score}/100` : score >= 45 ? `[WARN] VERDICT: ${verdict} — Score: ${score}/100` : `[ALERT] VERDICT: ${verdict} — Score: ${score}/100`)
      if (data.analysis.is_shared_lead_vendor) addLog(`[ALERT] SHARED LEAD VENDOR DETECTED — HIGH RISK`)

      setResult(data)
    } catch (err: any) {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current)
      addLog(`[ALERT] Scan failed: ${err.message}`)
      setError(err.message || 'Scan failed. Please try again.')
    }

    setScanning(false)
    setStageIndex(-1)
  }

  const analysis = result?.analysis
  const scoreColor = !analysis ? '#00e5ff'
    : analysis.score >= 75 ? 'var(--green)'
      : analysis.score >= 45 ? 'var(--yellow)'
        : 'var(--red)'

  return (
    <div style={{ padding: '60px 40px', maxWidth: 1100 }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeLineIn { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: none; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes shimmer { 0% { left: -60%; } 100% { left: 120%; } }
        .scan-btn:hover:not(:disabled) { background: #00b8d4 !important; }
        .tab-btn:hover { color: #00e5ff !important; border-color: #00e5ff !important; }
        select option { background: #1a1814; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#00e5ff', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 1, background: '#00e5ff', display: 'inline-block' }} />
          TCPA Intelligence
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(52px, 7vw, 80px)', letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>
          PROMETHEUS<span style={{ color: '#00e5ff' }}>.</span>
        </h1>
        <p style={{ marginTop: 14, fontSize: 15, color: 'var(--muted)', maxWidth: 520, lineHeight: 1.6 }}>
          Enter any lead vendor domain or your own website. We scan, analyze, and score its TCPA compliance so you can dial with confidence.
        </p>
      </div>

      {/* Input bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 32,
        border: `1px solid ${scanning ? '#00e5ff' : 'var(--border-light)'}`,
        background: 'var(--card)',
        boxShadow: scanning ? '0 0 0 1px #00e5ff, 0 0 32px rgba(0,229,255,0.08)' : 'none',
        transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
      }}>
        {scanning && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
        )}
        <div style={{ padding: '18px 20px', color: '#00e5ff', fontFamily: "'DM Mono', monospace", fontSize: 14, opacity: 0.5 }}>⬡</div>
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runScan()}
          placeholder="leadvendor.com or yourdomain.com"
          disabled={scanning}
          style={{
            flex: 1, padding: '18px 8px 18px 0',
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--white)', fontFamily: "'DM Mono', monospace",
            fontSize: 15, letterSpacing: 1,
          }}
        />
        <button
          onClick={runScan}
          disabled={scanning || !domain.trim()}
          className="scan-btn"
          style={{
            padding: '18px 40px', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer',
            background: scanning ? '#1a3a3a' : '#00e5ff',
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3,
            color: scanning ? '#00e5ff' : '#0d0d0b',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
        >
          {scanning ? 'SCANNING...' : 'SCAN DOMAIN'}
        </button>
      </div>

      {/* Scan UI */}
      {(scanning || result || logLines.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 2, marginBottom: 48, animation: 'fadeUp 0.4s ease both' }}>
          {/* Left — Radar + Stages */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px 24px' }}>
            <RadarDisplay
              scanning={scanning}
              score={result?.analysis.score}
              verdict={result?.analysis.verdict}
            />
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STAGES.map((stage, i) => {
                const done = !scanning && result
                const active = scanning && stageIndex === i
                const complete = scanning ? stageIndex > i : !!result
                return (
                  <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: complete ? '#00e5ff' : active ? '#00e5ff' : '#2a2a26',
                      boxShadow: active ? '0 0 6px #00e5ff' : 'none',
                      animation: active ? 'pulse 0.8s ease-in-out infinite' : 'none',
                      flexShrink: 0,
                    }} />
                    <div style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 9,
                      letterSpacing: 1.5, textTransform: 'uppercase',
                      color: complete ? '#00e5ff' : active ? '#00e5ff' : '#2a2a26',
                      transition: 'color 0.3s',
                    }}>
                      {stage.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right — Terminal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: scanning ? '#00e5ff' : result ? '#00e676' : '#333', display: 'inline-block', boxShadow: scanning ? '0 0 6px #00e5ff' : 'none', animation: scanning ? 'pulse 1s ease-in-out infinite' : 'none' }} />
              PROMETHEUS SCAN LOG — {result?.domain || domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || '...'}
            </div>
            <TerminalLog lines={logLines} />

            {/* Scanning status cards */}
            {scanning && stageIndex >= 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid #00e5ff22', padding: '20px 24px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5ff', letterSpacing: 2, marginBottom: 6 }}>{STAGES[stageIndex]?.label}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{STAGES[stageIndex]?.sub}</div>
              </div>
            )}

            {/* Quick verdict bar when done */}
            {result && !scanning && (
              <div style={{
                background: 'var(--card)', border: `1px solid ${scoreColor}44`,
                padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 24,
                animation: 'fadeUp 0.5s ease both',
              }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 4 }}>CONFIDENCE SCORE</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: scoreColor, lineHeight: 1 }}>{analysis?.score}</div>
                </div>
                <div style={{ width: 1, height: 48, background: 'var(--border)' }} />
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 4 }}>VERDICT</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: scoreColor, letterSpacing: 2 }}>{analysis?.verdict}</div>
                </div>
                {analysis?.is_shared_lead_vendor && (
                  <>
                    <div style={{ width: 1, height: 48, background: 'var(--border)' }} />
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '6px 14px', background: 'rgba(255,23,68,0.1)', border: '1px solid var(--red)', color: 'var(--red)', letterSpacing: 1 }}>
                      ⚠ SHARED LEAD VENDOR
                    </div>
                  </>
                )}
                <div style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1 }}>
                  {result.pages.length} PAGES SCANNED
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '16px 20px', border: '1px solid var(--red)', background: 'rgba(255,23,68,0.05)', color: 'var(--red)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1, marginBottom: 32 }}>
          ✗ {error}
        </div>
      )}

      {/* Full Report */}
      {result && analysis && !scanning && (
        <div style={{ animation: 'fadeUp 0.5s 0.2s ease both' }}>

          {/* Summary */}
          <div style={{ background: 'var(--card)', border: `1px solid ${scoreColor}33`, padding: '28px', marginBottom: 2 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5ff', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Executive Summary</div>
            <p style={{ fontSize: 15, color: 'var(--white)', lineHeight: 1.7, maxWidth: 800 }}>{analysis.summary}</p>
            {analysis.domain_age_signal && (
              <div style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
                DOMAIN SIGNAL: {analysis.domain_age_signal}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
            {(['checks', 'intel', 'language'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="tab-btn"
                style={{
                  padding: '12px 24px', border: `1px solid ${activeTab === tab ? '#00e5ff' : 'var(--border)'}`,
                  background: activeTab === tab ? 'rgba(0,229,255,0.06)' : 'var(--card)',
                  color: activeTab === tab ? '#00e5ff' : 'var(--muted)',
                  fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2,
                  textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {tab === 'checks' ? '7 CHECKS' : tab === 'intel' ? 'INTEL + RECS' : 'GENERATED LANGUAGE'}
              </button>
            ))}
          </div>

          {/* CHECKS TAB */}
          {activeTab === 'checks' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 20 }}>
                CLICK ANY ROW FOR DETAILED FINDINGS
              </div>
              <CheckRow label="Prior Express Written Consent (PEWC)" check={analysis.checks.prior_express_written_consent} maxPoints={30} critical />
              <CheckRow label="Seller Identification" check={analysis.checks.seller_identification} maxPoints={15} critical />
              <CheckRow label="Contact Method Disclosure" check={analysis.checks.contact_method_disclosure} maxPoints={15} />
              <CheckRow label="Clear & Conspicuous Placement" check={analysis.checks.clear_conspicuous_placement} maxPoints={15} />
              <CheckRow label="Privacy Policy Present" check={analysis.checks.privacy_policy_present} maxPoints={10} />
              <CheckRow label="Shared Lead Vendor Warning" check={analysis.checks.shared_lead_warning} maxPoints={-15} />
              <CheckRow label="Opt-Out Language" check={analysis.checks.opt_out_language} maxPoints={5} />

              <div style={{ marginTop: 20, padding: '16px 20px', background: '#0d0d0b', border: '1px solid #1a1a16', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>TOTAL SCORE</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: scoreColor }}>{analysis.score}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)' }}>/ 100</div>
                <div style={{ marginLeft: 'auto', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: scoreColor, letterSpacing: 3 }}>{analysis.verdict}</div>
              </div>

              <div style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', lineHeight: 1.8 }}>
                This score is an informational due diligence tool, not a legal opinion. InsuraSafe, LLC makes no warranty regarding TCPA compliance. Consult a qualified attorney for legal advice.
              </div>
            </div>
          )}

          {/* INTEL + RECS TAB */}
          {activeTab === 'intel' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px' }}>
              {/* Reputation intel */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5ff', letterSpacing: 2, marginBottom: 12 }}>REPUTATION INTELLIGENCE</div>
                <div style={{ padding: '16px 20px', background: '#0d0d0b', borderLeft: '2px solid #00e5ff', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                  {analysis.reputation_intel}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5ff', letterSpacing: 2, marginBottom: 12 }}>RECOMMENDATIONS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} style={{
                      padding: '16px 20px',
                      background: rec.priority === 'CRITICAL' ? 'rgba(255,23,68,0.04)' : rec.priority === 'HIGH' ? 'rgba(255,214,0,0.03)' : 'rgba(0,229,255,0.02)',
                      border: `1px solid ${rec.priority === 'CRITICAL' ? 'rgba(255,23,68,0.2)' : rec.priority === 'HIGH' ? 'rgba(255,214,0,0.15)' : 'rgba(0,229,255,0.1)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px', letterSpacing: 2,
                          background: rec.priority === 'CRITICAL' ? 'rgba(255,23,68,0.1)' : rec.priority === 'HIGH' ? 'rgba(255,214,0,0.1)' : 'rgba(0,229,255,0.08)',
                          border: `1px solid ${rec.priority === 'CRITICAL' ? 'var(--red)' : rec.priority === 'HIGH' ? 'var(--yellow)' : '#00e5ff'}`,
                          color: rec.priority === 'CRITICAL' ? 'var(--red)' : rec.priority === 'HIGH' ? 'var(--yellow)' : '#00e5ff',
                        }}>{rec.priority}</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>{rec.title}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{rec.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LANGUAGE TAB */}
          {activeTab === 'language' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 20, lineHeight: 1.8 }}>
                AI-GENERATED READY-TO-USE LANGUAGE — Replace [COMPANY NAME] with your actual company name before use. This is not legal advice.
              </div>

              {[
                { key: 'tcpa_disclaimer', label: 'COMPLIANT TCPA DISCLAIMER', sub: 'Drop this on your lead form or send to your vendor' },
                { key: 'vendor_demand_letter', label: 'VENDOR DEMAND PARAGRAPH', sub: 'Send this to the vendor to demand specific fixes' },
                { key: 'opt_out_line', label: 'OPT-OUT DISCLOSURE LINE', sub: 'Add this to any outbound communication' },
              ].map(item => (
                <div key={item.key} style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00e5ff', letterSpacing: 2, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', marginBottom: 10 }}>{item.sub}</div>
                  <div style={{
                    padding: '16px 20px', background: '#0d0d0b',
                    border: '1px solid #1a1a16', borderLeft: '2px solid #00e5ff',
                    fontSize: 13, color: '#aaa', lineHeight: 1.8,
                    fontFamily: "'DM Mono', monospace",
                    position: 'relative',
                  }}>
                    {analysis.generated_language[item.key as keyof typeof analysis.generated_language]}
                    <button
                      onClick={() => navigator.clipboard.writeText(analysis.generated_language[item.key as keyof typeof analysis.generated_language])}
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        padding: '4px 12px', background: 'transparent',
                        border: '1px solid #2a2a26', color: '#00e5ff',
                        fontFamily: "'DM Mono', monospace", fontSize: 9,
                        letterSpacing: 1, cursor: 'pointer',
                      }}
                    >
                      COPY
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ marginTop: 16, padding: '16px 20px', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', lineHeight: 1.8, letterSpacing: 0.5 }}>
            DISCLAIMER: PROMETHEUS is an informational due diligence tool powered by AI analysis of publicly available website content. Scores and findings do not constitute legal advice and do not guarantee TCPA compliance or protection from liability. InsuraSafe, LLC expressly disclaims all warranties and shall not be liable for any claims, damages, or losses arising from the use of this tool or reliance on its output. Always consult a qualified telecommunications law attorney before making compliance decisions.
          </div>
        </div>
      )}

      {/* Empty state */}
      {!scanning && !result && logLines.length === 0 && (
        <div style={{ marginTop: 48 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
            What PROMETHEUS checks
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            {[
              { n: '01', title: 'PEWC Language', body: 'Prior express written consent — the single most critical TCPA requirement.' },
              { n: '02', title: 'Seller ID', body: 'The consenting party must know exactly who will be calling them.' },
              { n: '03', title: 'Contact Disclosure', body: 'Calls, texts, autodialers — how they'll be reached must be stated.' },
              { n: '04', title: 'Shared Lead Scan', body: 'Multi-buyer forms are high-risk under the 2024 FCC ruling.' },
              { n: '05', title: 'Privacy Policy', body: 'A linked, accessible privacy policy covering telephone contact.' },
              { n: '06', title: 'SERP Intelligence', body: 'We query complaint databases and check for lawsuit history.' },
              { n: '07', title: 'Opt-Out Language', body: 'Clear unsubscribe or stop instructions required by law.' },
              { n: '08', title: 'Ready Language', body: 'Get compliant copy you can use immediately — no attorney needed.' },
            ].map(c => (
              <div key={c.n} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '24px 20px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#00e5ff', letterSpacing: 2, marginBottom: 10 }}>{c.n}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)', marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
