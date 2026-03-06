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

import type { DavidFact } from '@/lib/domain/anathema/david-facts'

const LOADING_STEPS = [
  'Resolving agency identity',
  'Crawling website content',
  'Scoring carrier fingerprint',
  'Running affiliation search',
  'Locating Facebook profile',
  'Running affiliation analysis',
  'Generating affiliation report',
]

const STAGE_LOGS: Record<number, string[]> = {
  0: ['[OK] Agent name received', '[OK] Initializing affiliation scan'],
  1: ['[OK] Fetching website content', '[OK] Extracting visible text', '[FOUND] Website content indexed'],
  2: ['[OK] Checking carrier patterns', '[OK] Matching Integrity fingerprint', '[OK] Matching AmeriLife fingerprint', '[OK] Matching SMS fingerprint'],
  3: ['[OK] Querying affiliation directories', '[OK] Scanning partner indexes', '[FOUND] SERP intelligence compiled'],
  4: ['[OK] Searching for Facebook profile', '[OK] Probing profile content', '[FOUND] Social intelligence compiled'],
  5: ['[OK] Sending to ANATHEMA analysis engine', '[OK] Weighing affiliation markers...', '[OK] Calculating confidence stage...', '[OK] Assessing affiliation confidence...'],
  6: ['[OK] Compiling affiliation report', '[OK] Staging confirmed', '[OK] Report ready'],
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  FACEBOOK:      { label: 'FB',     color: '#4267B2' },
  YOUTUBE:       { label: 'YT',     color: '#cc2200' },
  GOOGLE_REVIEW: { label: 'REVIEW', color: 'var(--sig-yellow)' },
  SERP:          { label: 'WEB',    color: 'var(--text-2)' },
  WEBSITE:       { label: 'SITE',   color: 'var(--orange)' },
  LINKEDIN:      { label: 'LI',     color: '#0077B5' },
  OTHER:         { label: 'OTHER',  color: 'var(--text-2)' },
}

const TREE_COLOR: Record<string, string> = {
  integrity: 'var(--sig-green)',
  amerilife: '#2196f3',
  sms:       'var(--sig-yellow)',
  unknown:   'var(--text-3)',
}
const TREE_BORDER: Record<string, string> = {
  integrity: 'var(--sig-green-border)',
  amerilife: 'rgba(33,150,243,0.3)',
  sms:       'var(--sig-yellow-border)',
  unknown:   'var(--border)',
}
const TREE_DIM: Record<string, string> = {
  integrity: 'var(--sig-green-dim)',
  amerilife: 'rgba(33,150,243,0.07)',
  sms:       'var(--sig-yellow-dim)',
  unknown:   'transparent',
}

// ── DAVID Facts Panel ─────────────────────────────────────────────────────────

function DavidFactsPanel({ facts, agentName, deepScanStatus }: {
  facts: DavidFact[]
  agentName: string
  deepScanStatus?: 'idle' | 'polling' | 'complete' | 'timeout'
}) {
  const [showMed, setShowMed] = useState(false)
  const high    = facts.filter(f => f.usability === 'HIGH')
  const med     = facts.filter(f => f.usability === 'MED')
  const visible = showMed ? [...high, ...med] : high
  if (facts.length === 0) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '2px solid var(--orange)', borderRadius: 'var(--radius)', marginTop: 10, animation: 'slideIn 0.3s ease both' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', marginBottom: 2 }}>◈ DAVID — PERSONAL INTEL</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{high.length} high usability · {med.length} supporting · Use to personalize your opener</div>
          {deepScanStatus === 'polling' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', animation: 'blink 1s step-end infinite' }} />
              <span style={{ fontSize: 11, color: 'var(--orange)' }}>Deepening — pulling Facebook + YouTube · stay on page</span>
            </div>
          )}
          {deepScanStatus === 'complete' && (
            <div style={{ fontSize: 11, color: 'var(--sig-green)', marginTop: 5 }}>● Deep scan complete · facts updated</div>
          )}
        </div>
        {med.length > 0 && (
          <button onClick={() => setShowMed(v => !v)} className="btn-ghost" style={{ fontSize: 11 }}>
            {showMed ? 'Hide supporting' : `+${med.length} supporting`}
          </button>
        )}
      </div>
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>No high-usability facts found.{med.length > 0 ? ' Show supporting to see context.' : ''}</div>
        ) : visible.map((fact, i) => {
          const src = SOURCE_LABELS[fact.source] || SOURCE_LABELS.OTHER
          return (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', background: fact.usability === 'HIGH' ? 'var(--orange-dim)' : 'var(--bg)', borderLeft: `3px solid ${fact.usability === 'HIGH' ? 'var(--orange)' : 'var(--border)'}`, borderRadius: '0 var(--radius) var(--radius) 0', animation: `slideIn 0.2s ease ${i * 0.04}s both` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0, alignItems: 'center', paddingTop: 2 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '1px 5px', border: `1px solid ${src.color}40`, color: src.color, letterSpacing: 1, borderRadius: 2 }}>{src.label}</span>
                {fact.recency === 'RECENT' && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'var(--sig-green)', letterSpacing: 1 }}>RECENT</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6, marginBottom: fact.raw_quote ? 6 : 0 }}>{fact.fact}</div>
                {fact.raw_quote && (
                  <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, borderLeft: '2px solid var(--border)', paddingLeft: 10, fontStyle: 'italic' }}>
                    "{fact.raw_quote.slice(0, 140)}{fact.raw_quote.length > 140 ? '...' : ''}"
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {high.length > 0 && (
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)' }}>
          Opener tip — lead with a HIGH fact: "I was looking at your profile and noticed..."
        </div>
      )}
    </div>
  )
}

