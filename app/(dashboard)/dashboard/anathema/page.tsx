'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { AgentProfile, PersonalHook, AffiliationSignal } from '@/lib/domain/anathema/analyzer'
import type { AgentSerpDebugEntry } from '@/lib/domain/anathema/serp'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  'Resolving agency identity',
  'Crawling website content',
  'Scanning public record',
  'Searching social presence',
  'Pulling production signals',
  'Analyzing community presence',
  'Building intel brief',
]

const STAGE_LOGS: Record<number, string[]> = {
  0: ['[OK] Agent record received', '[OK] Resolving identity'],
  1: ['[OK] Fetching homepage', '[OK] Crawling about + team pages', '[FOUND] Website intel extracted'],
  2: ['[OK] Querying reputation sources', '[OK] Scanning professional record', '[FOUND] Public record compiled'],
  3: ['[OK] Searching Facebook', '[OK] Searching YouTube', '[FOUND] Social presence located'],
  4: ['[OK] Scanning awards + rankings', '[OK] Checking credentials', '[FOUND] Production signals extracted'],
  5: ['[OK] Pulling local presence', '[OK] Scanning press mentions', '[FOUND] Community data compiled'],
  6: ['[OK] Sending to analysis engine', '[OK] Extracting facts...', '[OK] Building intel brief...', '[OK] Profile ready'],
}

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  FACEBOOK: { label: 'FB',     color: '#4267B2' },
  YOUTUBE:  { label: 'YT',     color: '#cc2200' },
  SERP:     { label: 'WEB',    color: 'var(--text-3)' },
  WEBSITE:  { label: 'SITE',   color: 'var(--sig-green)' },
  OTHER:    { label: 'OTHER',  color: 'var(--text-3)' },
}

const TREE_DISPLAY: Record<string, { label: string; color: string; border: string; dim: string }> = {
  integrity: { label: 'INTEGRITY MARKETING GROUP', color: 'var(--sig-green)',  border: 'var(--sig-green-border)',       dim: 'var(--sig-green-dim)' },
  amerilife: { label: 'AMERILIFE',                 color: '#2196f3',           border: 'rgba(33,150,243,0.3)',          dim: 'rgba(33,150,243,0.07)' },
  sms:       { label: 'SENIOR MARKET SALES',       color: 'var(--sig-yellow)', border: 'var(--sig-yellow-border)',      dim: 'var(--sig-yellow-dim)' },
}

const SERP_KEY_LABELS: Record<string, string> = {
  reputation:  'REPUTATION',
  community:   'COMMUNITY',
  professional:'PROFESSIONAL',
  social:      'SOCIAL',
  career:      'CAREER',
  production:  'PRODUCTION',
  press:       'PRESS',
  recruiting:  'RECRUITING',
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function TerminalLog({ lines }: { lines: string[] }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px', height: 200, overflowY: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5, lineHeight: 2 }}>
      <div style={{ color: 'var(--text-2)', marginBottom: 4, fontSize: 10 }}>anathema@intel:~$ ./scan</div>
      {lines.map((line, i) => (
        <div key={i} style={{ color: line.startsWith('[OK]') ? 'var(--sig-green)' : line.startsWith('[FOUND]') ? 'var(--orange)' : line.startsWith('[ALERT]') ? 'var(--sig-red)' : 'var(--text-4)' }}>
          {line}
        </div>
      ))}
      <div style={{ display: 'inline-block', width: 8, height: 12, background: 'var(--orange)', animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const map = {
    HIGH:   { color: 'var(--sig-green)',  label: '● HIGH CONFIDENCE'   },
    MEDIUM: { color: 'var(--sig-yellow)', label: '◐ MEDIUM CONFIDENCE' },
    LOW:    { color: 'var(--text-3)',     label: '○ LOW CONFIDENCE'    },
  }
  const { color, label } = map[confidence]
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 10px', border: `1px solid ${color}`, color, letterSpacing: 1 }}>
      {label}
    </div>
  )
}

function Tags({ label, items, color }: { label: string; items: string[]; color?: string }) {
  const filtered = (items || []).filter(Boolean)
  if (!filtered.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 16, marginBottom: 14, alignItems: 'start' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: 1, paddingTop: 5 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {filtered.map((item, i) => (
          <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '3px 10px', border: `1px solid ${color || 'var(--border)'}`, color: color || 'var(--text-1)', letterSpacing: 0.5 }}>{item}</span>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === 'Not found in scan' || value === 'Not found') return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 16, marginBottom: 14, alignItems: 'start' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: 1, paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6 }}>{value}</div>
    </div>
  )
}

