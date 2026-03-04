'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import {
  type ChainSignal,
  type SerpDebugEntry,
  type ScanResult,
  TREE_LABELS,
  TIER_CONFIG,
  getStage,
  groupSignals,
} from '@/lib/anathema-types'

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

function findSourceEvidence(entity: string, debugEntries: SerpDebugEntry[], directProofUrl?: string | null): { url: string; title: string } | null {
  if (directProofUrl) return { url: directProofUrl, title: 'View source ↗' }
  const entityLower = entity.toLowerCase()
  for (const entry of debugEntries) {
    for (const r of entry.results) {
      if (!r.url) continue
      const combined = `${r.title} ${r.snippet}`.toLowerCase()
      if (combined.includes(entityLower)) {
        return { url: r.url, title: r.title || 'View source' }
      }
    }
  }
  return null
}

function ChainSignalRow({ signal, debugEntries }: { signal: ChainSignal; debugEntries?: SerpDebugEntry[] }) {
  const cfg = TIER_CONFIG[signal.tier]
  const evidence = debugEntries ? findSourceEvidence(signal.entity, debugEntries) : null

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 10px', background: cfg.dimColor, borderLeft: `2px solid ${cfg.borderColor}`, marginBottom: 4 }}>
      <span style={{ flexShrink: 0, marginTop: 1, fontSize: 8, color: cfg.color, letterSpacing: 1.5, fontFamily: "'DM Mono', monospace", border: `1px solid ${cfg.borderColor}`, padding: '1px 5px', lineHeight: 1.8 }}>
        {cfg.label}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, lineHeight: 1.5, fontFamily: "'DM Mono', monospace", color: signal.tier === 'LOW' ? '#555' : signal.tier === 'MED' ? '#888' : '#aaa' }}>
          {signal.text}
        </div>
        {evidence && (
          <a
            href={evidence.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 3, fontSize: 10, color: 'rgba(0,230,118,0.55)', textDecoration: 'none', fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}
          >
            ↗ {evidence.title.slice(0, 70)}
          </a>
        )}
      </div>
    </div>
  )
}