// ── Terminal Log ──────────────────────────────────────────────────────────────

function TerminalLog({ lines }: { lines: string[] }) {
  return (
    <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', padding: '16px', height: 200, overflowY: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5, lineHeight: 2, borderRadius: 'var(--radius)' }}>
      <div style={{ color: '#444', marginBottom: 4, fontSize: 10 }}>anathema@analysis:~$ ./scan</div>
      {lines.map((line, i) => (
        <div key={i} style={{ color: line.startsWith('[OK]') ? '#00e676' : line.startsWith('[WARN]') ? '#ff9800' : line.startsWith('[ALERT]') ? '#ff1744' : line.startsWith('[FOUND]') ? 'rgba(0,230,118,0.6)' : '#444', animation: 'slideIn 0.2s ease both' }}>{line}</div>
      ))}
      <div style={{ display: 'inline-block', width: 8, height: 12, background: '#00e676', animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function findSourceEvidence(entity: string, debugEntries: SerpDebugEntry[], directProofUrl?: string | null): { url: string; title: string } | null {
  if (directProofUrl) return { url: directProofUrl, title: 'View source ↗' }
  const entityLower = entity.toLowerCase()
  for (const entry of debugEntries) {
    for (const r of entry.results) {
      if (!r.url) continue
      if (`${r.title} ${r.snippet}`.toLowerCase().includes(entityLower)) return { url: r.url, title: r.title || 'View source' }
    }
  }
  return null
}

// ── Chain Signal Row ──────────────────────────────────────────────────────────

function ChainSignalRow({ signal, debugEntries }: { signal: ChainSignal; debugEntries?: SerpDebugEntry[] }) {
  const cfg      = TIER_CONFIG[signal.tier]
  const evidence = debugEntries ? findSourceEvidence(signal.entity, debugEntries) : null
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 12px', marginBottom: 4, background: signal.tier === 'HIGH' ? 'var(--sig-green-dim)' : 'var(--bg)', borderLeft: `2px solid ${signal.tier === 'HIGH' ? 'var(--sig-green)' : 'var(--border)'}`, borderRadius: '0 var(--radius) var(--radius) 0' }}>
      <span style={{ flexShrink: 0, marginTop: 2, fontFamily: "'DM Mono', monospace", fontSize: 8, color: cfg.color, border: `1px solid ${cfg.borderColor}`, padding: '1px 5px', letterSpacing: 1.5, lineHeight: 1.8 }}>{cfg.label}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5 }}>{signal.text}</div>
        {evidence && <a href={evidence.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 3, fontSize: 11, color: 'var(--sig-green)', textDecoration: 'none' }}>↗ {evidence.title.slice(0, 70)}</a>}
      </div>
    </div>
  )
}

// ── Chain Section ─────────────────────────────────────────────────────────────

function ChainSection({ result }: { result: ScanResult }) {
  const [expanded, setExpanded] = useState(false)
  const signals        = result.predicted_sub_imo_signals || []
  const grouped        = groupSignals(signals)
  const visibleSignals = [...grouped.high, ...grouped.med]
  const debugEntries   = result.serp_debug || undefined
  if (visibleSignals.length === 0 && !result.predicted_sub_imo && !result.unresolved_upline) return null
  const partnerEvidence = result.predicted_sub_imo && debugEntries ? findSourceEvidence(result.predicted_sub_imo, debugEntries, result.predicted_sub_imo_proof_url) : result.predicted_sub_imo_proof_url ? { url: result.predicted_sub_imo_proof_url, title: 'View source ↗' } : null
  return (
    <div style={{ padding: '18px 0', borderTop: '1px solid var(--border)', marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Upline Intelligence</div>
        {visibleSignals.length > 0 && (
          <button onClick={() => setExpanded(v => !v)} className="btn-ghost" style={{ fontSize: 11 }}>
            {expanded ? 'Collapse' : `Show all signals (${visibleSignals.length})`}
          </button>
        )}
      </div>
      {result.predicted_sub_imo && (result.predicted_sub_imo_confidence ?? 0) >= 45 && (
        <div style={{ marginBottom: visibleSignals.length > 0 ? 14 : 0, padding: '14px 16px', background: result.prediction_source === 'chain_resolver' ? 'var(--sig-green-dim)' : 'var(--bg)', border: `1px solid ${result.prediction_source === 'chain_resolver' ? 'var(--sig-green-border)' : 'var(--border)'}`, borderLeft: `3px solid ${result.prediction_source === 'chain_resolver' ? 'var(--sig-green)' : 'var(--border-strong)'}`, borderRadius: '0 var(--radius) var(--radius) 0' }}>
          <div style={{ fontSize: 11, color: result.prediction_source === 'chain_resolver' ? 'var(--sig-green)' : 'var(--text-3)', marginBottom: 6, fontWeight: 600 }}>{result.prediction_source === 'chain_resolver' ? '● UPLINE-SOURCED · THIS IS WHY WE KNOW' : 'PREDICTED SUB-IMO'}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: 'var(--sig-green)', letterSpacing: 2, marginBottom: partnerEvidence ? 8 : 0 }}>{result.predicted_sub_imo}</div>
          {partnerEvidence && <a href={partnerEvidence.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontSize: 12, color: 'var(--sig-green)', textDecoration: 'none', marginBottom: 8 }}>↗ {partnerEvidence.title.slice(0, 70)}</a>}
          {result.predicted_sub_imo_confidence != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <div style={{ width: 120, height: 4, background: 'var(--border)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${result.predicted_sub_imo_confidence}%`, background: 'var(--sig-green)', borderRadius: 2, transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--sig-green)', fontWeight: 600 }}>{result.predicted_sub_imo_confidence}%</span>
            </div>
          )}
        </div>
      )}
      {result.unresolved_upline && (
        <div style={{ marginBottom: visibleSignals.length > 0 ? 12 : 0, padding: '14px 16px', background: 'var(--sig-yellow-dim)', border: '1px solid var(--sig-yellow-border)', borderLeft: '3px solid var(--sig-yellow)', borderRadius: '0 var(--radius) var(--radius) 0' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 600 }}>UNRESOLVED UPLINE · NOT IN NETWORK MAP</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--sig-yellow)', letterSpacing: 2, marginBottom: 6 }}>{result.unresolved_upline}</div>
          {result.unresolved_upline_evidence && <div style={{ fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', marginBottom: 6, lineHeight: 1.6 }}>"{result.unresolved_upline_evidence}"</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {result.unresolved_upline_source_url && <a href={result.unresolved_upline_source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--sig-yellow)', textDecoration: 'none' }}>↗ View source</a>}
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{result.unresolved_upline_confidence} confidence</span>
          </div>
        </div>
      )}
      {visibleSignals.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: expanded ? 12 : 0, flexWrap: 'wrap' }}>
          {grouped.high.length > 0 && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 10px', border: `1px solid ${TIER_CONFIG.HIGH.borderColor}`, color: TIER_CONFIG.HIGH.color, letterSpacing: 1, borderRadius: 2 }}>{grouped.high.length} HIGH</div>}
          {grouped.med.length > 0  && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 10px', border: `1px solid ${TIER_CONFIG.MED.borderColor}`,  color: TIER_CONFIG.MED.color,  letterSpacing: 1, borderRadius: 2 }}>{grouped.med.length} MED</div>}
        </div>
      )}
      {expanded && visibleSignals.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {grouped.high.map((s, i) => <ChainSignalRow key={`h${i}`} signal={s} debugEntries={debugEntries} />)}
          {grouped.med.map((s, i)  => <ChainSignalRow key={`m${i}`} signal={s} debugEntries={debugEntries} />)}
        </div>
      )}
    </div>
  )
}

