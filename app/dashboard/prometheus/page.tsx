'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
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

const LOADING_STEPS = [
  'Resolving domain',
  'Fetching homepage',
  'Crawling privacy policy',
  'Scanning lead capture pages',
  'Running SERP intelligence',
  'TCPA deep analysis',
  'Generating report',
]

const STAGE_LOGS: Record<number, string[]> = {
  0: ['[OK] DNS lookup complete', '[OK] Domain is reachable'],
  1: ['[OK] Connecting to homepage', '[FOUND] Page content fetched', '[OK] Extracting visible text'],
  2: ['[OK] Probing /privacy-policy', '[OK] Probing /privacy', '[FOUND] Policy document located'],
  3: ['[OK] Probing /contact', '[OK] Probing /get-quote', '[FOUND] Scanning opt-in forms', '[OK] Checking for shared lead indicators'],
  4: ['[OK] Querying complaint databases', '[OK] Searching TCPA lawsuit records', '[OK] Cross-referencing BBB data', '[FOUND] SERP intelligence compiled'],
  5: ['[OK] Sending to TCPA analysis engine', '[OK] Checking PEWC language...', '[OK] Checking seller identification...', '[OK] Checking contact method...', '[OK] Checking disclaimer placement...', '[OK] Scanning for shared lead patterns...', '[OK] Running reputation analysis...', '[OK] Generating recommendations...'],
  6: ['[OK] Compiling compliance report', '[OK] Calculating confidence score', '[OK] Report ready'],
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 75 ? 'var(--green)' : score >= 45 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div style={{ width: 64, height: 64, borderRadius: '50%', border: `2px solid ${color}`, background: `${color}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color, letterSpacing: 1, textTransform: 'uppercase' }}>SCORE</div>
    </div>
  )
}

function VerdictBadge({ verdict }: { verdict: 'COMPLIANT' | 'REVIEW NEEDED' | 'HIGH RISK' }) {
  const map = {
    'COMPLIANT': { color: 'var(--green)', label: '✓ COMPLIANT' },
    'REVIEW NEEDED': { color: 'var(--yellow)', label: '! REVIEW NEEDED' },
    'HIGH RISK': { color: 'var(--red)', label: '✗ HIGH RISK' },
  }
  const { color, label } = map[verdict]
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px', border: `1px solid ${color}`, color, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
      {label}
    </div>
  )
}

function TerminalLog({ lines }: { lines: string[] }) {
  return (
    <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '16px', height: 190, overflowY: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5, lineHeight: 2 }}>
      <div style={{ color: 'var(--muted)', marginBottom: 4, fontSize: 10 }}>prometheus@tcpa-intel:~$ ./scan</div>
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

function CheckRow({ label, check, maxPoints, critical }: { label: string; check: CheckResult; maxPoints: number; critical?: boolean }) {
  const [open, setOpen] = useState(false)
  const pass = check.pass === true
  const unclear = check.pass === null
  const isNegative = maxPoints < 0
  const color = pass ? 'var(--green)' : unclear ? '#555' : isNegative ? 'var(--red)' : critical ? 'var(--red)' : 'var(--yellow)'
  const icon = pass ? '●' : unclear ? '○' : '◐'

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 2, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-light)'; (e.currentTarget as HTMLDivElement).style.background = '#181818' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--card)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color, minWidth: 12 }}>{icon}</div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--white)' }}>{label}</div>
        {critical && !pass && !unclear && (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px', border: '1px solid var(--red)', color: 'var(--red)', letterSpacing: 1 }}>CRITICAL</span>
        )}
        {isNegative && !pass && !unclear && (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px', border: '1px solid var(--red)', color: 'var(--red)', letterSpacing: 1 }}>PENALTY</span>
        )}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color, minWidth: 40, textAlign: 'right' }}>
          {pass ? `+${maxPoints > 0 ? maxPoints : 0}` : isNegative && !pass && !unclear ? `${maxPoints}` : '+0'} pts
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div style={{ marginTop: 10, paddingLeft: 24, fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, borderLeft: `2px solid ${color}`, marginLeft: 12 }}>
          {check.finding}
        </div>
      )}
    </div>
  )
}

function PrometheusPageInner() {
  const searchParams = useSearchParams()
  const [domain, setDomain] = useState('')
  const [scanning, setScanning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [logLines, setLogLines] = useState<string[]>([])
  const [result, setResult] = useState<{ domain: string; pages: string[]; analysis: Analysis } | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'checks' | 'intel' | 'language'>('checks')
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
        setDomain(data.scan.domain)
        setResult({ domain: data.scan.domain, pages: data.scan.pages_scanned || [], analysis: data.scan.analysis_json })
      }
    } catch {}
  }

  function addLog(line: string) {
    setLogLines(prev => [...prev.slice(-40), line])
  }

  function cleanDomain(d: string) {
    return d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }

  async function runScan() {
    if (!domain.trim() || scanning) return
    const clean = cleanDomain(domain)
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
        timerRef.current = setTimeout(tick, 250)
      } else {
        li = 0; si++
        if (si < LOADING_STEPS.length) timerRef.current = setTimeout(tick, 300)
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
      if (timerRef.current) clearTimeout(timerRef.current)
      setCurrentStep(LOADING_STEPS.length - 1)
      const { score, verdict } = data.analysis
      addLog(`[OK] Scan complete — ${clean}`)
      addLog(score >= 75 ? `[OK] VERDICT: ${verdict} — ${score}/100` : score >= 45 ? `[WARN] VERDICT: ${verdict} — ${score}/100` : `[ALERT] VERDICT: ${verdict} — ${score}/100`)
      if (data.analysis.is_shared_lead_vendor) addLog(`[ALERT] SHARED LEAD VENDOR DETECTED`)
      setResult(data)
    } catch (err: any) {
      if (timerRef.current) clearTimeout(timerRef.current)
      addLog(`[ALERT] Scan failed: ${err.message}`)
      setError(err.message || 'Scan failed. Please try again.')
    }
    setScanning(false)
    setCurrentStep(-1)
  }

  const analysis = result?.analysis
  const scoreColor = !analysis ? 'var(--orange)' : analysis.score >= 75 ? 'var(--green)' : analysis.score >= 45 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div style={{ padding: '60px 40px', maxWidth: 1100 }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadSlide { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        select option { background: #1a1814; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>TCPA Intelligence</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>
          PROMETHEUS<span style={{ color: 'var(--orange)' }}>.</span>
        </h1>
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, border: `1px solid ${scanning ? 'var(--orange)' : 'var(--border-light)'}`, background: 'var(--card)', transition: 'border-color 0.2s', boxShadow: scanning ? '0 0 0 1px var(--orange)' : 'none' }}>
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runScan()}
          placeholder="leadvendor.com or yourdomain.com"
          disabled={scanning}
          style={{ flex: 1, padding: '18px 24px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }}
        />
        <button
          onClick={runScan}
          disabled={scanning || !domain.trim()}
          style={{ padding: '18px 32px', background: scanning ? '#333' : 'var(--orange)', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: 'var(--black)', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
        >
          {scanning ? 'SCANNING...' : 'SCAN DOMAIN'}
        </button>
      </div>

      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, marginBottom: 24 }}>
        ENTER ANY LEAD VENDOR DOMAIN OR YOUR OWN WEBSITE · 7 TCPA SIGNALS · AI-POWERED ANALYSIS
      </div>

      {/* Loading */}
      {scanning && currentStep >= 0 && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--orange)', animation: 'loadSlide 1s ease-in-out infinite' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

          {/* Results header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
              {result.domain} — {result.pages.length} pages scanned
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {analysis.is_shared_lead_vendor && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--red)', border: '1px solid var(--red)', padding: '3px 10px', letterSpacing: 1 }}>⚠ SHARED LEAD VENDOR</div>
              )}
              <ScoreCircle score={analysis.score} />
              <VerdictBadge verdict={analysis.verdict} />
            </div>
          </div>

          {/* Summary stats row */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
            <div style={{ flex: 1, padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: scoreColor }}>
              ⬡ CONFIDENCE: {analysis.score}/100
            </div>
            <div style={{ flex: 1, padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)' }}>
              ↗ PAGES: {result.pages.join(' · ')}
            </div>
            <div style={{ flex: 1, padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: analysis.recommendations.filter(r => r.priority === 'CRITICAL').length > 0 ? 'var(--red)' : 'var(--muted)' }}>
              ⚑ {analysis.recommendations.filter(r => r.priority === 'CRITICAL').length} CRITICAL · {analysis.recommendations.filter(r => r.priority === 'HIGH').length} HIGH · {analysis.recommendations.filter(r => r.priority === 'MEDIUM').length} MEDIUM
            </div>
          </div>

          {/* Summary card */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '24px 28px', marginBottom: 2 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Executive Summary</div>
            <p style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.7 }}>{analysis.summary}</p>
            {analysis.domain_age_signal && (
              <div style={{ marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
                DOMAIN SIGNAL: {analysis.domain_age_signal}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 2, marginTop: 2 }}>
            {(['checks', 'intel', 'language'] as const).map(tab => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ padding: '10px 20px', background: activeTab === tab ? 'var(--card)' : 'transparent', border: `1px solid ${activeTab === tab ? 'var(--border-light)' : 'var(--border)'}`, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', color: activeTab === tab ? 'var(--orange)' : 'var(--muted)', transition: 'all 0.15s' }}
              >
                {tab === 'checks' ? '7 CHECKS' : tab === 'intel' ? 'INTEL + RECS' : 'GENERATED LANGUAGE'}
              </div>
            ))}
          </div>

          {/* CHECKS TAB */}
          {activeTab === 'checks' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>CLICK ANY ROW FOR DETAILED FINDINGS</div>
              <CheckRow label="Prior Express Written Consent (PEWC)" check={analysis.checks.prior_express_written_consent} maxPoints={30} critical />
              <CheckRow label="Seller Identification" check={analysis.checks.seller_identification} maxPoints={15} critical />
              <CheckRow label="Contact Method Disclosure" check={analysis.checks.contact_method_disclosure} maxPoints={15} />
              <CheckRow label="Clear & Conspicuous Placement" check={analysis.checks.clear_conspicuous_placement} maxPoints={15} />
              <CheckRow label="Privacy Policy Present" check={analysis.checks.privacy_policy_present} maxPoints={10} />
              <CheckRow label="Shared Lead Vendor Warning" check={analysis.checks.shared_lead_warning} maxPoints={-15} />
              <CheckRow label="Opt-Out Language" check={analysis.checks.opt_out_language} maxPoints={5} />
              <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--dark)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>TOTAL SCORE</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: scoreColor }}>{analysis.score}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)' }}>/ 100</div>
                <div style={{ marginLeft: 'auto', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: scoreColor, letterSpacing: 2 }}>{analysis.verdict}</div>
              </div>
              <div style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', lineHeight: 1.8 }}>
                This score is an informational due diligence tool, not a legal opinion. InsuraSafe, LLC makes no warranty regarding TCPA compliance. Consult a qualified attorney for legal advice.
              </div>
            </div>
          )}

          {/* INTEL TAB */}
          {activeTab === 'intel' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px' }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Reputation Intelligence</div>
                <div style={{ padding: '16px 20px', background: 'var(--dark)', borderLeft: '2px solid var(--orange)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                  {analysis.reputation_intel}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Recommendations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {analysis.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '16px 20px', animation: `slideIn 0.3s ease ${i * 0.05}s both`, transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px', letterSpacing: 1, border: `1px solid ${rec.priority === 'CRITICAL' ? 'var(--red)' : rec.priority === 'HIGH' ? 'var(--yellow)' : 'var(--border-light)'}`, color: rec.priority === 'CRITICAL' ? 'var(--red)' : rec.priority === 'HIGH' ? 'var(--yellow)' : 'var(--muted)' }}>{rec.priority}</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>{rec.title}</div>
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
                AI-GENERATED READY-TO-USE LANGUAGE — Replace [COMPANY NAME] with your actual company name. This is not legal advice.
              </div>
              {[
                { key: 'tcpa_disclaimer', label: 'COMPLIANT TCPA DISCLAIMER', sub: 'Drop this on your lead form or send to your vendor' },
                { key: 'vendor_demand_letter', label: 'VENDOR DEMAND PARAGRAPH', sub: 'Send this to the vendor to demand specific fixes' },
                { key: 'opt_out_line', label: 'OPT-OUT DISCLOSURE LINE', sub: 'Add this to any outbound communication' },
              ].map(item => (
                <div key={item.key} style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', marginBottom: 10 }}>{item.sub}</div>
                  <div style={{ position: 'relative', padding: '16px 20px', background: 'var(--dark)', border: '1px solid var(--border)', borderLeft: '2px solid var(--orange)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, fontFamily: "'DM Mono', monospace" }}>
                    {analysis.generated_language[item.key as keyof typeof analysis.generated_language]}
                    <button
                      onClick={() => navigator.clipboard.writeText(analysis.generated_language[item.key as keyof typeof analysis.generated_language])}
                      style={{ position: 'absolute', top: 10, right: 10, padding: '4px 12px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}
                    >
                      COPY
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16, padding: '16px 20px', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', lineHeight: 1.8, letterSpacing: 0.5 }}>
            DISCLAIMER: PROMETHEUS is an informational due diligence tool. Scores and findings do not constitute legal advice and do not guarantee TCPA compliance or protection from liability. InsuraSafe, LLC expressly disclaims all warranties. Always consult a qualified attorney before making compliance decisions.
          </div>
        </div>
      )}

      {/* Empty state */}
      {!scanning && !result && (
        <div style={{ marginTop: 40 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>What Prometheus Checks</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            {[
              { n: '01', title: 'Prior Express Written Consent', tip: 'The #1 legal requirement. Most lead forms fail this completely.' },
              { n: '02', title: 'Seller Identification', tip: 'The caller must be named in the consent. Vague language is worthless.' },
              { n: '03', title: 'Contact Method Disclosure', tip: "Calls, texts, autodialers — what's disclosed and what isn't." },
              { n: '04', title: 'Shared Lead Flag', tip: "Multi-buyer consent is invalid under the FCC's 2024 ruling." },
              { n: '05', title: 'Privacy Policy Scan', tip: 'Exists, is accessible, and addresses telephone contact.' },
              { n: '06', title: 'SERP Intelligence', tip: 'We hunt complaints, lawsuits, and BBB issues in the wild.' },
              { n: '07', title: 'Opt-Out Language', tip: 'Clear STOP instructions required on every outbound contact.' },
              { n: '08', title: 'Ready-To-Use Language', tip: 'Compliant copy you can use or send to your vendor immediately.' },
            ].map(c => (
              <div
                key={c.n}
                style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px 20px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{c.n}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--orange)', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: '#444' }}>{c.tip}</div>
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
    <Suspense fallback={<div style={{ padding: "60px 40px", color: "var(--muted)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading...</div>}>
      <PrometheusPageInner />
    </Suspense>
  )
}