// ─── PERSONAL HOOKS (was DAVID) ───────────────────────────────────────────────

function HooksSection({ hooks }: { hooks: PersonalHook[] }) {
  const [showMed, setShowMed] = useState(false)
  const high    = hooks.filter(h => h.usability === 'HIGH')
  const med     = hooks.filter(h => h.usability === 'MED')
  const visible = showMed ? [...high, ...med] : high

  if (hooks.length === 0) return (
    <div style={{ padding: '20px 0', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-4)' }}>
      NO PERSONAL HOOKS FOUND — public record too sparse for outreach intelligence
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: 1 }}>
          {high.length} HIGH USABILITY · {med.length} SUPPORTING
        </div>
        {med.length > 0 && (
          <button onClick={() => setShowMed(v => !v)}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '4px 10px', cursor: 'pointer' }}>
            {showMed ? 'HIDE SUPPORTING ▲' : `+${med.length} SUPPORTING ▼`}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((hook, i) => {
          const src = SOURCE_CONFIG[hook.source] || SOURCE_CONFIG.OTHER
          return (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: hook.usability === 'HIGH' ? 'rgba(255,85,0,0.05)' : 'var(--bg)', border: `1px solid ${hook.usability === 'HIGH' ? 'rgba(255,85,0,0.25)' : 'var(--border)'}`, borderLeft: `3px solid ${hook.usability === 'HIGH' ? 'var(--orange)' : 'var(--border)'}`, animation: `slideIn 0.2s ease ${i * 0.04}s both` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0, alignItems: 'center', paddingTop: 2 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '1px 5px', border: `1px solid ${src.color}40`, color: src.color, letterSpacing: 1 }}>{src.label}</span>
                {hook.recency === 'RECENT' && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'var(--sig-green)', letterSpacing: 1 }}>RECENT</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6, marginBottom: hook.raw_quote ? 6 : 0 }}>{hook.fact}</div>
                {hook.raw_quote && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5, borderLeft: '2px solid var(--border)', paddingLeft: 10, fontStyle: 'italic' }}>
                    &ldquo;{hook.raw_quote.slice(0, 150)}{hook.raw_quote.length > 150 ? '...' : ''}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {high.length > 0 && (
        <div style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-4)', letterSpacing: 0.5 }}>
          OPENER TIP — lead with a HIGH fact: &ldquo;I was looking at your profile and noticed...&rdquo;
        </div>
      )}
    </div>
  )
}

// ─── AFFILIATION SIGNAL CARD ──────────────────────────────────────────────────

function AffiliationCard({ signal }: { signal: AffiliationSignal }) {
  const t = TREE_DISPLAY[signal.tree]
  return (
    <div style={{ padding: '20px 24px', background: `${t.dim}`, border: `1px solid ${t.border}`, borderLeft: `4px solid ${t.color}`, animation: 'slideIn 0.3s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: t.color, letterSpacing: 2 }}>⚑ AFFILIATION SIGNAL DETECTED</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '2px 8px', border: `1px solid ${t.border}`, color: 'var(--text-3)', letterSpacing: 1 }}>
          FROM {signal.source.toUpperCase()}
        </span>
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: t.color, letterSpacing: 2, marginBottom: 12 }}>
        {t.label}
      </div>
      <div style={{ padding: '10px 14px', background: 'var(--bg)', borderLeft: `2px solid ${t.border}`, marginBottom: 12 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--text-4)', letterSpacing: 2, marginBottom: 4 }}>MATCHED PHRASE</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: t.color, letterSpacing: 1 }}>&ldquo;{signal.matched_phrase}&rdquo;</div>
      </div>
      {signal.context && (
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 10 }}>
          ...{signal.context}...
        </div>
      )}
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-4)', letterSpacing: 0.5, lineHeight: 1.8 }}>
        Explicit brand language found in verified evidence. This is not a prediction — this exact phrase appears in their public record.
      </div>
    </div>
  )
}

