'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type ScanResult = {
  predicted_tree: 'integrity' | 'amerilife' | 'sms' | 'unknown'
  confidence: number
  signals_used: string[]
  reasoning: string
  facebook_profile_url: string | null
  facebook_about: string | null
}

const TREE_LABELS: Record<string, string> = {
  integrity: 'INTEGRITY',
  amerilife: 'AMERILIFE',
  sms: 'SMS',
  unknown: 'UNCLASSIFIED',
}

const LOADING_STEPS = [
  'Resolving agency identity',
  'Crawling website content',
  'Scoring carrier fingerprint',
  'Running affiliation search',
  'Locating Facebook profile',
  'Running pathogen analysis',
  'Generating specimen report',
]

const STAGE_LOGS: Record<number, string[]> = {
  0: ['[OK] Agent name received', '[OK] Initializing specimen scan'],
  1: ['[OK] Fetching website content', '[OK] Extracting visible text', '[FOUND] Website content indexed'],
  2: ['[OK] Checking carrier patterns', '[OK] Matching Integrity fingerprint', '[OK] Matching AmeriLife fingerprint', '[OK] Matching SMS fingerprint'],
  3: ['[OK] Querying affiliation directories', '[OK] Scanning partner indexes', '[FOUND] SERP intelligence compiled'],
  4: ['[OK] Searching for Facebook profile', '[OK] Probing profile content', '[FOUND] Social intelligence compiled'],
  5: ['[OK] Sending to ANATHEMA analysis engine', '[OK] Weighing pathogen markers...', '[OK] Calculating infection stage...', '[OK] Assessing strain confidence...'],
  6: ['[OK] Compiling specimen report', '[OK] Staging confirmed', '[OK] Report ready'],
}

function getStage(confidence: number, tree: string): { roman: string; label: string } {
  if (tree === 'unknown' || confidence < 35) return { roman: '—', label: 'INDETERMINATE' }
  if (confidence >= 80) return { roman: 'IV', label: 'STAGE IV' }
  if (confidence >= 55) return { roman: 'III', label: 'STAGE III' }
  return { roman: 'II', label: 'STAGE II' }
}

function TerminalLog({ lines }: { lines: string[] }) {
  return (
    <div style={{ background: '#0a0a09', border: '1px solid rgba(0,230,118,0.15)', padding: '16px', height: 190, overflowY: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5, lineHeight: 2 }}>
      <div style={{ color: '#333', marginBottom: 4, fontSize: 10 }}>anathema@pathogen-intel:~$ ./scan</div>
      {lines.map((line, i) => (
        <div key={i} style={{
          color: line.startsWith('[OK]') ? 'var(--green)' : line.startsWith('[WARN]') ? 'var(--yellow)' : line.startsWith('[ALERT]') ? 'var(--red)' : line.startsWith('[FOUND]') ? 'rgba(0,230,118,0.6)' : '#444',
          animation: 'slideIn 0.2s ease both',
        }}>
          {line}
        </div>
      ))}
      <div style={{ display: 'inline-block', width: 8, height: 12, background: 'var(--green)', animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
    </div>
  )
}

export default function AnathemaDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 40px', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2 }}>LOADING...</div>}>
      <AnathemaDashboardInner />
    </Suspense>
  )
}

