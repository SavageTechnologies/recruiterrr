'use client'

import { useState, useEffect } from 'react'
import {
  type ChainSignal,
  type SerpDebugEntry,
  type ScanResult,
  TREE_LABELS,
  TIER_CONFIG,
  getStage,
  groupSignals,
} from '@/lib/anathema-types'

type Agent = {
  name: string
  type: string
  phone: string
  address: string
  rating: number
  reviews: number
  website: string | null
  carriers: string[]
  captive: boolean
  score: number
  flag: 'hot' | 'warm' | 'cold'
  notes: string
  years: number | null
  hiring: boolean
  hiring_roles: string[]
  youtube_channel: string | null
  youtube_subscribers: string | null
  youtube_video_count: number
  about: string | null
  contact_email: string | null
  social_links: string[]
  city?: string
  state?: string
}

type SavedSpecimen = ScanResult & {
  confirmed_tree: string | null
  confirmed_tree_other: string | null
  confirmed_sub_imo: string | null
  recruiter_notes: string | null
}

// Find the best matching source URL + title for a given entity string
function findSourceEvidence(entity: string, debugEntries: SerpDebugEntry[], directProofUrl?: string | null): { url: string; title: string } | null {
  // Prefer the direct proof URL from the network scanner — it's ground truth
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
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      padding: '5px 8px', background: cfg.dimColor,
      borderLeft: `2px solid ${cfg.borderColor}`, marginBottom: 3,
    }}>
      <span style={{
        flexShrink: 0, marginTop: 1, fontSize: 7, color: cfg.color,
        letterSpacing: 1.5, fontFamily: "'DM Mono', monospace",
        border: `1px solid ${cfg.borderColor}`, padding: '1px 4px', lineHeight: 1.8,
      }}>
        {cfg.label}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 10, lineHeight: 1.5, fontFamily: "'DM Mono', monospace",
          color: signal.tier === 'LOW' ? '#555' : signal.tier === 'MED' ? '#888' : '#aaa',
        }}>
          {signal.text}
        </div>
        {evidence && (
          <a
            href={evidence.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'inline-block', marginTop: 3,
              fontSize: 9, color: 'rgba(0,230,118,0.5)',
              textDecoration: 'none', fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
            }}
          >
            ↗ {evidence.title.slice(0, 60)}
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
  // LOW signals collected but never surfaced to recruiter
  const visibleSignals = [...grouped.high, ...grouped.med]
  const debugEntries = result.serp_debug || undefined

  if (visibleSignals.length === 0 && !result.predicted_sub_imo && !result.unresolved_upline) return null

  // Find evidence link for the resolved partner
  const partnerEvidence = result.predicted_sub_imo && debugEntries
    ? findSourceEvidence(result.predicted_sub_imo, debugEntries, result.predicted_sub_imo_proof_url)
    : result.predicted_sub_imo_proof_url
    ? { url: result.predicted_sub_imo_proof_url, title: 'View source ↗' }
    : null

  return (
    <div style={{ borderTop: '1px solid rgba(0,230,118,0.1)', padding: '10px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: '#555', letterSpacing: 3 }}>CHAIN INTELLIGENCE</div>
        {visibleSignals.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
            style={{
              background: 'transparent', border: '1px solid #2a2a2a', color: '#555',
              fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 1.5,
              padding: '3px 8px', cursor: 'pointer',
            }}
          >
            {expanded ? 'COLLAPSE' : `SHOW ALL SIGNALS (${visibleSignals.length})`}
          </button>
        )}
      </div>

      {/* Resolved partner block */}
      {result.predicted_sub_imo && (result.predicted_sub_imo_confidence ?? 0) >= 45 && (
        <div style={{
          marginBottom: visibleSignals.length > 0 ? 10 : 0,
          padding: '8px 12px',
          background: 'rgba(0,230,118,0.04)',
          border: `1px solid ${result.prediction_source === 'chain_resolver' ? 'rgba(0,230,118,0.35)' : 'rgba(0,230,118,0.2)'}`,
        }}>
          <div style={{ fontSize: 8, color: '#555', letterSpacing: 2, marginBottom: 3 }}>
            {result.prediction_source === 'chain_resolver' ? 'CHAIN-SOURCED · THIS IS WHY WE KNOW' : 'PREDICTED SUB-IMO'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--green)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, marginBottom: partnerEvidence ? 4 : 0 }}>
            {result.predicted_sub_imo}
          </div>
          {partnerEvidence && (
            <a
              href={partnerEvidence.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-block', fontSize: 9,
                color: 'rgba(0,230,118,0.6)', textDecoration: 'none',
                fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
              }}
            >
              ↗ {partnerEvidence.title.slice(0, 60)}
            </a>
          )}
          {result.predicted_sub_imo_confidence != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <div style={{ width: 60, height: 2, background: '#1e1e1e', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${result.predicted_sub_imo_confidence}%`, background: 'linear-gradient(90deg, rgba(0,230,118,0.3), var(--green))' }} />
              </div>
              <span style={{ fontSize: 9, color: '#555', letterSpacing: 1 }}>{result.predicted_sub_imo_confidence}%</span>
            </div>
          )}
        </div>
      )}

      {/* Unresolved upline — found but not in network map */}
      {result.unresolved_upline && (
        <div style={{
          marginBottom: visibleSignals.length > 0 ? 10 : 0,
          padding: '8px 12px',
          background: 'rgba(255,152,0,0.04)',
          border: '1px solid rgba(255,152,0,0.35)',
        }}>
          <div style={{ fontSize: 8, color: '#777', letterSpacing: 2, marginBottom: 3 }}>
            UNRESOLVED UPLINE · NOT IN NETWORK MAP
          </div>
          <div style={{ fontSize: 13, color: '#ff9800', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, marginBottom: 4 }}>
            {result.unresolved_upline}
          </div>
          {result.unresolved_upline_evidence && (
            <div style={{ fontSize: 10, color: '#666', fontFamily: "'DM Mono', monospace", marginBottom: 4, lineHeight: 1.5 }}>
              "{result.unresolved_upline_evidence}"
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {result.unresolved_upline_source_url && (
              <a
                href={result.unresolved_upline_source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ fontSize: 9, color: 'rgba(255,152,0,0.7)', textDecoration: 'none', fontFamily: "'DM Mono', monospace" }}
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
        <div style={{ display: 'flex', gap: 6, marginBottom: expanded ? 10 : 0, flexWrap: 'wrap' }}>
          {grouped.high.length > 0 && (
            <div style={{ fontSize: 9, padding: '2px 8px', border: `1px solid ${TIER_CONFIG.HIGH.borderColor}`, color: TIER_CONFIG.HIGH.color, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
              {grouped.high.length} HIGH
            </div>
          )}
          {grouped.med.length > 0 && (
            <div style={{ fontSize: 9, padding: '2px 8px', border: `1px solid ${TIER_CONFIG.MED.borderColor}`, color: TIER_CONFIG.MED.color, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
              {grouped.med.length} MED
            </div>
          )}
        </div>
      )}

      {/* Expanded signal rows with source links */}
      {expanded && visibleSignals.length > 0 && (
        <div style={{ marginTop: 4 }}>
          {grouped.high.map((s, i) => <ChainSignalRow key={`h${i}`} signal={s} debugEntries={debugEntries} />)}
          {grouped.med.map((s, i) => <ChainSignalRow key={`m${i}`} signal={s} debugEntries={debugEntries} />)}
        </div>
      )}
    </div>
  )
}

export default function AnathemaPanel({ agent, city, state }: { agent: Agent; city: string; state: string }) {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [existing, setExisting] = useState<SavedSpecimen | null>(null)
  const [confirmedTree, setConfirmedTree] = useState<string>('')
  const [confirmedOther, setConfirmedOther] = useState('')
  const [subImo, setSubImo] = useState('')
  const [recruiterNotes, setRecruiterNotes] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [checkDone, setCheckDone] = useState(false)

  useEffect(() => { checkExisting() }, [])

  async function checkExisting() {
    try {
      const res = await fetch('/api/anathema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_existing', agent_name: agent.name, city, state }),
      })
      const data = await res.json()
      if (data.specimen) {
        setExisting(data.specimen)
        setResult({
          predicted_tree: data.specimen.predicted_tree,
          confidence: data.specimen.predicted_confidence,
          signals_used: data.specimen.prediction_signals || [],
          reasoning: data.specimen.prediction_reasoning,
          facebook_profile_url: data.specimen.facebook_profile_url,
          facebook_about: data.specimen.facebook_about,
          prediction_source: data.specimen.prediction_source || null,
          predicted_sub_imo: data.specimen.predicted_sub_imo || null,
          predicted_sub_imo_confidence: data.specimen.predicted_sub_imo_confidence || null,
          predicted_sub_imo_partner_id: data.specimen.predicted_sub_imo_partner_id || null,
          predicted_sub_imo_signals: data.specimen.predicted_sub_imo_signals || [],
          predicted_sub_imo_proof_url: data.specimen.predicted_sub_imo_proof_url || null,
          unresolved_upline: data.specimen.unresolved_upline || null,
          unresolved_upline_evidence: data.specimen.unresolved_upline_evidence || null,
          unresolved_upline_source_url: data.specimen.unresolved_upline_source_url || null,
          unresolved_upline_confidence: data.specimen.unresolved_upline_confidence || null,
          serp_debug: data.specimen.serp_debug || null,
        })
        setConfirmedTree(data.specimen.confirmed_tree || '')
        setConfirmedOther(data.specimen.confirmed_tree_other || '')
        // Auto-populate sub-IMO from confirmed value, or from prediction if not yet confirmed
        setSubImo(data.specimen.confirmed_sub_imo || data.specimen.predicted_sub_imo || '')
        setRecruiterNotes(data.specimen.recruiter_notes || '')
        setScanState('done')
      }
    } catch {}
    setCheckDone(true)
  }

  async function runScan(e: React.MouseEvent) {
    e.stopPropagation()
    if (scanState === 'scanning') return
    setScanState('scanning')
    setResult(null)
    setErrorMsg('')
    try {
      const res = await fetch('/api/anathema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: { ...agent, city, state } }),
      })
      if (res.status === 429) {
        setScanState('error')
        setErrorMsg('RATE LIMIT — Try again in a few minutes')
        return
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setScanState('done')
      // Auto-populate sub-IMO when network scanner or chain resolver identifies one
      if (data.predicted_sub_imo && !subImo) {
        setSubImo(data.predicted_sub_imo)
      }
    } catch (err: any) {
      setScanState('error')
      setErrorMsg(err.message || 'Scan failed')
    }
  }

  async function logObservation(e: React.MouseEvent) {
    e.stopPropagation()
    if (!result || saveState === 'saving') return
    setSaveState('saving')
    try {
      await fetch('/api/anathema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_observation',
          agent_name: agent.name, city, state,
          agent_website: agent.website, agent_address: agent.address,
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
          confirmed_tree: confirmedTree || null,
          confirmed_tree_other: confirmedOther || null,
          confirmed_sub_imo: subImo || null,
          recruiter_notes: recruiterNotes || null,
        }),
      })
      setSaveState('saved')
    } catch { setSaveState('idle') }
  }

  const stage = result ? getStage(result.confidence, result.predicted_tree) : null
  const treeLabel = result ? TREE_LABELS[result.predicted_tree] || 'UNCLASSIFIED' : ''
  let buttonLabel = 'ANATHEMA SCAN'
  let buttonTitle = ''
  if (scanState === 'scanning') buttonLabel = 'SCANNING...'
  else if (scanState === 'done' && result) {
    buttonLabel = result.predicted_tree !== 'unknown' ? `STRAIN: ${treeLabel}` : 'STRAIN: UNCLASSIFIED'
    buttonTitle = existing ? ' [SPECIMEN ON FILE]' : ''
  }

  return (
    <div style={{ marginTop: 16 }} onClick={e => e.stopPropagation()}>
      {scanState === 'idle' && checkDone && (
        <button onClick={runScan} style={{ background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, padding: '8px 20px', cursor: 'pointer', textTransform: 'uppercase', transition: 'background 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,230,118,0.07)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
          ◈ ANATHEMA SCAN
        </button>
      )}

      {scanState === 'scanning' && (
        <div style={{ border: '1px solid var(--green)', padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, color: 'var(--green)' }}>SCANNING...</span>
          <style>{`@keyframes scanline{0%{top:0}100%{top:100%}}.anathema-scanline{position:absolute;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,#00e676,transparent);animation:scanline 1.2s linear infinite}`}</style>
          <div className="anathema-scanline" />
        </div>
      )}

      {scanState === 'error' && (
        <div style={{ border: '1px solid rgba(255,23,68,0.4)', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, color: 'var(--red)' }}>
            ⚠ {errorMsg}
          </span>
          <button onClick={runScan} style={{ background: 'transparent', border: '1px solid #333', color: '#555', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.5, padding: '3px 8px', cursor: 'pointer' }}>
            RETRY
          </button>
        </div>
      )}

      {scanState === 'done' && result && (
        <>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ border: '1px solid var(--green)', background: 'rgba(0,230,118,0.05)', padding: '6px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, color: 'var(--green)' }}>
              ◈ {buttonLabel}{buttonTitle}
            </div>
            <button onClick={runScan} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, padding: '6px 10px', cursor: 'pointer' }}>
              RESCAN
            </button>
          </div>

          <div style={{ background: '#141210', border: '1px solid rgba(0,230,118,0.25)', fontFamily: "'DM Mono', monospace", position: 'relative', overflow: 'hidden' }}>
            <style>{`@keyframes initialScan{0%{top:-2px;opacity:1}100%{top:100%;opacity:0}}.anathema-initial-scan{position:absolute;left:0;width:100%;height:2px;z-index:10;background:linear-gradient(90deg,transparent,#00e676,transparent);animation:initialScan 1.2s ease-out 1 forwards}`}</style>
            <div className="anathema-initial-scan" />

            {/* Header */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,230,118,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: 3 }}>◈ ANATHEMA · PATHOGEN ANALYSIS SYSTEM v1</div>
              <div style={{ fontSize: 9, color: '#444', letterSpacing: 1 }}>SPECIMEN: {agent.name.toUpperCase().slice(0, 20)}</div>
            </div>

            {/* Strain + Stage */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,230,118,0.1)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 6 }}>STRAIN DETECTED</div>
                <div style={{ fontSize: result.predicted_tree !== 'unknown' ? 22 : 16, color: result.predicted_tree !== 'unknown' ? 'var(--green)' : '#555', letterSpacing: 2, marginBottom: 8, fontFamily: "'Bebas Neue', sans-serif" }}>
                  {treeLabel}
                </div>
                {result.predicted_tree !== 'unknown' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 120, height: 4, background: '#1e1e1e', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${result.confidence}%`, background: 'linear-gradient(90deg, rgba(0,230,118,0.4), #00e676)', transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: 1 }}>{result.confidence}%</div>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 4 }}>INFECTION STAGE</div>
                <div style={{ fontSize: 28, color: result.predicted_tree !== 'unknown' ? 'var(--green)' : '#333', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, lineHeight: 1 }}>{stage?.roman || '—'}</div>
                <div style={{ fontSize: 8, color: '#555', letterSpacing: 2 }}>{stage?.label}</div>
              </div>
            </div>

            {/* Reasoning */}
            {result.reasoning && result.predicted_tree !== 'unknown' && (
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,230,118,0.1)', fontSize: 10, color: '#666', lineHeight: 1.6, letterSpacing: 0.3 }}>
                {result.reasoning}
              </div>
            )}

            {/* Pathogen Markers */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,230,118,0.1)' }}>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 10 }}>PATHOGEN MARKERS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(result.signals_used || []).map((sig, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#888', display: 'flex', gap: 8, lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span>
                    <span>{sig}</span>
                  </div>
                ))}
                {result.facebook_profile_url && (
                  <div style={{ fontSize: 10, color: '#555', display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ color: '#444', flexShrink: 0 }}>▸</span>
                    <a href={result.facebook_profile_url} target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                      Facebook profile located ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Chain Intelligence */}
            <ChainSection result={result} />

            {/* Field Observation Log */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,230,118,0.1)' }}>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 12 }}>
                FIELD OBSERVATION LOG
                {existing?.confirmed_tree && <span style={{ color: 'var(--green)', marginLeft: 8 }}>[OBSERVATION ON FILE]</span>}
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                {(['integrity', 'amerilife', 'sms', 'other'] as const).map(t => (
                  <button key={t} onClick={e => { e.stopPropagation(); setConfirmedTree(t === confirmedTree ? '' : t) }}
                    style={{ background: confirmedTree === t ? 'rgba(0,230,118,0.1)' : 'transparent', border: `1px solid ${confirmedTree === t ? 'var(--green)' : '#333'}`, color: confirmedTree === t ? 'var(--green)' : '#555', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, padding: '5px 10px', cursor: 'pointer', transition: 'all 0.1s', textTransform: 'uppercase' }}>
                    {t === 'integrity' ? 'INTEGRITY' : t === 'amerilife' ? 'AMERILIFE' : t === 'sms' ? 'SMS' : 'OTHER'}
                  </button>
                ))}
              </div>
              {confirmedTree === 'other' && (
                <input value={confirmedOther} onChange={e => setConfirmedOther(e.target.value)} onClick={e => e.stopPropagation()} placeholder="FMO name..."
                  style={{ display: 'block', width: '100%', background: '#0e0e0e', border: '1px solid #333', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '7px 10px', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }} />
              )}
              <input
                value={subImo}
                onChange={e => setSubImo(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder={result.predicted_sub_imo && (result.predicted_sub_imo_confidence ?? 0) >= 45 ? `Confirm or correct: ${result.predicted_sub_imo}` : 'Sub-IMO / affiliate (optional)...'}
                style={{ display: 'block', width: '100%', background: '#0e0e0e', border: `1px solid ${result.predicted_sub_imo && !subImo ? 'rgba(0,230,118,0.2)' : '#222'}`, color: '#888', fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '7px 10px', marginBottom: 6, outline: 'none', boxSizing: 'border-box' }}
              />
              <textarea value={recruiterNotes} onChange={e => setRecruiterNotes(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Field notes (optional)..." rows={2}
                style={{ display: 'block', width: '100%', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '7px 10px', marginBottom: 10, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              <button onClick={logObservation} disabled={saveState === 'saving'}
                style={{ background: saveState === 'saved' ? 'rgba(0,230,118,0.08)' : 'transparent', border: `1px solid ${saveState === 'saved' ? 'var(--green)' : '#333'}`, color: saveState === 'saved' ? 'var(--green)' : '#666', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 16px', cursor: saveState === 'saving' ? 'default' : 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                {saveState === 'saved' ? 'OBSERVATION LOGGED · SPECIMEN DATABASE UPDATED' : saveState === 'saving' ? 'LOGGING...' : existing?.confirmed_tree ? 'UPDATE OBSERVATION' : 'LOG OBSERVATION'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