// ─── SERP DEBUG ENTRY ─────────────────────────────────────────────────────────

function SerpEntry({ entry, agentName }: { entry: AgentSerpDebugEntry; agentName: string }) {
  const [open, setOpen] = useState(false)
  const hasResults = (entry.results || []).length > 0
  const label = SERP_KEY_LABELS[entry.key] || entry.key.toUpperCase()

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: hasResults ? 'var(--sig-green)' : 'var(--text-4)', minWidth: 16 }}>{hasResults ? '●' : '○'}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', minWidth: 140 }}>{label}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.query}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: hasResults ? 'var(--sig-green)' : 'var(--text-4)', minWidth: 80, textAlign: 'right' }}>
          {entry.results.length} results
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hasResults ? entry.results.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: 10 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--sig-green)', paddingTop: 2 }}>◈</span>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 3, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>{r.title}</span>
                  {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 12, color: 'var(--orange)', textDecoration: 'none' }}>↗</a>}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6 }}>{r.snippet}</div>
              </div>
            </div>
          )) : (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-4)' }}>
              {(entry.signals_fired || []).join(' · ') || 'No results'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── RESULT CARD ──────────────────────────────────────────────────────────────

function ResultCard({
  profile, affiliationSignal, agentName, city, state,
  recruiterNotes, setRecruiterNotes, saveState, onSave,
}: {
  profile: AgentProfile
  affiliationSignal: AffiliationSignal | null
  agentName: string
  city: string
  state: string
  recruiterNotes: string
  setRecruiterNotes: (v: string) => void
  saveState: 'idle' | 'saving' | 'saved'
  onSave: () => void
}) {
  const [activeTab, setActiveTab] = useState<'brief' | 'hooks' | 'community' | 'recruiting' | 'career' | 'sources'>('brief')

  const hasProduction = (profile.production.awards.length + profile.production.recognitions.length + profile.production.credentials.length) > 0
  const hasHooks      = profile.personal_hooks.length > 0
  const hasCommunity  = (profile.community.local_ties.length + profile.community.press_mentions.length) > 0 || profile.community.reputation_notes
  const hasCareer     = profile.career.background || profile.career.notable_history.length > 0

  const TABS = [
    { key: 'brief',      label: 'INTEL BRIEF' },
    { key: 'hooks',      label: `PERSONAL HOOKS${hasHooks ? ` (${profile.personal_hooks.filter(h => h.usability === 'HIGH').length} HIGH)` : ''}` },
    { key: 'community',  label: 'COMMUNITY' },
    { key: 'recruiting', label: profile.recruiting.actively_recruiting ? '● RECRUITING' : 'RECRUITING' },
    { key: 'career',     label: 'CAREER' },
    { key: 'sources',    label: 'SOURCES' },
  ] as const

  return (
    <div style={{ animation: 'slideIn 0.3s ease both' }}>

      {/* Identity header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--text-1)', letterSpacing: 2, lineHeight: 1 }}>
            {profile.display_name || agentName}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: 1, marginTop: 5, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {city && state && <span>{city.toUpperCase()}, {state.toUpperCase()}</span>}
            {profile.owner_name && <span>· {profile.owner_name}</span>}
            {profile.years_in_business && <span>· {profile.years_in_business}</span>}
            {profile.website && <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'none' }}>· {profile.website} ↗</a>}
            {profile.facebook_profile_url && <a href={profile.facebook_profile_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4267B2', textDecoration: 'none' }}>· Facebook ↗</a>}
          </div>
        </div>
        <ConfidenceBadge confidence={profile.data_confidence} />
      </div>

      {/* Overview */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--sig-green)', padding: '20px 28px', marginBottom: 2 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 10 }}>OVERVIEW</div>
        <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.7, margin: 0 }}>{profile.overview}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 2, marginTop: 2, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <div key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: '10px 16px', background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent', border: `1px solid ${activeTab === tab.key ? 'var(--sig-green)' : 'var(--border)'}`, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: activeTab === tab.key ? 600 : 400, letterSpacing: 0.5, cursor: 'pointer', color: activeTab === tab.key ? 'var(--sig-green)' : tab.key === 'recruiting' && profile.recruiting.actively_recruiting ? 'var(--sig-green)' : 'var(--text-2)', transition: 'all 0.15s', whiteSpace: 'nowrap', borderRadius: 'var(--radius)' }}>
            {tab.label}
          </div>
        ))}
      </div>

      {/* ── INTEL BRIEF ── */}
      {activeTab === 'brief' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 20 }}>INTEL BRIEF</div>

          {/* Production highlight */}
          {hasProduction && (
            <div style={{ marginBottom: 20, padding: '16px 20px', background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--sig-green)', letterSpacing: 2, marginBottom: 10 }}>PRODUCTION RECORD</div>
              {profile.production.awards.length > 0 && <Tags label="Awards" items={profile.production.awards} color="var(--sig-green)" />}
              {profile.production.recognitions.length > 0 && <Tags label="Recognitions" items={profile.production.recognitions} />}
              {profile.production.credentials.length > 0 && <Tags label="Credentials" items={profile.production.credentials} />}
            </div>
          )}

          {/* Recruiting status */}
          <div style={{ marginBottom: 20, padding: '14px 18px', background: profile.recruiting.actively_recruiting ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${profile.recruiting.actively_recruiting ? 'var(--sig-green-border)' : 'var(--border)'}` }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: profile.recruiting.actively_recruiting ? 'var(--sig-green)' : 'var(--text-4)' }}>
              {profile.recruiting.actively_recruiting ? '● Actively building a downline' : '○ No active recruiting signals'}
            </span>
          </div>

          {/* Community snapshot */}
          {hasCommunity && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 10 }}>COMMUNITY PRESENCE</div>
              {profile.community.local_ties.slice(0, 3).map((tie, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: 'var(--orange)', flexShrink: 0, fontSize: 10, marginTop: 3 }}>→</span>
                  <span style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{tie}</span>
                </div>
              ))}
            </div>
          )}

          <Row label="Confidence Note" value={profile.confidence_note} />
          <Row label="Pages Crawled"   value={profile.pages_crawled.join(', ') || null} />

          {/* Affiliation signal card — last, visually distinct */}
          {affiliationSignal && (
            <div style={{ marginTop: 24 }}>
              <AffiliationCard signal={affiliationSignal} />
            </div>
          )}
        </div>
      )}

      {/* ── PERSONAL HOOKS ── */}
      {activeTab === 'hooks' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 4 }}>PERSONAL HOOKS</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-4)', letterSpacing: 0.5, marginBottom: 20 }}>
            Facts to open a conversation that feels like research, not a cold call
          </div>
          <HooksSection hooks={profile.personal_hooks} />
        </div>
      )}

      {/* ── COMMUNITY ── */}
      {activeTab === 'community' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 20 }}>COMMUNITY PRESENCE</div>
          {profile.community.local_ties.length > 0 ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 12 }}>LOCAL TIES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {profile.community.local_ties.map((tie, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: '2px solid var(--orange)' }}>
                    <span style={{ color: 'var(--orange)', flexShrink: 0, marginTop: 2, fontSize: 10 }}>→</span>
                    <span style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{tie}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {profile.community.press_mentions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 12 }}>PRESS MENTIONS</div>
              {profile.community.press_mentions.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: 'var(--sig-green)', flexShrink: 0, fontSize: 10, marginTop: 3 }}>◈</span>
                  <span style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          )}
          <Row label="Reputation" value={profile.community.reputation_notes} />
          {!hasCommunity && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-4)', padding: '20px 0' }}>
              No community presence found in public record.
            </div>
          )}
        </div>
      )}

      {/* ── RECRUITING ── */}
      {activeTab === 'recruiting' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 20 }}>RECRUITING POSTURE</div>
          <div style={{ marginBottom: 20, padding: '14px 18px', background: profile.recruiting.actively_recruiting ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${profile.recruiting.actively_recruiting ? 'var(--sig-green-border)' : 'var(--border)'}` }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: profile.recruiting.actively_recruiting ? 'var(--sig-green)' : 'var(--text-3)' }}>
              {profile.recruiting.actively_recruiting ? '● Actively building a downline' : '○ No active recruiting signals found'}
            </span>
          </div>
          {profile.recruiting.signals.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 12 }}>EVIDENCE</div>
              {profile.recruiting.signals.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <span style={{ color: 'var(--sig-green)', flexShrink: 0, fontSize: 10, marginTop: 3 }}>→</span>
                  <span style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          )}
          <Row label="Target Profile" value={profile.recruiting.target_profile} />
        </div>
      )}

      {/* ── CAREER ── */}
      {activeTab === 'career' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 20 }}>CAREER CONTEXT</div>
          <Row label="Background" value={profile.career.background} />
          {profile.career.notable_history.length > 0 && (
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 12 }}>NOTABLE HISTORY</div>
              {profile.career.notable_history.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-3)', flexShrink: 0, fontSize: 10, marginTop: 3 }}>→</span>
                  <span style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{h}</span>
                </div>
              ))}
            </div>
          )}
          {!hasCareer && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-4)', padding: '20px 0' }}>
              No career history found in public record.
            </div>
          )}
        </div>
      )}

      {/* ── SOURCES ── */}
      {activeTab === 'sources' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '28px 32px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 20 }}>EVIDENCE TRAIL</div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 12 }}>WEBSITE</div>
            {profile.pages_crawled.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)', padding: '10px 16px' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--sig-green)' }}>● FOUND</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-2)' }}>{profile.pages_crawled.length} pages: {profile.pages_crawled.join(', ')}</span>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,23,68,0.04)', border: '1px solid rgba(255,23,68,0.15)', padding: '10px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-3)' }}>
                ○ NO SITE CRAWLED — Intel is SERP-only
              </div>
            )}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 12 }}>SERP QUERIES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(profile.serp_debug || []).map((entry, ei) => (
              <SerpEntry key={ei} entry={entry} agentName={agentName} />
            ))}
          </div>
        </div>
      )}

      {/* Field notes */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '20px 28px', marginTop: 2 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 12 }}>FIELD NOTES</div>
        <textarea
          value={recruiterNotes}
          onChange={e => setRecruiterNotes(e.target.value)}
          placeholder="Log what you know about this agent — call notes, what you heard from the field, confirmed details..."
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: 10, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, borderRadius: 'var(--radius)' }}
        />
        <button onClick={onSave} disabled={saveState === 'saving'}
          style={{ padding: '10px 22px', background: saveState === 'saved' ? 'var(--sig-green-dim)' : 'var(--bg)', border: `1px solid ${saveState === 'saved' ? 'var(--sig-green-border)' : 'var(--border-strong)'}`, color: saveState === 'saved' ? 'var(--sig-green)' : 'var(--text-1)', fontSize: 13, fontWeight: 600, cursor: saveState === 'saving' ? 'default' : 'pointer', transition: 'all 0.2s', borderRadius: 'var(--radius)' }}>
          {saveState === 'saved' ? '✓ Notes saved · click to update' : saveState === 'saving' ? 'Saving...' : 'Save notes'}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function AnathemaDashboardInner() {
  const searchParams = useSearchParams()

  const [agentName, setAgentName]           = useState('')
  const [website, setWebsite]               = useState('')
  const [city, setCity]                     = useState('')
  const [state, setState]                   = useState('')
  const [scanning, setScanning]             = useState(false)
  const [currentStep, setCurrentStep]       = useState(-1)
  const [logLines, setLogLines]             = useState<string[]>([])
  const [profile, setProfile]               = useState<AgentProfile | null>(null)
  const [affiliationSignal, setAffiliation] = useState<AffiliationSignal | null>(null)
  const [error, setError]                   = useState('')
  const [recruiterNotes, setRecruiterNotes] = useState('')
  const [saveState, setSaveState]           = useState<'idle' | 'saving' | 'saved'>('idle')
  const [specimenId, setSpecimenId]         = useState<string | null>(null)
  const [specimens, setSpecimens]           = useState<any[]>([])
  const [specimenPage, setSpecimenPage]     = useState(0)
  const SPECIMENS_PER_PAGE = 6

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function addLog(line: string) { setLogLines(prev => [...prev.slice(-50), line]) }

  useEffect(() => {
    const name = searchParams.get('name')
    if (name) setAgentName(decodeURIComponent(name))
    const c = searchParams.get('city');  if (c) setCity(decodeURIComponent(c))
    const s = searchParams.get('state'); if (s) setState(decodeURIComponent(s).toUpperCase().slice(0, 2))
    const u = searchParams.get('url');   if (u) setWebsite(decodeURIComponent(u))
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) loadScan(id)
  }, [])

  useEffect(() => {
    fetch('/api/anathema')
      .then(r => r.json())
      .then(d => setSpecimens(d.specimens || []))
      .catch(() => {})
  }, [])

  async function loadScan(id: string) {
    try {
      const res  = await fetch(`/api/anathema?id=${id}`)
      const data = await res.json()
      if (data.scan) {
        const s = data.scan
        setAgentName(s.agent_name || '')
        setCity(s.city || '')
        setState(s.state || '')
        setWebsite(s.agent_website || '')
        if (s.analysis_json) setProfile({ ...s.analysis_json, serp_debug: s.serp_debug || [] })
        if (s.affiliation_signal) setAffiliation(s.affiliation_signal)
        if (s.recruiter_notes) setRecruiterNotes(s.recruiter_notes)
        setSpecimenId(id)
        setSaveState('saved')
      }
    } catch {}
  }

  async function runScan() {
    if (!agentName.trim() || scanning) return
    setScanning(true); setProfile(null); setAffiliation(null); setError('')
    setCurrentStep(0); setLogLines([]); setRecruiterNotes(''); setSaveState('idle')
    if (timerRef.current) clearTimeout(timerRef.current)

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
      const res = await fetch('/api/anathema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: {
            name: agentName.trim(), website: website.trim() || null,
            city: city.trim(), state: state.trim().toUpperCase(),
            social_links: [], notes: '', about: null,
          },
        }),
      })

      if (res.status === 429) {
        addLog('[ALERT] Rate limit — try again later')
        setError('RATE LIMIT — Too many scans. Try again in a few minutes.')
        setScanning(false); setCurrentStep(-1); return
      }

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (timerRef.current) clearTimeout(timerRef.current)
      setCurrentStep(LOADING_STEPS.length - 1)
      addLog(`[OK] Scan complete — ${agentName.trim()}`)
      addLog(`[FOUND] ${data.profile?.pages_crawled?.length || 0} pages · ${data.profile?.data_confidence || 'LOW'} confidence`)
      if (data.affiliation_signal) addLog(`[FOUND] Affiliation signal: ${data.affiliation_signal.matched_phrase}`)
      if ((data.profile?.personal_hooks || []).filter((h: any) => h.usability === 'HIGH').length > 0)
        addLog(`[FOUND] ${data.profile.personal_hooks.filter((h: any) => h.usability === 'HIGH').length} HIGH-usability personal hooks`)

      setProfile({ ...data.profile, serp_debug: data.serp_debug || [] })
      setAffiliation(data.affiliation_signal || null)
      setSpecimenId(data.id || null)
      setSaveState('idle')

      fetch('/api/anathema').then(r => r.json()).then(d => setSpecimens(d.specimens || [])).catch(() => {})
    } catch (err: any) {
      if (timerRef.current) clearTimeout(timerRef.current)
      addLog(`[ALERT] Scan failed: ${err.message}`)
      setError(err.message || 'Scan failed. Please try again.')
    }

    setScanning(false); setCurrentStep(-1)
  }

  async function saveNotes() {
    if (!specimenId || saveState === 'saving') return
    setSaveState('saving')
    try {
      await fetch('/api/anathema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_notes', id: specimenId, recruiter_notes: recruiterNotes }),
      })
      setSaveState('saved')
    } catch { setSaveState('idle') }
  }

  const hasResult = !!(profile || scanning)

  return (
    <div style={{ padding: '40px 40px', maxWidth: 1100 }}>
      <style>{`
        @keyframes slideIn   { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadSlide { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes blink     { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes betaSweep { 0% { transform: translateX(-100%); } 60%,100% { transform: translateX(100%); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="page-eyebrow">Agent Intelligence System</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--text-1)', lineHeight: 0.9 }}>
            ANATHEMA<span style={{ color: 'var(--sig-green)' }}>.</span>
          </h1>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: 'var(--sig-green)', border: '1px solid var(--sig-green-border)', background: 'var(--sig-green-dim)', padding: '5px 10px', marginBottom: 6, position: 'relative', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(26,158,92,0.18), transparent)', animation: 'betaSweep 3s ease-in-out infinite' }} />
            ⚡ REBUILT
          </div>
          {hasResult && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, paddingBottom: 6 }}>
              <button onClick={() => { setProfile(null); setAffiliation(null); setAgentName(''); setWebsite(''); setCity(''); setState(''); setRecruiterNotes(''); setSaveState('idle'); setError('') }} className="btn-ghost" style={{ fontSize: 12 }}>← History</button>
              <button onClick={() => { setProfile(null); setAffiliation(null); setSaveState('idle'); runScan() }} className="btn-ghost" style={{ fontSize: 12 }}>↺ Rescan</button>
              <button onClick={() => { setProfile(null); setAffiliation(null); setAgentName(''); setWebsite(''); setCity(''); setState(''); setRecruiterNotes(''); setSaveState('idle'); setError('') }} className="btn-ghost" style={{ fontSize: 12 }}>New scan</button>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 2, border: `1px solid ${scanning ? 'var(--sig-green)' : 'var(--border-light)'}`, background: 'var(--bg-card)', transition: 'border-color 0.2s', boxShadow: scanning ? '0 0 0 1px var(--sig-green)' : 'none' }}>
        <input value={agentName} onChange={e => setAgentName(e.target.value)} onKeyDown={e => e.key === 'Enter' && runScan()}
          placeholder="Agency or agent name"
          disabled={scanning}
          style={{ flex: 1, padding: '18px 24px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-1)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }} />
        <button onClick={runScan} disabled={scanning || !agentName.trim()}
          style={{ padding: '18px 32px', background: scanning ? 'var(--sig-green-dim)' : 'var(--sig-green)', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: scanning ? 'var(--sig-green)' : 'white', whiteSpace: 'nowrap' }}>
          {scanning ? 'SCANNING...' : 'SCAN'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 4, marginBottom: 2 }}>
        {[
          { value: website, set: setWebsite, ph: 'Website (optional)' },
          { value: city,    set: setCity,    ph: 'City' },
          { value: state,   set: (v: string) => setState(v.toUpperCase().slice(0, 2)), ph: 'State' },
        ].map((f, i) => (
          <input key={i} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} disabled={scanning}
            style={{ padding: '11px 16px', fontSize: 13, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', outline: 'none', fontFamily: "'DM Mono', monospace" }} />
        ))}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-4)', letterSpacing: 1, marginBottom: 32 }}>
        WEBSITE + LOCATION OPTIONAL BUT IMPROVE SIGNAL QUALITY
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '14px 18px', border: '1px solid var(--sig-red-border)', background: 'var(--sig-red-dim)', color: 'var(--sig-red)', fontSize: 13, marginBottom: 24 }}>{error}</div>
      )}

      {/* Loading */}
      {scanning && currentStep >= 0 && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--sig-green)', animation: 'loadSlide 1s ease-in-out infinite' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LOADING_STEPS.map((step, i) => (
                <div key={step} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, color: i < currentStep ? 'var(--sig-green)' : i === currentStep ? 'var(--text-1)' : 'var(--text-4)', transition: 'color 0.3s' }}>
                  <span style={{ fontSize: 9, color: i < currentStep ? 'var(--sig-green)' : i === currentStep ? 'var(--sig-green)' : 'var(--text-4)', flexShrink: 0 }}>{i < currentStep ? '●' : i === currentStep ? '◐' : '○'}</span>
                  {step}
                </div>
              ))}
            </div>
            <TerminalLog lines={logLines} />
          </div>
        </div>
      )}

      {/* Results */}
      {profile && !scanning && (
        <div style={{ animation: 'slideIn 0.3s ease both' }}>
          <ResultCard
            profile={profile}
            affiliationSignal={affiliationSignal}
            agentName={agentName}
            city={city}
            state={state}
            recruiterNotes={recruiterNotes}
            setRecruiterNotes={setRecruiterNotes}
            saveState={saveState}
            onSave={saveNotes}
          />
          <div style={{ marginTop: 16 }}>
            <button onClick={() => { setProfile(null); setAffiliation(null); setAgentName(''); setWebsite(''); setCity(''); setState('') }}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>
              ← RUN NEW SCAN
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!scanning && !profile && (
        <div style={{ marginTop: 8 }}>
          {specimens.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: 2 }}>RECENT SCANS</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-4)', letterSpacing: 1 }}>
                  {specimenPage * SPECIMENS_PER_PAGE + 1}–{Math.min((specimenPage + 1) * SPECIMENS_PER_PAGE, specimens.length)} of {specimens.length}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {specimens.slice(specimenPage * SPECIMENS_PER_PAGE, (specimenPage + 1) * SPECIMENS_PER_PAGE).map((s: any) => (
                  <button key={s.id} onClick={() => loadScan(s.id)}
                    style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'center', padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sig-green-border)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{s.agent_name}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-4)' }}>
                        {[s.city, s.state].filter(Boolean).join(', ')}
                        {s.agent_website && <span style={{ color: 'var(--text-3)' }}> · {s.agent_website}</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-4)' }}>
                      {s.analysis_json?.data_confidence && <ConfidenceBadge confidence={s.analysis_json.data_confidence} />}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
                      {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </button>
                ))}
              </div>
              {specimens.length > SPECIMENS_PER_PAGE && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <button onClick={() => setSpecimenPage(p => Math.max(0, p - 1))} disabled={specimenPage === 0} className="btn-ghost" style={{ flex: 1, fontSize: 12, opacity: specimenPage === 0 ? 0.4 : 1 }}>← Prev</button>
                  <button onClick={() => setSpecimenPage(p => Math.min(Math.ceil(specimens.length / SPECIMENS_PER_PAGE) - 1, p + 1))} disabled={(specimenPage + 1) * SPECIMENS_PER_PAGE >= specimens.length} className="btn-ghost" style={{ flex: 1, fontSize: 12, opacity: (specimenPage + 1) * SPECIMENS_PER_PAGE >= specimens.length ? 0.4 : 1 }}>Next →</button>
                </div>
              )}
            </div>
          )}

          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: 2, marginBottom: 14 }}>WHAT ANATHEMA EXTRACTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { n: '01', title: 'Agent Profile',       tip: 'Who they are, how long in the business, what market they serve. Pulled from their website and public record.' },
              { n: '02', title: 'Personal Hooks',       tip: 'Community events, awards, unusual bio details, recent accomplishments — facts that open a conversation that feels like research.' },
              { n: '03', title: 'Production Record',    tip: 'Awards, rankings, leaderboard appearances, credentials. What the public record says about their output.' },
              { n: '04', title: 'Community Presence',   tip: 'Local sponsorships, press mentions, charity work, chamber ties. How embedded they are in their market.' },
              { n: '05', title: 'Recruiting Posture',   tip: 'Are they building a downline? Job postings, "join my team" language, and downline-building signals.' },
              { n: '06', title: 'Affiliation Signal',   tip: 'If their public record explicitly mentions Integrity Marketing Group, AmeriLife, or Senior Market Sales — it surfaces here. Not a guess. Exact phrase only.' },
            ].map(c => (
              <div key={c.n} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '20px 24px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--sig-green-border)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--sig-green)', letterSpacing: 2, marginBottom: 10 }}>{c.n}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{c.tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnathemaDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 40px', color: 'var(--text-2)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading...</div>}>
      <AnathemaDashboardInner />
    </Suspense>
  )
}