function AnathemaDashboardInner() {
  const [agencyName, setAgencyName] = useState('')
  const [website, setWebsite] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [scanning, setScanning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [logLines, setLogLines] = useState<string[]>([])
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')

  // Field observation state
  const [confirmedTree, setConfirmedTree] = useState('')
  const [confirmedOther, setConfirmedOther] = useState('')
  const [subImo, setSubImo] = useState('')
  const [recruiterNotes, setRecruiterNotes] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const searchParams = useSearchParams()

  // Load saved scan if ?id= is in the URL
  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) return
    async function loadScan() {
      const res = await fetch(`/api/anathema?id=${id}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.scan) {
        const s = data.scan
        setAgencyName(s.agent_name || '')
        setWebsite(s.url || '')
        setCity(s.city || '')
        setState(s.state || '')
        if (s.analysis_json) setResult(s.analysis_json)
        if (s.confirmed_tree) setConfirmedTree(s.confirmed_tree)
        if (s.confirmed_tree_other) setConfirmedOther(s.confirmed_tree_other)
        if (s.sub_imo) setSubImo(s.sub_imo)
        if (s.recruiter_notes) setRecruiterNotes(s.recruiter_notes)
        setSaveState('saved')
      }
    }
    loadScan()
  }, [searchParams])

  function addLog(line: string) {
    setLogLines(prev => [...prev.slice(-40), line])
  }

  async function runScan() {
    if (!agencyName.trim() || scanning) return
    setScanning(true)
    setResult(null)
    setError('')
    setLogLines([])
    setCurrentStep(0)
    setSaveState('idle')
    setConfirmedTree('')
    setConfirmedOther('')
    setSubImo('')
    setRecruiterNotes('')

    let si = 0
    let li = 0
    function tick() {
      if (si >= LOADING_STEPS.length) return
      setCurrentStep(si)
      const stageLogs = STAGE_LOGS[si] || []
      if (li < stageLogs.length) {
        addLog(stageLogs[li]); li++
        timerRef.current = setTimeout(tick, 260)
      } else {
        li = 0; si++
        if (si < LOADING_STEPS.length) timerRef.current = setTimeout(tick, 320)
      }
    }
    tick()

    try {
      const res = await fetch('/api/anathema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: {
            name: agencyName.trim(),
            website: website.trim() || null,
            city: city.trim(),
            state: state.trim().toUpperCase(),
            address: city && state ? `${city}, ${state}` : '',
            carriers: [],
            notes: '',
            about: null,
          }
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (timerRef.current) clearTimeout(timerRef.current)
      setCurrentStep(LOADING_STEPS.length - 1)
      const tree = TREE_LABELS[data.predicted_tree] || 'UNCLASSIFIED'
      addLog(`[OK] Scan complete — ${agencyName.trim()}`)
      addLog(data.predicted_tree !== 'unknown'
        ? `[FOUND] STRAIN: ${tree} — CONFIDENCE: ${data.confidence}%`
        : `[WARN] STRAIN: UNCLASSIFIED — Insufficient markers`)
      if (data.facebook_profile_url) addLog(`[FOUND] Facebook profile located`)
      setResult(data)
    } catch (err: any) {
      if (timerRef.current) clearTimeout(timerRef.current)
      addLog(`[ALERT] Scan failed: ${err.message}`)
      setError(err.message || 'Scan failed. Please try again.')
    }
    setScanning(false)
    setCurrentStep(-1)
  }

  async function logObservation() {
    if (!result || saveState === 'saving') return
    setSaveState('saving')
    try {
      await fetch('/api/anathema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_observation',
          agent_name: agencyName.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          agent_website: website.trim() || null,
          agent_address: city && state ? `${city}, ${state}` : '',
          predicted_tree: result.predicted_tree,
          predicted_confidence: result.confidence,
          prediction_signals: result.signals_used,
          prediction_reasoning: result.reasoning,
          facebook_profile_url: result.facebook_profile_url,
          facebook_about: result.facebook_about,
          confirmed_tree: confirmedTree || null,
          confirmed_tree_other: confirmedOther || null,
          confirmed_sub_imo: subImo || null,
          recruiter_notes: recruiterNotes || null,
        }),
      })
      setSaveState('saved')
    } catch {
      setSaveState('idle')
    }
  }

  const stage = result ? getStage(result.confidence, result.predicted_tree) : null
  const treeLabel = result ? TREE_LABELS[result.predicted_tree] || 'UNCLASSIFIED' : ''

  return (
    <div style={{ padding: '60px 40px', maxWidth: 1100 }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadSlide { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes scanDown { 0% { top: 0; opacity: 0.8; } 100% { top: 100%; opacity: 0; } }
        .anathema-initial-scan {
          position: absolute; left: 0; width: 100%; height: 2px; z-index: 10;
          background: linear-gradient(90deg, transparent, #00e676, transparent);
          animation: scanDown 1.2s ease-out 1 forwards;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
            Pathogen Analysis System · Chemical A0-3959X.91–15
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>
            ANATHEMA<span style={{ color: 'var(--green)' }}>.</span>
          </h1>
        </div>
        <a
          href="/dashboard/anathema/map"
          style={{
            padding: '10px 24px',
            background: 'transparent',
            border: '1px solid rgba(0,230,118,0.3)',
            color: 'var(--green)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,230,118,0.06)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,230,118,0.6)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,230,118,0.3)' }}
        >
          <span style={{ fontSize: 8 }}>◈</span> VIEW INFECTION MAP
        </a>
      </div>

      {/* Input form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 2 }}>
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 0, border: `1px solid ${scanning ? 'var(--green)' : 'var(--border-light)'}`, background: 'var(--card)', transition: 'border-color 0.2s', boxShadow: scanning ? '0 0 0 1px rgba(0,230,118,0.3)' : 'none' }}>
          <input
            value={agencyName}
            onChange={e => setAgencyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runScan()}
            placeholder="Agency or agent name"
            disabled={scanning}
            style={{ flex: 1, padding: '18px 24px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }}
          />
          <button
            onClick={runScan}
            disabled={scanning || !agencyName.trim()}
            style={{ padding: '18px 36px', background: scanning ? '#111' : 'transparent', border: 'none', borderLeft: `1px solid ${scanning ? 'rgba(0,230,118,0.2)' : 'var(--border-light)'}`, cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3, color: scanning ? '#333' : 'var(--green)', transition: 'all 0.15s', whiteSpace: 'nowrap', position: 'relative', overflow: 'hidden' }}
          >
            {scanning ? 'SCANNING...' : '◈ ANATHEMA SCAN'}
          </button>
        </div>
      </div>

      {/* Optional fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2, marginBottom: 2 }}>
        <input
          value={website}
          onChange={e => setWebsite(e.target.value)}
          placeholder="Website URL (optional — improves accuracy)"
          disabled={scanning}
          style={{ padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5 }}
        />
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="City (optional)"
          disabled={scanning}
          style={{ padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5 }}
        />
        <input
          value={state}
          onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))}
          placeholder="State (optional)"
          disabled={scanning}
          style={{ padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5 }}
        />
      </div>

      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, marginBottom: 32 }}>
        AGENCY NAME REQUIRED · WEBSITE + LOCATION OPTIONAL BUT IMPROVE SIGNAL QUALITY
      </div>

      {/* Loading */}
      {scanning && currentStep >= 0 && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--green)', animation: 'loadSlide 1s ease-in-out infinite' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LOADING_STEPS.map((step, i) => (
                <div key={step} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10, color: i < currentStep ? 'var(--green)' : i === currentStep ? 'rgba(0,230,118,0.7)' : '#333', transition: 'color 0.3s' }}>
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

      {/* Result panel */}
      {result && !scanning && (
        <div style={{ animation: 'slideIn 0.3s ease both' }}>

          {/* Result header */}
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 12 }}>
            SPECIMEN: {agencyName.toUpperCase()}{city ? ` · ${city.toUpperCase()}, ${state.toUpperCase()}` : ''}
          </div>

          {/* ANATHEMA panel */}
          <div style={{ background: '#141210', border: '1px solid rgba(0,230,118,0.25)', fontFamily: "'DM Mono', monospace", position: 'relative', overflow: 'hidden', marginBottom: 2 }}>
            <div className="anathema-initial-scan" />

            {/* Panel header */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,230,118,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: 3 }}>◈ ANATHEMA · PATHOGEN ANALYSIS SYSTEM v1</div>
              <div style={{ fontSize: 9, color: '#333', letterSpacing: 1 }}>DIRECT SPECIMEN SCAN</div>
            </div>

            {/* Strain + Stage */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,230,118,0.1)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 8 }}>STRAIN DETECTED</div>
                <div style={{ fontSize: result.predicted_tree !== 'unknown' ? 40 : 24, color: result.predicted_tree !== 'unknown' ? 'var(--green)' : '#444', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 3, marginBottom: 12, lineHeight: 1 }}>
                  {treeLabel}
                </div>
                {result.predicted_tree !== 'unknown' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 180, height: 4, background: '#1e1e1e', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${result.confidence}%`, background: 'linear-gradient(90deg, rgba(0,230,118,0.4), #00e676)', transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--green)', letterSpacing: 1 }}>{result.confidence}% CONFIDENCE</div>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 6 }}>INFECTION STAGE</div>
                <div style={{ fontSize: 56, color: result.predicted_tree !== 'unknown' ? 'var(--green)' : '#222', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, lineHeight: 1 }}>
                  {stage?.roman || '—'}
                </div>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 2 }}>{stage?.label}</div>
              </div>
            </div>

            {/* Reasoning */}
            {result.reasoning && result.predicted_tree !== 'unknown' && (
              <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(0,230,118,0.1)', fontSize: 12, color: '#666', lineHeight: 1.7, letterSpacing: 0.3 }}>
                {result.reasoning}
              </div>
            )}

            {/* Pathogen markers */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,230,118,0.1)' }}>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 12 }}>PATHOGEN MARKERS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(result.signals_used || []).map((sig, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#888', display: 'flex', gap: 10, lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span>
                    <span>{sig}</span>
                  </div>
                ))}
                {result.facebook_profile_url && (
                  <div style={{ fontSize: 11, color: '#555', display: 'flex', gap: 10, marginTop: 2 }}>
                    <span style={{ color: '#444', flexShrink: 0 }}>▸</span>
                    <a href={result.facebook_profile_url} target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'none' }}>
                      Facebook profile located ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Field observation log */}
            <div style={{ padding: '16px 24px' }}>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 14 }}>FIELD OBSERVATION LOG</div>

              <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                {(['integrity', 'amerilife', 'sms', 'other'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setConfirmedTree(t === confirmedTree ? '' : t)}
                    style={{
                      background: confirmedTree === t ? 'rgba(0,230,118,0.1)' : 'transparent',
                      border: `1px solid ${confirmedTree === t ? 'var(--green)' : '#333'}`,
                      color: confirmedTree === t ? 'var(--green)' : '#555',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      letterSpacing: 2,
                      padding: '6px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t === 'integrity' ? 'INTEGRITY' : t === 'amerilife' ? 'AMERILIFE' : t === 'sms' ? 'SMS' : 'OTHER'}
                  </button>
                ))}
              </div>

              {confirmedTree === 'other' && (
                <input
                  value={confirmedOther}
                  onChange={e => setConfirmedOther(e.target.value)}
                  placeholder="FMO name..."
                  style={{ display: 'block', width: '100%', background: '#0e0e0e', border: '1px solid #333', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 12, padding: '8px 12px', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
                />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 8 }}>
                <input
                  value={subImo}
                  onChange={e => setSubImo(e.target.value)}
                  placeholder="Sub-IMO / affiliate (optional)..."
                  style={{ padding: '8px 12px', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: "'DM Mono', monospace", fontSize: 11, outline: 'none' }}
                />
                <input
                  value={recruiterNotes}
                  onChange={e => setRecruiterNotes(e.target.value)}
                  placeholder="Field notes (optional)..."
                  style={{ padding: '8px 12px', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: "'DM Mono', monospace", fontSize: 11, outline: 'none' }}
                />
              </div>

              <button
                onClick={logObservation}
                disabled={saveState === 'saving'}
                style={{
                  background: saveState === 'saved' ? 'rgba(0,230,118,0.08)' : 'transparent',
                  border: `1px solid ${saveState === 'saved' ? 'var(--green)' : '#333'}`,
                  color: saveState === 'saved' ? 'var(--green)' : '#666',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: 2,
                  padding: '9px 20px',
                  cursor: saveState === 'saving' ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {saveState === 'saved' ? 'OBSERVATION LOGGED · SPECIMEN DATABASE UPDATED' : saveState === 'saving' ? 'LOGGING...' : 'LOG OBSERVATION'}
              </button>
            </div>
          </div>

          {/* Rescan */}
          <div style={{ marginTop: 12 }}>
            <button
              onClick={runScan}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}
            >
              RUN NEW SCAN
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!scanning && !result && (
        <div style={{ marginTop: 40 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>What ANATHEMA Detects</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { n: '01', title: 'Carrier Fingerprint', tip: 'Every tree has its carriers. SMS runs Mutual of Omaha. Integrity runs Humana + Aetna. The carriers tell you more than the agent will.' },
              { n: '02', title: 'Language Markers', tip: '"FFL agent", "IntegrityCONNECT", "USABG", "Rethinking Retirement" — brand contamination in their own copy.' },
              { n: '03', title: 'Web Intelligence', tip: 'A live Google search cross-references the agency against Integrity, AmeriLife, and SMS partner directories.' },
              { n: '04', title: 'Facebook Profile Scan', tip: 'Trip photos with FMO branding. "Proud Integrity partner." Agents post what they won\'t say on the phone.' },
              { n: '05', title: 'Infection Staging', tip: 'STAGE I (trace) through STAGE IV (confirmed). Know how confident the signal is before you act on it.' },
              { n: '06', title: 'Specimen Database', tip: 'Every observation you log teaches the system. ANATHEMA gets smarter with every confirmed scan.' },
            ].map(c => (
              <div
                key={c.n}
                style={{ background: '#0e0d0c', border: '1px solid rgba(0,230,118,0.1)', padding: '20px 20px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.1)')}
              >
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 2, marginBottom: 10 }}>{c.n}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)', marginBottom: 8 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{c.tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