function ChainSection({ result }: { result: ScanResult }) {
  const [expanded, setExpanded] = useState(false)
  const signals = result.predicted_sub_imo_signals || []
  const grouped = groupSignals(signals)
  // LOW signals stored but never shown to recruiter
  const visibleSignals = [...grouped.high, ...grouped.med]
  const debugEntries = result.serp_debug || undefined

  if (visibleSignals.length === 0 && !result.predicted_sub_imo && !result.unresolved_upline) return null

  const partnerEvidence = result.predicted_sub_imo && debugEntries
    ? findSourceEvidence(result.predicted_sub_imo, debugEntries, result.predicted_sub_imo_proof_url)
    : result.predicted_sub_imo_proof_url
    ? { url: result.predicted_sub_imo_proof_url, title: 'View source ↗' }
    : null

  return (
    <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,230,118,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: '#555', letterSpacing: 3 }}>CHAIN INTELLIGENCE</div>
        {visibleSignals.length > 0 && (
          <button onClick={() => setExpanded(v => !v)}
            style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#555', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.5, padding: '4px 10px', cursor: 'pointer' }}>
            {expanded ? 'COLLAPSE' : `SHOW ALL SIGNALS (${visibleSignals.length})`}
          </button>
        )}
      </div>

      {/* Resolved partner — the chain feeding the parent prediction */}
      {result.predicted_sub_imo && (result.predicted_sub_imo_confidence ?? 0) >= 45 && (
        <div style={{
          marginBottom: visibleSignals.length > 0 ? 14 : 0,
          padding: '10px 16px',
          background: 'rgba(0,230,118,0.04)',
          border: `1px solid ${result.prediction_source === 'chain_resolver' ? 'rgba(0,230,118,0.4)' : 'rgba(0,230,118,0.2)'}`,
        }}>
          <div style={{ fontSize: 8, color: result.prediction_source === 'chain_resolver' ? 'rgba(0,230,118,0.6)' : '#555', letterSpacing: 2, marginBottom: 4 }}>
            {result.prediction_source === 'chain_resolver' ? 'CHAIN-SOURCED · THIS IS WHY WE KNOW' : 'PREDICTED SUB-IMO'}
          </div>
          <div style={{ fontSize: 20, color: 'var(--green)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 3, marginBottom: partnerEvidence ? 6 : 0 }}>
            {result.predicted_sub_imo}
          </div>
          {/* The evidence link — click to see exactly what the system found */}
          {partnerEvidence && (
            <a
              href={partnerEvidence.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', fontSize: 10, color: 'rgba(0,230,118,0.65)', textDecoration: 'none', fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, marginBottom: 8 }}
            >
              ↗ {partnerEvidence.title.slice(0, 70)}
            </a>
          )}
          {result.predicted_sub_imo_confidence != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 100, height: 3, background: '#1e1e1e', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${result.predicted_sub_imo_confidence}%`, background: 'linear-gradient(90deg, rgba(0,230,118,0.3), var(--green))', transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--green)', letterSpacing: 1 }}>{result.predicted_sub_imo_confidence}%</span>
            </div>
          )}
        </div>
      )}

      {/* Unresolved upline — found but not in network map */}
      {result.unresolved_upline && (
        <div style={{
          marginBottom: visibleSignals.length > 0 ? 12 : 0,
          padding: '10px 16px',
          background: 'rgba(255,152,0,0.04)',
          border: '1px solid rgba(255,152,0,0.35)',
        }}>
          <div style={{ fontSize: 9, color: '#777', letterSpacing: 2, marginBottom: 4 }}>
            UNRESOLVED UPLINE · NOT IN NETWORK MAP
          </div>
          <div style={{ fontSize: 15, color: '#ff9800', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, marginBottom: 6 }}>
            {result.unresolved_upline}
          </div>
          {result.unresolved_upline_evidence && (
            <div style={{ fontSize: 11, color: '#666', fontFamily: "'DM Mono', monospace", marginBottom: 6, lineHeight: 1.6 }}>
              "{result.unresolved_upline_evidence}"
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {result.unresolved_upline_source_url && (
              <a
                href={result.unresolved_upline_source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 10, color: 'rgba(255,152,0,0.7)', textDecoration: 'none', fontFamily: "'DM Mono', monospace" }}
              >
                ↗ View source
              </a>
            )}
            <span style={{ fontSize: 9, color: '#444', fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
              {result.unresolved_upline_confidence} CONFIDENCE · Add to network map to improve future scans
            </span>
          </div>
        </div>
      )}

      {/* Tier pills — HIGH and MED only */}
      {visibleSignals.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: expanded ? 12 : 0, flexWrap: 'wrap' }}>
          {grouped.high.length > 0 && <div style={{ fontSize: 9, padding: '3px 10px', border: `1px solid ${TIER_CONFIG.HIGH.borderColor}`, color: TIER_CONFIG.HIGH.color, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>{grouped.high.length} HIGH</div>}
          {grouped.med.length > 0  && <div style={{ fontSize: 9, padding: '3px 10px', border: `1px solid ${TIER_CONFIG.MED.borderColor}`,  color: TIER_CONFIG.MED.color,  fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>{grouped.med.length} MED</div>}
        </div>
      )}

      {expanded && visibleSignals.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {grouped.high.map((s, i) => <ChainSignalRow key={`h${i}`} signal={s} debugEntries={debugEntries} />)}
          {grouped.med.map((s, i)  => <ChainSignalRow key={`m${i}`} signal={s} debugEntries={debugEntries} />)}
        </div>
      )}
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

  const [confirmedTrees, setConfirmedTrees] = useState<string[]>([])
  const [confirmedOther, setConfirmedOther] = useState('')
  const [subImo, setSubImo] = useState('')
  const [recruiterNotes, setRecruiterNotes] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [davidFacts, setDavidFacts] = useState<any>(null)

  const [specimens, setSpecimens] = useState<any[]>([])
  const [specimenPage, setSpecimenPage] = useState(0)
  const SPECIMENS_PER_PAGE = 5

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const searchParams = useSearchParams()

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
        if (s.confirmed_tree) setConfirmedTrees(
          Array.isArray(s.confirmed_tree)
            ? s.confirmed_tree
            : s.confirmed_tree ? [s.confirmed_tree] : []
        )
        if (s.confirmed_tree_other) setConfirmedOther(s.confirmed_tree_other)
        if (s.sub_imo) setSubImo(s.sub_imo)
        if (s.recruiter_notes) setRecruiterNotes(s.recruiter_notes)
        setSaveState('saved')
      }
    }
    loadScan()
  }, [searchParams])

  useEffect(() => {
    fetch('/api/specimens')
      .then(r => r.json())
      .then(d => setSpecimens(d.specimens || []))
      .catch(() => {})
  }, [])

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
    // Only reset observation fields if there's no saved observation from a previous scan
    // This prevents losing confirmed data if the user accidentally re-scans
    if (saveState !== 'saved') {
      setConfirmedTrees([])
      setConfirmedOther('')
      setSubImo('')
      setRecruiterNotes('')
    }
    setSaveState('idle')

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
            if (data.predicted_sub_imo) addLog(`[FOUND] SUB-IMO: ${data.predicted_sub_imo} — ${data.predicted_sub_imo_confidence}% confidence${data.predicted_sub_imo_proof_url ? ' · proof linked' : ''}`)
            else if (data.unresolved_upline) addLog(`[ALERT] UNRESOLVED UPLINE: ${data.unresolved_upline} — not in network map`)
            else if (data.predicted_sub_imo_signals?.length > 0) addLog(`[OK] Chain signals collected — no confident sub-IMO match`)
            if (data.prediction_source === 'chain_resolver') addLog(`[FOUND] Prediction sourced from chain — partner resolved in network map`)
            setResult(data)
            setSaveState('idle') // Always reset — scan result is fresh, nothing saved yet
            setDavidFacts(data.david_facts || null)
            if (data.david_facts) {
              void fetch('/api/anathema', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'save_david_facts',
                  agent_name: agencyName.trim(),
                  city: city.trim(),
                  state: state.trim().toUpperCase(),
                  david_facts: data.david_facts,
                }),
              })
            }
            // Auto-populate sub-IMO field when detected
            if (data.predicted_sub_imo) setSubImo(data.predicted_sub_imo)
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
      const res = await fetch('/api/anathema', {
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
          prediction_source: result.prediction_source || null,
          facebook_profile_url: result.facebook_profile_url,
          facebook_about: result.facebook_about,
          predicted_sub_imo: result.predicted_sub_imo || null,
          predicted_sub_imo_confidence: result.predicted_sub_imo_confidence || null,
          predicted_sub_imo_signals: result.predicted_sub_imo_signals || [],
          predicted_sub_imo_partner_id: result.predicted_sub_imo_partner_id || null,
          predicted_sub_imo_proof_url: result.predicted_sub_imo_proof_url || null,
          serp_debug: result.serp_debug || null,
          confirmed_tree: confirmedTrees.length === 1 ? confirmedTrees[0] : confirmedTrees.length > 1 ? confirmedTrees.join(',') : null,
          confirmed_tree_other: confirmedOther || null,
          confirmed_sub_imo: subImo || null,
          recruiter_notes: recruiterNotes || null,
          david_facts: davidFacts,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        console.error('[logObservation] Save failed:', data)
        setSaveState('idle')
        setError('Failed to save observation. Please try again.')
        return
      }
      setSaveState('saved')
      // Refresh specimens list so the new entry appears immediately
      fetch('/api/specimens')
        .then(r => r.json())
        .then(d => setSpecimens(d.specimens || []))
        .catch(() => {})
    } catch (err) {
      console.error('[logObservation] Network error:', err)
      setSaveState('idle')
      setError('Failed to save observation. Please try again.')
    }
  }

  async function loadSpecimen(s: any) {
    setAgencyName(s.agent_name || '')
    setWebsite(s.agent_website || '')
    setCity(s.city || '')
    setState(s.state || '')
    setResult(null)
    setError('')
    setLogLines([])
    setConfirmedTrees(s.confirmed_tree ? s.confirmed_tree.split(',').map((t: string) => t.trim()) : [])
    setConfirmedOther(s.confirmed_tree_other || '')
    setSubImo(s.confirmed_sub_imo || '')
    setRecruiterNotes(s.recruiter_notes || '')
    setSaveState('saved')
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Fetch the full scan result so the panel renders
    try {
      const res = await fetch(`/api/anathema?id=${s.id}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.scan?.analysis_json) {
        setResult(data.scan.analysis_json)
        setDavidFacts(data.scan.david_facts || null)
        if (data.scan.analysis_json.predicted_sub_imo && !s.confirmed_sub_imo) {
          setSubImo(data.scan.analysis_json.predicted_sub_imo)
        }
      }
    } catch {}
  }

  const stage = result ? getStage(result.confidence, result.predicted_tree) : null
  const treeLabel = result ? TREE_LABELS[result.predicted_tree] || 'UNCLASSIFIED' : ''

  return (
    <div style={{ padding: '60px 40px', maxWidth: 1100 }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadSlide { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes betaSweep { 0% { transform: translateX(-100%); } 60%,100% { transform: translateX(100%); } }
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
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>
              ANATHEMA<span style={{ color: 'var(--green)' }}>.</span>
            </h1>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: 3,
              color: '#00e676',
              border: '1px solid rgba(0,230,118,0.4)',
              background: 'rgba(0,230,118,0.06)',
              padding: '5px 10px',
              marginBottom: 6,
              position: 'relative',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}>
              <span style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(0,230,118,0.12), transparent)',
                animation: 'betaSweep 3s ease-in-out infinite',
              }} />
              ◈ BETA
            </div>
          </div>
        </div>
        <a
          href="/dashboard/anathema/map"
          style={{ padding: '10px 24px', background: 'transparent', border: '1px solid rgba(0,230,118,0.3)', color: 'var(--green)', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'border-color 0.15s, background 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,230,118,0.06)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,230,118,0.6)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,230,118,0.3)' }}
        >
          <span style={{ fontSize: 8 }}>◈</span> VIEW INFECTION MAP
        </a>
      </div>

      {/* Input */}
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2, marginBottom: 2 }}>
        <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL (optional — improves accuracy)" disabled={scanning}
          style={{ padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5 }} />
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City (optional)" disabled={scanning}
          style={{ padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5 }} />
        <input value={state} onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="State (optional)" disabled={scanning}
          style={{ padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5 }} />
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

      {/* Result */}
      {result && !scanning && (
        <div style={{ animation: 'slideIn 0.3s ease both' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 12 }}>
            SPECIMEN: {agencyName.toUpperCase()}{city ? ` · ${city.toUpperCase()}, ${state.toUpperCase()}` : ''}
          </div>

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
                <div style={{ fontSize: 56, color: result.predicted_tree !== 'unknown' ? 'var(--green)' : '#222', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, lineHeight: 1 }}>{stage?.roman || '—'}</div>
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

            {/* Chain Intelligence */}
            <ChainSection result={result} />

            {/* Field observation log */}
            <div style={{ padding: '16px 24px' }}>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 14 }}>FIELD OBSERVATION LOG</div>

              <div style={{ fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>
                SELECT ALL THAT APPLY
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                {(['integrity', 'amerilife', 'sms', 'other'] as const).map(t => {
                  const active = confirmedTrees.includes(t)
                  return (
                    <button key={t} onClick={() =>
                      setConfirmedTrees(prev =>
                        prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                      )
                    }
                      style={{ background: active ? 'rgba(0,230,118,0.1)' : 'transparent', border: `1px solid ${active ? 'var(--green)' : '#333'}`, color: active ? 'var(--green)' : '#555', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.1s', textTransform: 'uppercase' }}>
                      {active && '✓ '}{t === 'integrity' ? 'INTEGRITY' : t === 'amerilife' ? 'AMERILIFE' : t === 'sms' ? 'SMS' : 'OTHER'}
                    </button>
                  )
                })}
              </div>

              {confirmedTrees.includes('other') && (
                <input value={confirmedOther} onChange={e => setConfirmedOther(e.target.value)} placeholder="FMO name..."
                  style={{ display: 'block', width: '100%', background: '#0e0e0e', border: '1px solid #333', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 12, padding: '8px 12px', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }} />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 8 }}>
                <input value={subImo} onChange={e => setSubImo(e.target.value)}
                  placeholder={result.predicted_sub_imo && (result.predicted_sub_imo_confidence ?? 0) >= 45 ? `Confirm or correct: ${result.predicted_sub_imo}` : 'Sub-IMO / affiliate (optional)...'}
                  style={{ padding: '8px 12px', background: '#0e0e0e', border: `1px solid ${result.predicted_sub_imo && !subImo ? 'rgba(0,230,118,0.2)' : '#222'}`, color: '#888', fontFamily: "'DM Mono', monospace", fontSize: 11, outline: 'none' }} />
                <input value={recruiterNotes} onChange={e => setRecruiterNotes(e.target.value)} placeholder="Field notes (optional)..."
                  style={{ padding: '8px 12px', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: "'DM Mono', monospace", fontSize: 11, outline: 'none' }} />
              </div>

              <button onClick={logObservation} disabled={saveState === 'saving'}
                style={{ background: saveState === 'saved' ? 'rgba(0,230,118,0.08)' : 'transparent', border: `1px solid ${saveState === 'saved' ? 'var(--green)' : '#333'}`, color: saveState === 'saved' ? 'var(--green)' : '#666', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '9px 20px', cursor: saveState === 'saving' ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                {saveState === 'saved' ? 'OBSERVATION LOGGED · CLICK TO UPDATE' : saveState === 'saving' ? 'LOGGING...' : 'LOG OBSERVATION'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={() => {
              setConfirmedTrees([])
              setConfirmedOther('')
              setSubImo('')
              setRecruiterNotes('')
              setSaveState('idle')
              runScan()
            }} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>
              RUN NEW SCAN
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!scanning && !result && (
        <div style={{ marginTop: 40 }}>

          {/* Recent scans */}
          {specimens.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 2 }}>RECENT SCANS</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>
                  {specimenPage * SPECIMENS_PER_PAGE + 1}–{Math.min((specimenPage + 1) * SPECIMENS_PER_PAGE, specimens.length)} OF {specimens.length}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {specimens.slice(specimenPage * SPECIMENS_PER_PAGE, (specimenPage + 1) * SPECIMENS_PER_PAGE).map((s: any) => {
                  const tree = TREE_LABELS[s.predicted_tree] || 'UNCLASSIFIED'
                  const confirmed = s.confirmed_tree
                  const treeColor = s.predicted_tree === 'integrity' ? 'var(--green)' : s.predicted_tree === 'amerilife' ? '#2196f3' : s.predicted_tree === 'sms' ? '#ff9800' : '#333'
                  return (
                    <button
                      key={s.id}
                      onClick={() => loadSpecimen(s)}
                      style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center', padding: '14px 20px', background: '#0e0d0c', border: '1px solid rgba(0,230,118,0.08)', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.25)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.08)')}
                    >
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)', letterSpacing: 0.5, marginBottom: 3 }}>
                          {s.agent_name}
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 1 }}>
                          {[s.city, s.state].filter(Boolean).join(', ')}
                          {s.confirmed_sub_imo && <span style={{ color: '#555' }}> · {s.confirmed_sub_imo}</span>}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: treeColor, letterSpacing: 2, textAlign: 'right' }}>
                        {tree}
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1, textAlign: 'right' }}>
                        {confirmed
                          ? <span style={{ color: 'var(--green)', fontSize: 9 }}>✓ CONFIRMED</span>
                          : s.predicted_confidence
                          ? <span style={{ color: '#444' }}>{s.predicted_confidence}%</span>
                          : <span style={{ color: '#333' }}>—</span>
                        }
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 0.5, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </button>
                  )
                })}
              </div>

              {specimens.length > SPECIMENS_PER_PAGE && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  <button
                    onClick={() => setSpecimenPage(p => Math.max(0, p - 1))}
                    disabled={specimenPage === 0}
                    style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid #1e1e1e', color: specimenPage === 0 ? '#222' : '#555', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, cursor: specimenPage === 0 ? 'default' : 'pointer' }}
                  >
                    ← PREV
                  </button>
                  <button
                    onClick={() => setSpecimenPage(p => Math.min(Math.ceil(specimens.length / SPECIMENS_PER_PAGE) - 1, p + 1))}
                    disabled={(specimenPage + 1) * SPECIMENS_PER_PAGE >= specimens.length}
                    style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid #1e1e1e', color: (specimenPage + 1) * SPECIMENS_PER_PAGE >= specimens.length ? '#222' : '#555', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, cursor: (specimenPage + 1) * SPECIMENS_PER_PAGE >= specimens.length ? 'default' : 'pointer' }}
                  >
                    NEXT →
                  </button>
                </div>
              )}
            </div>
          )}

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
              <div key={c.n} style={{ background: '#0e0d0c', border: '1px solid rgba(0,230,118,0.1)', padding: '20px 20px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.1)')}>
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
