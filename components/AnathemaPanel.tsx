'use client'

import { useState, useEffect } from 'react'

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

type ScanResult = {
  predicted_tree: 'integrity' | 'amerilife' | 'sms' | 'unknown'
  confidence: number
  signals_used: string[]
  reasoning: string
  facebook_profile_url: string | null
  facebook_about: string | null
}

type SavedSpecimen = ScanResult & {
  confirmed_tree: string | null
  confirmed_tree_other: string | null
  confirmed_sub_imo: string | null
  recruiter_notes: string | null
}

const TREE_LABELS: Record<string, string> = {
  integrity: 'INTEGRITY',
  amerilife: 'AMERILIFE',
  sms: 'SMS',
  unknown: 'UNCLASSIFIED',
}

function getStage(confidence: number, tree: string): { roman: string; label: string } {
  if (tree === 'unknown' || confidence < 35) return { roman: '—', label: 'INDETERMINATE' }
  if (confidence >= 80) return { roman: 'IV', label: 'STAGE IV' }
  if (confidence >= 55) return { roman: 'III', label: 'STAGE III' }
  if (confidence >= 35) return { roman: 'II', label: 'STAGE II' }
  return { roman: 'I', label: 'STAGE I' }
}

export default function AnathemaPanel({ agent, city, state }: { agent: Agent; city: string; state: string }) {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [existing, setExisting] = useState<SavedSpecimen | null>(null)
  const [confirmedTree, setConfirmedTree] = useState<string>('')
  const [confirmedOther, setConfirmedOther] = useState('')
  const [subImo, setSubImo] = useState('')
  const [recruiterNotes, setRecruiterNotes] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [checkDone, setCheckDone] = useState(false)

  // On mount, check for existing specimen
  useEffect(() => {
    checkExisting()
  }, [])

  async function checkExisting() {
    try {
      const res = await fetch('/api/anathema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_existing',
          agent_name: agent.name,
          city,
          state,
        }),
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
        })
        setConfirmedTree(data.specimen.confirmed_tree || '')
        setConfirmedOther(data.specimen.confirmed_tree_other || '')
        setSubImo(data.specimen.confirmed_sub_imo || '')
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

    try {
      const res = await fetch('/api/anathema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: { ...agent, city, state } }),
      })
      const data = await res.json()
      setResult(data)
      setScanState('done')
    } catch {
      setScanState('idle')
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
          agent_name: agent.name,
          city,
          state,
          agent_website: agent.website,
          agent_address: agent.address,
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

  // Button label
  let buttonLabel = 'ANATHEMA SCAN'
  let buttonTitle = ''
  if (scanState === 'scanning') buttonLabel = 'SCANNING...'
  else if (scanState === 'done' && result) {
    buttonLabel = result.predicted_tree !== 'unknown'
      ? `STRAIN: ${treeLabel}`
      : 'STRAIN: UNCLASSIFIED'
    buttonTitle = existing ? ' [SPECIMEN ON FILE]' : ''
  }

  return (
    <div style={{ marginTop: 16 }} onClick={e => e.stopPropagation()}>
      {/* SCAN BUTTON */}
      {scanState === 'idle' && checkDone && (
        <button
          onClick={runScan}
          style={{
            background: 'transparent',
            border: '1px solid var(--green)',
            color: 'var(--green)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: 3,
            padding: '8px 20px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,230,118,0.07)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          ◈ ANATHEMA SCAN
        </button>
      )}

      {scanState === 'scanning' && (
        <div style={{
          border: '1px solid var(--green)',
          padding: '8px 20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, color: 'var(--green)' }}>
            SCANNING...
          </span>
          <style>{`
            @keyframes scanline {
              0% { top: 0; }
              100% { top: 100%; }
            }
            .anathema-scanline {
              position: absolute; left: 0; width: 100%; height: 2px;
              background: linear-gradient(90deg, transparent, #00e676, transparent);
              animation: scanline 1.2s linear infinite;
            }
          `}</style>
          <div className="anathema-scanline" />
        </div>
      )}

      {scanState === 'done' && result && (
        <>
          {/* Compact result badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              border: '1px solid var(--green)',
              background: 'rgba(0,230,118,0.05)',
              padding: '6px 14px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: 3,
              color: 'var(--green)',
            }}>
              ◈ {buttonLabel}{buttonTitle}
            </div>
            <button
              onClick={runScan}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: 2,
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              RESCAN
            </button>
          </div>

          {/* ANATHEMA PANEL */}
          <div style={{
            background: '#141210',
            border: '1px solid rgba(0,230,118,0.25)',
            fontFamily: "'DM Mono', monospace",
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Scan line animation on load */}
            <style>{`
              @keyframes initialScan {
                0% { top: -2px; opacity: 1; }
                100% { top: 100%; opacity: 0; }
              }
              .anathema-initial-scan {
                position: absolute; left: 0; width: 100%; height: 2px; z-index: 10;
                background: linear-gradient(90deg, transparent, #00e676, transparent);
                animation: initialScan 1.2s ease-out 1 forwards;
              }
            `}</style>
            <div className="anathema-initial-scan" />

            {/* Header */}
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(0,230,118,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: 3, textTransform: 'uppercase' }}>
                ◈ ANATHEMA · PATHOGEN ANALYSIS SYSTEM v1
              </div>
              <div style={{ fontSize: 9, color: '#444', letterSpacing: 1 }}>
                SPECIMEN: {agent.name.toUpperCase().slice(0, 20)}
              </div>
            </div>

            {/* Strain + Stage */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid rgba(0,230,118,0.1)',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 16,
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 6 }}>STRAIN DETECTED</div>
                <div style={{
                  fontSize: result.predicted_tree !== 'unknown' ? 22 : 16,
                  color: result.predicted_tree !== 'unknown' ? 'var(--green)' : '#555',
                  letterSpacing: 2,
                  marginBottom: 8,
                  fontFamily: "'Bebas Neue', sans-serif",
                }}>
                  {treeLabel}
                </div>
                {result.predicted_tree !== 'unknown' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Confidence bar */}
                    <div style={{ width: 120, height: 4, background: '#1e1e1e', position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${result.confidence}%`,
                        background: `linear-gradient(90deg, rgba(0,230,118,0.4), #00e676)`,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: 1 }}>
                      {result.confidence}%
                    </div>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 4 }}>INFECTION STAGE</div>
                <div style={{
                  fontSize: 28,
                  color: result.predicted_tree !== 'unknown' ? 'var(--green)' : '#333',
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: 2,
                  lineHeight: 1,
                }}>
                  {stage?.roman || '—'}
                </div>
                <div style={{ fontSize: 8, color: '#555', letterSpacing: 2 }}>{stage?.label}</div>
              </div>
            </div>

            {/* Reasoning */}
            {result.reasoning && result.predicted_tree !== 'unknown' && (
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid rgba(0,230,118,0.1)',
                fontSize: 10,
                color: '#666',
                lineHeight: 1.6,
                letterSpacing: 0.3,
              }}>
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
                    <a
                      href={result.facebook_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#555', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}
                    >
                      Facebook profile located ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Field Observation Log */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 12 }}>
                FIELD OBSERVATION LOG
                {existing?.confirmed_tree && (
                  <span style={{ color: 'var(--green)', marginLeft: 8 }}>[OBSERVATION ON FILE]</span>
                )}
              </div>

              {/* Tree selector */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                {(['integrity', 'amerilife', 'sms', 'other'] as const).map(t => (
                  <button
                    key={t}
                    onClick={e => { e.stopPropagation(); setConfirmedTree(t === confirmedTree ? '' : t) }}
                    style={{
                      background: confirmedTree === t ? 'rgba(0,230,118,0.1)' : 'transparent',
                      border: `1px solid ${confirmedTree === t ? 'var(--green)' : '#333'}`,
                      color: confirmedTree === t ? 'var(--green)' : '#555',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9,
                      letterSpacing: 2,
                      padding: '5px 10px',
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
                  onClick={e => e.stopPropagation()}
                  placeholder="FMO name..."
                  style={{
                    display: 'block',
                    width: '100%',
                    background: '#0e0e0e',
                    border: '1px solid #333',
                    color: 'var(--white)',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    padding: '7px 10px',
                    marginBottom: 8,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              )}

              <input
                value={subImo}
                onChange={e => setSubImo(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="Sub-IMO / affiliate (optional)..."
                style={{
                  display: 'block',
                  width: '100%',
                  background: '#0e0e0e',
                  border: '1px solid #222',
                  color: '#888',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  padding: '7px 10px',
                  marginBottom: 6,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <textarea
                value={recruiterNotes}
                onChange={e => setRecruiterNotes(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="Field notes (optional)..."
                rows={2}
                style={{
                  display: 'block',
                  width: '100%',
                  background: '#0e0e0e',
                  border: '1px solid #222',
                  color: '#888',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  padding: '7px 10px',
                  marginBottom: 10,
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />

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
                  padding: '8px 16px',
                  cursor: saveState === 'saving' ? 'default' : 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >
                {saveState === 'saved'
                  ? 'OBSERVATION LOGGED · SPECIMEN DATABASE UPDATED'
                  : saveState === 'saving'
                  ? 'LOGGING...'
                  : existing?.confirmed_tree
                  ? 'UPDATE OBSERVATION'
                  : 'LOG OBSERVATION'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