// ── Result Panel ──────────────────────────────────────────────────────────────

function ResultPanel({ result, agencyName, city, state, confirmedTrees, setConfirmedTrees, confirmedOther, setConfirmedOther, subImo, setSubImo, recruiterNotes, setRecruiterNotes, saveState, onSave, davidFacts, deepScanStatus }: {
  result: ScanResult; agencyName: string; city: string; state: string
  confirmedTrees: string[]; setConfirmedTrees: (v: string[]) => void
  confirmedOther: string; setConfirmedOther: (v: string) => void
  subImo: string; setSubImo: (v: string) => void
  recruiterNotes: string; setRecruiterNotes: (v: string) => void
  saveState: 'idle' | 'saving' | 'saved'; onSave: () => void
  davidFacts: DavidFact[] | null; deepScanStatus: 'idle' | 'polling' | 'complete' | 'timeout'
}) {
  // If user has confirmed a tree, show that — not the raw prediction
  const confirmedKey  = confirmedTrees.length > 0 && confirmedTrees[0] !== 'other' ? confirmedTrees[0] : null
  const displayTree   = confirmedKey || result.predicted_tree
  const isConfirmed   = confirmedTrees.length > 0
  const stage         = getStage(result.confidence, displayTree)
  const treeLabel     = confirmedKey
    ? (TREE_LABELS[confirmedKey] || confirmedKey.toUpperCase())
    : confirmedTrees.includes('other') && confirmedOther
    ? confirmedOther.toUpperCase()
    : TREE_LABELS[result.predicted_tree] || 'UNCLASSIFIED'
  const treeColor  = TREE_COLOR[displayTree]  || 'var(--text-3)'
  const treeBorder = TREE_BORDER[displayTree] || 'var(--border)'
  const treeDim    = TREE_DIM[displayTree]    || 'transparent'
  const isUnknown  = displayTree === 'unknown' && !isConfirmed

  return (
    <div style={{ animation: 'slideIn 0.3s ease both' }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, fontWeight: 500 }}>
        REPORT: {agencyName.toUpperCase()}{city ? ` · ${city.toUpperCase()}, ${state.toUpperCase()}` : ''}
      </div>

      {/* Verdict card */}
      <div style={{ background: 'var(--bg-card)', border: `1px solid ${treeBorder}`, borderLeft: `4px solid ${treeColor}`, borderRadius: 'var(--radius)', marginBottom: 10, overflow: 'hidden', boxShadow: '0 2px 8px var(--shadow-sm)' }}>

        {/* Verdict header */}
        <div style={{ padding: '20px 24px', background: isUnknown ? 'transparent' : treeDim, borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>Affiliation Detected</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isUnknown ? 28 : 44, color: treeColor, letterSpacing: 3, lineHeight: 1 }}>{treeLabel}</div>
              {isConfirmed && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--sig-green)', border: '1px solid var(--sig-green-border)', background: 'var(--sig-green-dim)', padding: '2px 8px', letterSpacing: 1, borderRadius: 3 }}>✓ CONFIRMED</span>}
              {!isConfirmed && result.predicted_tree !== 'unknown' && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', border: '1px solid var(--border)', padding: '2px 8px', letterSpacing: 1, borderRadius: 3 }}>PREDICTED</span>}
            </div>
            {!isUnknown && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 200, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${result.confidence}%`, background: treeColor, borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
                <span style={{ fontSize: 14, color: treeColor, fontWeight: 700 }}>{result.confidence}% confidence</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase' }}>Confidence Stage</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, color: isUnknown ? 'var(--text-4)' : treeColor, letterSpacing: 2, lineHeight: 1 }}>{stage?.roman || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>{stage?.label || 'INDETERMINATE'}</div>
          </div>
        </div>

        {/* Reasoning */}
        {result.reasoning && !isUnknown && (
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{result.reasoning}</div>
        )}

        {/* Affiliation signals */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' }}>Affiliation Signals</div>
          {(result.signals_used || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(result.signals_used || []).map((sig, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--text-1)', display: 'flex', gap: 10, lineHeight: 1.5 }}>
                  <span style={{ color: treeColor, flexShrink: 0 }}>▸</span><span>{sig}</span>
                </div>
              ))}
              {result.facebook_profile_url && (
                <div style={{ fontSize: 13, color: 'var(--text-1)', display: 'flex', gap: 10 }}>
                  <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>▸</span>
                  <a href={result.facebook_profile_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4267B2', textDecoration: 'none' }}>◈ Facebook profile located ↗</a>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>No strong markers detected.</div>
          )}
        </div>

        {/* Upline intel */}
        <div style={{ padding: '0 24px' }}><ChainSection result={result} /></div>

        {/* Field observation */}
        <div style={{ padding: '18px 24px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14 }}>Field Observation Log</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Confirm tree — select all that apply</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {(['integrity', 'amerilife', 'sms', 'other'] as const).map(t => {
              const active = confirmedTrees.includes(t)
              const c = TREE_COLOR[t] || 'var(--text-2)'
              const b = TREE_BORDER[t] || 'var(--border)'
              const d = TREE_DIM[t] || 'transparent'
              return (
                <button key={t} onClick={() => setConfirmedTrees(confirmedTrees.includes(t) ? confirmedTrees.filter(x => x !== t) : [...confirmedTrees, t])}
                  style={{ background: active ? d : 'transparent', border: `1px solid ${active ? c : 'var(--border-strong)'}`, color: active ? c : 'var(--text-2)', fontSize: 12, fontWeight: active ? 600 : 400, padding: '8px 16px', cursor: 'pointer', transition: 'all 0.12s', textTransform: 'uppercase', borderRadius: 'var(--radius)' }}>
                  {active && '✓ '}{t === 'integrity' ? 'Integrity' : t === 'amerilife' ? 'AmeriLife' : t === 'sms' ? 'SMS' : 'Other'}
                </button>
              )
            })}
          </div>
          {confirmedTrees.includes('other') && (
            <input value={confirmedOther} onChange={e => setConfirmedOther(e.target.value)} placeholder="FMO name..."
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '10px 14px', marginBottom: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: 13, outline: 'none', borderRadius: 'var(--radius)' }} />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <input value={subImo} onChange={e => setSubImo(e.target.value)}
              placeholder={result.predicted_sub_imo && (result.predicted_sub_imo_confidence ?? 0) >= 45 ? `Confirm: ${result.predicted_sub_imo}` : 'Sub-IMO / affiliate...'}
              style={{ padding: '10px 14px', fontSize: 13, background: 'var(--bg-card)', border: `1px solid ${result.predicted_sub_imo && !subImo ? 'var(--sig-green-border)' : 'var(--border)'}`, color: 'var(--text-1)', outline: 'none', borderRadius: 'var(--radius)' }} />
            <input value={recruiterNotes} onChange={e => setRecruiterNotes(e.target.value)} placeholder="Field notes..."
              style={{ padding: '10px 14px', fontSize: 13, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-1)', outline: 'none', borderRadius: 'var(--radius)' }} />
          </div>
          <button onClick={onSave} disabled={saveState === 'saving'}
            style={{ padding: '10px 22px', background: saveState === 'saved' ? 'var(--sig-green-dim)' : 'var(--bg-card)', border: `1px solid ${saveState === 'saved' ? 'var(--sig-green-border)' : 'var(--border-strong)'}`, color: saveState === 'saved' ? 'var(--sig-green)' : 'var(--text-1)', fontSize: 13, fontWeight: 600, cursor: saveState === 'saving' ? 'default' : 'pointer', transition: 'all 0.2s', borderRadius: 'var(--radius)' }}>
            {saveState === 'saved' ? '✓ Observation logged · click to update' : saveState === 'saving' ? 'Logging...' : 'Log observation'}
          </button>
        </div>
      </div>

      {/* DAVID */}
      {davidFacts && davidFacts.length > 0 && <DavidFactsPanel facts={davidFacts} agentName={agencyName} deepScanStatus={deepScanStatus} />}
      {davidFacts === null && (
        <div style={{ marginTop: 10, padding: '14px 20px', background: 'var(--bg-card)', border: '1px solid var(--orange-border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', marginBottom: 4 }}>◈ DAVID — PERSONAL INTEL</div>
          {deepScanStatus === 'polling' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', animation: 'blink 1s step-end infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--orange)' }}>Deepening — pulling Facebook + YouTube · stay on page</span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No personal facts extracted from this scan</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnathemaDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 40px', color: 'var(--text-3)', fontSize: 13 }}>Loading...</div>}>
      <AnathemaDashboardInner />
    </Suspense>
  )
}

function AnathemaDashboardInner() {
  const [agencyName, setAgencyName]         = useState('')
  const [website, setWebsite]               = useState('')
  const [city, setCity]                     = useState('')
  const [state, setState]                   = useState('')
  const [scanning, setScanning]             = useState(false)
  const [currentStep, setCurrentStep]       = useState(-1)
  const [logLines, setLogLines]             = useState<string[]>([])
  const [result, setResult]                 = useState<ScanResult | null>(null)
  const [error, setError]                   = useState('')
  const [confirmedTrees, setConfirmedTrees] = useState<string[]>([])
  const [confirmedOther, setConfirmedOther] = useState('')
  const [subImo, setSubImo]                 = useState('')
  const [recruiterNotes, setRecruiterNotes] = useState('')
  const [saveState, setSaveState]           = useState<'idle' | 'saving' | 'saved'>('idle')
  const [davidFacts, setDavidFacts]         = useState<DavidFact[] | null>(null)
  const [deepScanStatus, setDeepScanStatus] = useState<'idle' | 'polling' | 'complete' | 'timeout'>('idle')
  const [specimenId, setSpecimenId]         = useState<string | null>(null)
  const [specimens, setSpecimens]           = useState<any[]>([])
  const [specimenPage, setSpecimenPage]     = useState(0)
  const SPECIMENS_PER_PAGE = 5

  const timerRef     = useRef<NodeJS.Timeout | null>(null)
  const pollRef      = useRef<NodeJS.Timeout | null>(null)
  const resultRef    = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const name = searchParams.get('name')
    if (!name) return
    setAgencyName(decodeURIComponent(name))
    const c = searchParams.get('city'); const s = searchParams.get('state'); const u = searchParams.get('url')
    if (c) setCity(decodeURIComponent(c))
    if (s) setState(decodeURIComponent(s).toUpperCase().slice(0, 2))
    if (u) setWebsite(decodeURIComponent(u))
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) return
    async function loadScan() {
      const res = await fetch(`/api/anathema?id=${id}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.scan) {
        const s = data.scan
        setAgencyName(s.agent_name || ''); setWebsite(s.url || ''); setCity(s.city || ''); setState(s.state || '')
        if (s.analysis_json) setResult(s.analysis_json)
        if (s.confirmed_tree) setConfirmedTrees(Array.isArray(s.confirmed_tree) ? s.confirmed_tree : s.confirmed_tree ? [s.confirmed_tree] : [])
        if (s.confirmed_tree_other) setConfirmedOther(s.confirmed_tree_other)
        if (s.sub_imo) setSubImo(s.sub_imo)
        if (s.recruiter_notes) setRecruiterNotes(s.recruiter_notes)
        if (s.david_facts?.facts) setDavidFacts(s.david_facts.facts)
        setSaveState('saved')
      }
    }
    loadScan()
  }, [searchParams])

  useEffect(() => {
    fetch('/api/specimens').then(r => r.json()).then(d => setSpecimens(d.specimens || [])).catch(() => {})
  }, [])

  function addLog(line: string) { setLogLines(prev => [...prev.slice(-40), line]) }

  function startDeepPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    setDeepScanStatus('polling')
    const started = Date.now()
    pollRef.current = setInterval(async () => {
      if (Date.now() - started > 3 * 60 * 1000) { clearInterval(pollRef.current!); setDeepScanStatus('timeout'); return }
      try {
        const res = await fetch(`/api/anathema?id=${id}`); const data = await res.json()
        const facts = data.scan?.david_facts?.facts ?? null
        const sources: string[] = data.scan?.david_facts?.scan_sources_used || []
        if (sources.some((s: string) => s.startsWith('APIFY_')) && facts) {
          clearInterval(pollRef.current!); setDeepScanStatus('complete'); setDavidFacts(facts)
        }
      } catch {}
    }, 5000)
  }

  async function runScan() {
    if (!agencyName.trim() || scanning) return
    setScanning(true); setResult(null); setError(''); setLogLines([]); setCurrentStep(0); setDavidFacts(null); setDeepScanStatus('idle'); setSpecimenId(null)
    if (pollRef.current) clearInterval(pollRef.current)
    if (saveState !== 'saved') { setConfirmedTrees([]); setConfirmedOther(''); setSubImo(''); setRecruiterNotes('') }
    setSaveState('idle')
    let si = 0, li = 0
    function tick() {
      if (si >= LOADING_STEPS.length) return
      setCurrentStep(si)
      const stageLogs = STAGE_LOGS[si] || []
      if (li < stageLogs.length) { addLog(stageLogs[li]); li++; timerRef.current = setTimeout(tick, 260) }
      else { li = 0; si++; if (si < LOADING_STEPS.length) timerRef.current = setTimeout(tick, 320) }
    }
    tick()
    try {
      const res  = await fetch('/api/anathema', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: { name: agencyName.trim(), website: website.trim() || null, city: city.trim(), state: state.trim().toUpperCase(), address: city && state ? `${city}, ${state}` : '', carriers: [], notes: '', about: null } }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (timerRef.current) clearTimeout(timerRef.current)
      setCurrentStep(LOADING_STEPS.length - 1)
      const tree = TREE_LABELS[data.predicted_tree] || 'UNCLASSIFIED'
      addLog(`[OK] Scan complete — ${agencyName.trim()}`)
      addLog(data.predicted_tree !== 'unknown' ? `[FOUND] AFFILIATION: ${tree} — CONFIDENCE: ${data.confidence}%` : `[WARN] AFFILIATION: UNCLASSIFIED — Insufficient markers`)
      if (data.facebook_profile_url) addLog(`[FOUND] Facebook profile located`)
      if (data.predicted_sub_imo) addLog(`[FOUND] SUB-IMO: ${data.predicted_sub_imo} — ${data.predicted_sub_imo_confidence}% confidence`)
      else if (data.unresolved_upline) addLog(`[ALERT] UNRESOLVED UPLINE: ${data.unresolved_upline}`)
      const davidFactsList: DavidFact[] = data.david_facts?.facts || []
      if (davidFactsList.length > 0) addLog(`[FOUND] DAVID: ${davidFactsList.filter((f: DavidFact) => f.usability === 'HIGH').length} HIGH usability personal facts`)
      setResult(data); setSaveState('idle')
      if (data.predicted_sub_imo) setSubImo(data.predicted_sub_imo)
      if (davidFactsList.length > 0) {
        setDavidFacts(davidFactsList)
        const savedRes  = await fetch('/api/anathema', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save_david_facts', agent_name: agencyName.trim(), city: city.trim(), state: state.trim().toUpperCase(), david_facts: data.david_facts }) })
        const savedData = await savedRes.json().catch(() => ({}))
        if (savedData.id) { setSpecimenId(savedData.id); startDeepPolling(savedData.id) }
        else {
          setDeepScanStatus('polling')
          setTimeout(async () => {
            try {
              const checkRes  = await fetch('/api/anathema', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_existing', agent_name: agencyName.trim(), city: city.trim(), state: state.trim().toUpperCase() }) })
              const checkData = await checkRes.json()
              if (checkData.specimen?.id) { setSpecimenId(checkData.specimen.id); startDeepPolling(checkData.specimen.id) }
            } catch {}
          }, 3000)
        }
      } else if (data.facebook_profile_url) {
        setDeepScanStatus('polling')
        setTimeout(async () => {
          try {
            const checkRes  = await fetch('/api/anathema', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_existing', agent_name: agencyName.trim(), city: city.trim(), state: state.trim().toUpperCase() }) })
            const checkData = await checkRes.json()
            if (checkData.specimen?.id) { setSpecimenId(checkData.specimen.id); startDeepPolling(checkData.specimen.id) }
          } catch {}
        }, 3000)
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err: any) {
      if (timerRef.current) clearTimeout(timerRef.current)
      addLog(`[ALERT] Scan failed: ${err.message}`)
      setError(err.message || 'Scan failed. Please try again.')
    }
    setScanning(false); setCurrentStep(-1)
  }

  async function logObservation() {
    if (!result || saveState === 'saving') return
    setSaveState('saving')
    try {
      const res = await fetch('/api/anathema', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'log_observation', agent_name: agencyName.trim(), city: city.trim(), state: state.trim().toUpperCase(), agent_website: website.trim() || null, agent_address: city && state ? `${city}, ${state}` : '', predicted_tree: result.predicted_tree, predicted_confidence: result.confidence, prediction_signals: result.signals_used, prediction_reasoning: result.reasoning, prediction_source: result.prediction_source || null, facebook_profile_url: result.facebook_profile_url, facebook_about: result.facebook_about, predicted_sub_imo: result.predicted_sub_imo || null, predicted_sub_imo_confidence: result.predicted_sub_imo_confidence || null, predicted_sub_imo_signals: result.predicted_sub_imo_signals || [], predicted_sub_imo_partner_id: result.predicted_sub_imo_partner_id || null, predicted_sub_imo_proof_url: result.predicted_sub_imo_proof_url || null, serp_debug: result.serp_debug || null, unresolved_upline: result.unresolved_upline || null, unresolved_upline_evidence: result.unresolved_upline_evidence || null, unresolved_upline_source_url: result.unresolved_upline_source_url || null, unresolved_upline_confidence: result.unresolved_upline_confidence || null, confirmed_tree: confirmedTrees.length === 1 ? confirmedTrees[0] : confirmedTrees.length > 1 ? confirmedTrees.join(',') : null, confirmed_tree_other: confirmedOther || null, confirmed_sub_imo: subImo || null, recruiter_notes: recruiterNotes || null, david_facts: davidFacts ? { facts: davidFacts } : null }) })
      const data = await res.json()
      if (!res.ok || !data.ok) { setSaveState('idle'); setError('Failed to save. Please try again.'); return }
      setSaveState('saved')
      fetch('/api/specimens').then(r => r.json()).then(d => setSpecimens(d.specimens || [])).catch(() => {})
    } catch { setSaveState('idle'); setError('Failed to save. Please try again.') }
  }

  async function loadSpecimen(s: any) {
    setAgencyName(s.agent_name || ''); setWebsite(s.agent_website || ''); setCity(s.city || ''); setState(s.state || '')
    setError(''); setLogLines([])
    const trees = s.confirmed_tree ? s.confirmed_tree.split(',').map((t: string) => t.trim()) : []
    setConfirmedTrees(trees)
    setConfirmedOther(s.confirmed_tree_other || ''); setSubImo(s.confirmed_sub_imo || ''); setRecruiterNotes(s.recruiter_notes || ''); setSaveState('saved'); setDavidFacts(null)

    // Build a synthetic result immediately from list data so the card renders
    // even if the full scan record has no analysis_json
    const syntheticResult = {
      predicted_tree: s.predicted_tree || 'unknown',
      confidence: s.predicted_confidence || 0,
      signals_used: [],
      reasoning: '',
      facebook_profile_url: null,
      facebook_about: null,
      predicted_sub_imo: s.confirmed_sub_imo || null,
      predicted_sub_imo_confidence: null,
      predicted_sub_imo_signals: [],
      predicted_sub_imo_partner_id: null,
      predicted_sub_imo_proof_url: null,
      prediction_source: null,
      serp_debug: null,
      unresolved_upline: null,
      unresolved_upline_evidence: null,
      unresolved_upline_source_url: null,
      unresolved_upline_confidence: null,
    }
    setResult(syntheticResult)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      const res = await fetch(`/api/anathema?id=${s.id}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.scan?.analysis_json) {
        setResult(data.scan.analysis_json)
        if (data.scan.analysis_json.predicted_sub_imo && !s.confirmed_sub_imo) setSubImo(data.scan.analysis_json.predicted_sub_imo)
        if (data.scan.david_facts?.facts) setDavidFacts(data.scan.david_facts.facts)
      }
      // Re-apply confirmed fields from the saved scan
      if (data.scan?.confirmed_tree) {
        setConfirmedTrees(Array.isArray(data.scan.confirmed_tree)
          ? data.scan.confirmed_tree
          : data.scan.confirmed_tree.split(',').map((t: string) => t.trim()))
      }
      if (data.scan?.confirmed_tree_other) setConfirmedOther(data.scan.confirmed_tree_other)
      if (data.scan?.sub_imo) setSubImo(data.scan.sub_imo)
      if (data.scan?.recruiter_notes) setRecruiterNotes(data.scan.recruiter_notes)
    } catch {}
  }

  const showTwoCol = !!(result || scanning)

  return (
    <div style={{ padding: '40px 40px', maxWidth: 1400 }}>
      <style>{`
        @keyframes slideIn   { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadSlide { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes blink     { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes scanDown  { 0% { top: 0; opacity: 0.8; } 100% { top: 100%; opacity: 0; } }
        @keyframes betaSweep { 0% { transform: translateX(-100%); } 60%,100% { transform: translateX(100%); } }
        .detail-scroll::-webkit-scrollbar { width: 3px; }
        .detail-scroll::-webkit-scrollbar-thumb { background: var(--border-strong); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="page-eyebrow">Relationship Analysis System</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--text-1)', lineHeight: 0.9 }}>
            ANATHEMA<span style={{ color: 'var(--sig-green)' }}>.</span>
          </h1>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: 'var(--sig-green)', border: '1px solid var(--sig-green-border)', background: 'var(--sig-green-dim)', padding: '5px 10px', marginBottom: 8, position: 'relative', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(26,158,92,0.18), transparent)', animation: 'betaSweep 3s ease-in-out infinite' }} />
            ⚡ BETA
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showTwoCol ? '380px 1fr' : '1fr', gap: 0, alignItems: 'start', isolation: 'isolate' }}>

        {/* LEFT */}
        <div style={{ width: showTwoCol ? 380 : '100%', flexShrink: 0, paddingRight: showTwoCol ? 28 : 0, borderRight: showTwoCol ? '1px solid var(--border)' : 'none', overflow: 'hidden' }}>

          {/* Scan input */}
          <div style={{ display: 'flex', gap: 0, border: `1.5px solid ${scanning ? 'var(--sig-green)' : 'var(--border-strong)'}`, background: 'var(--bg-card)', marginBottom: 6, transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: scanning ? '0 0 0 3px var(--sig-green-dim)' : '0 2px 6px var(--shadow-sm)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <input value={agencyName} onChange={e => setAgencyName(e.target.value)} onKeyDown={e => e.key === 'Enter' && runScan()} placeholder="Agency or agent name" disabled={scanning}
              style={{ flex: 1, padding: '16px 20px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: 15 }} />
            <button onClick={runScan} disabled={scanning || !agencyName.trim()}
              style={{ padding: '14px 24px', background: scanning ? 'var(--sig-green-dim)' : 'var(--sig-green)', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3, color: scanning ? 'var(--sig-green)' : 'white', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {scanning ? 'SCANNING...' : '◈ SCAN'}
            </button>
          </div>

          {/* Optional fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
            {[
              { value: website, set: setWebsite,                                                   ph: 'Website (optional)' },
              { value: city,    set: setCity,                                                       ph: 'City' },
              { value: state,   set: (v: string) => setState(v.toUpperCase().slice(0, 2)), ph: 'State' },
            ].map((f, i) => (
              <input key={i} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} disabled={scanning}
                style={{ padding: '10px 14px', fontSize: 13, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', outline: 'none', borderRadius: 'var(--radius)' }} />
            ))}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 20 }}>Website + location optional but improve signal quality</div>

          {/* Loading steps */}
          {scanning && currentStep >= 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 16, borderRadius: 1 }}>
                <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--sig-green)', animation: 'loadSlide 1s ease-in-out infinite' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {LOADING_STEPS.map((step, i) => (
                  <div key={step} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, color: i < currentStep ? 'var(--sig-green)' : i === currentStep ? 'var(--text-1)' : 'var(--text-4)', transition: 'color 0.3s' }}>
                    <span style={{ color: i < currentStep ? 'var(--sig-green)' : i === currentStep ? 'var(--orange)' : 'var(--text-4)', fontSize: 9, flexShrink: 0 }}>{i < currentStep ? '●' : i === currentStep ? '◐' : '○'}</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 16px', border: '1px solid var(--sig-red-border)', background: 'var(--sig-red-dim)', color: 'var(--sig-red)', fontSize: 13, marginBottom: 16, borderRadius: 'var(--radius)' }}>{error}</div>
          )}

          {result && !scanning && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              <button onClick={() => { setResult(null); setAgencyName(''); setWebsite(''); setCity(''); setState(''); setDavidFacts(null); setConfirmedTrees([]); setConfirmedOther(''); setSubImo(''); setRecruiterNotes(''); setSaveState('idle'); setError('') }} className="btn-ghost" style={{ fontSize: 12 }}>← History</button>
              <button onClick={() => { setConfirmedTrees([]); setConfirmedOther(''); setSubImo(''); setRecruiterNotes(''); setSaveState('idle'); runScan() }} className="btn-ghost" style={{ fontSize: 12 }}>↺ Rescan</button>
              <button onClick={() => { setResult(null); setAgencyName(''); setWebsite(''); setCity(''); setState(''); setDavidFacts(null); setConfirmedTrees([]); setConfirmedOther(''); setSubImo(''); setRecruiterNotes(''); setSaveState('idle'); setError('') }} className="btn-ghost" style={{ fontSize: 12 }}>New scan</button>
            </div>
          )}

          {/* Empty state */}
          {!scanning && !result && (
            <div style={{ marginTop: 8 }}>
              {specimens.length > 0 && (
                <div style={{ marginBottom: 36 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Recent scans</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{specimenPage * SPECIMENS_PER_PAGE + 1}–{Math.min((specimenPage + 1) * SPECIMENS_PER_PAGE, specimens.length)} of {specimens.length}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {specimens.slice(specimenPage * SPECIMENS_PER_PAGE, (specimenPage + 1) * SPECIMENS_PER_PAGE).map((s: any) => {
                      const tree = TREE_LABELS[s.predicted_tree] || 'Unclassified'
                      const tc   = TREE_COLOR[s.predicted_tree]  || 'var(--text-3)'
                      return (
                        <button key={s.id} onClick={() => loadSpecimen(s)}
                          style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s', borderRadius: 'var(--radius)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{s.agent_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{[s.city, s.state].filter(Boolean).join(', ')}{s.confirmed_sub_imo && <span style={{ color: 'var(--text-2)' }}> · {s.confirmed_sub_imo}</span>}</div>
                          </div>
                          <div style={{ fontSize: 12, color: tc, fontWeight: 600 }}>{tree}</div>
                          <div style={{ fontSize: 12 }}>{s.confirmed_tree ? <span style={{ color: 'var(--sig-green)' }}>✓</span> : s.predicted_confidence ? <span style={{ color: 'var(--text-3)' }}>{s.predicted_confidence}%</span> : <span style={{ color: 'var(--text-4)' }}>—</span>}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </button>
                      )
                    })}
                  </div>
                  {specimens.length > SPECIMENS_PER_PAGE && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      <button onClick={() => setSpecimenPage(p => Math.max(0, p - 1))} disabled={specimenPage === 0} className="btn-ghost" style={{ flex: 1, fontSize: 12, opacity: specimenPage === 0 ? 0.4 : 1 }}>← Prev</button>
                      <button onClick={() => setSpecimenPage(p => Math.min(Math.ceil(specimens.length / SPECIMENS_PER_PAGE) - 1, p + 1))} disabled={(specimenPage + 1) * SPECIMENS_PER_PAGE >= specimens.length} className="btn-ghost" style={{ flex: 1, fontSize: 12, opacity: (specimenPage + 1) * SPECIMENS_PER_PAGE >= specimens.length ? 0.4 : 1 }}>Next →</button>
                    </div>
                  )}
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>What Anathema detects</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[
                  { n: '01', title: 'Carrier analysis',     tip: 'Identifies which carriers an agent is actively writing with — a strong indicator of how they operate and where their loyalties are.' },
                  { n: '02', title: 'Language patterns',     tip: "Scans the agent's own words — website copy, bios, job posts — for affiliation signals they didn't know they were broadcasting." },
                  { n: '03', title: 'Web intelligence',      tip: 'Cross-references the agency across public directories, partner pages, and indexed content to build an affiliation picture.' },
                  { n: '04', title: 'Social presence scan',  tip: "Facebook and YouTube reveal what agents won't say on a call — trip photos, events, and brand associations tell the real story." },
                  { n: '05', title: 'Confidence staging',    tip: 'Results are staged I through IV based on signal strength. STAGE I means early indicators. STAGE IV means confirmed affiliation.' },
                  { n: '06', title: 'Personal intel',        tip: 'Surfaces personal facts — hobbies, family, recent milestones — so you can open a conversation that feels like research, not a cold call.' },
                ].map(c => (
                  <div key={c.n} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius)', transition: 'border-color 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--sig-green-border)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--sig-green)', letterSpacing: 2, marginBottom: 6 }}>{c.n}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 5 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{c.tip}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        {showTwoCol && (
          <div ref={resultRef} className="detail-scroll" style={{ paddingLeft: 28, maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', position: 'sticky', top: 0, alignSelf: 'start' }}>
            {scanning && !result && (
              <div style={{ paddingTop: 40 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: 1, marginBottom: 16 }}>ANALYZING · {agencyName.slice(0, 36).toUpperCase()}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--sig-green)', letterSpacing: 2, lineHeight: 1.1, marginBottom: 28, minHeight: 40 }}>{currentStep >= 0 ? LOADING_STEPS[currentStep] : ''}</div>
                <TerminalLog lines={logLines} />
              </div>
            )}
            {result && !scanning && (
              <ResultPanel result={result} agencyName={agencyName} city={city} state={state}
                confirmedTrees={confirmedTrees} setConfirmedTrees={setConfirmedTrees}
                confirmedOther={confirmedOther} setConfirmedOther={setConfirmedOther}
                subImo={subImo} setSubImo={setSubImo}
                recruiterNotes={recruiterNotes} setRecruiterNotes={setRecruiterNotes}
                saveState={saveState} onSave={logObservation}
                davidFacts={davidFacts} deepScanStatus={deepScanStatus} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
