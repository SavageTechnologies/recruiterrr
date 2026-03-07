'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const MODES = [
  { value: 'medicare',  label: 'Medicare / Senior',    desc: 'Medicare Advantage, Supplement, PDP' },
  { value: 'life',      label: 'Life / Final Expense', desc: 'Term, whole life, final expense' },
  { value: 'annuities', label: 'FIA / MYGA',           desc: 'Fixed index annuities, MYGA, safe money' },
]

const OPERATOR_TIPS = [
  {
    tag: 'PRIORITY', color: 'var(--sig-green)',
    headline: 'HOT means call today.',
    body: "The HOT flag means independent signals fired — no captive contract language, no FMO branding, hiring activity, YouTube presence. Work HOT first, every time.",
  },
  {
    tag: 'SIGNAL', color: 'var(--sig-red)',
    headline: 'YouTube is your biggest tell.',
    body: "An agent building a personal brand is thinking beyond their current upline. Producers don't make videos when they're happy where they are. Click the YT badge and watch what they're posting before you dial.",
  },
  {
    tag: 'INTEL', color: 'var(--orange)',
    headline: 'Their website tells you everything.',
    body: "Before you call, click the website link and spend 60 seconds on it. Carrier logos on the homepage = independent. One company's branding everywhere = captive. Know before you dial.",
  },
  {
    tag: 'OPENER', color: 'var(--orange)',
    headline: 'The HIRING badge is a backdoor.',
    body: "An agent actively hiring subagents has a book of business and is growing — and is probably dealing with support or lead problems from their upline. \"I saw you're building a team\" beats any other opener.",
  },
  {
    tag: 'READING', color: 'var(--text-3)',
    headline: 'Reviews tell you who they are.',
    body: "High rating + lots of reviews = established producer with a real client base. Both are recruitable but the conversation is completely different. Check the count before you call.",
  },
  {
    tag: 'STRATEGY', color: 'var(--text-3)',
    headline: 'Search the city, not the agent.',
    body: "You're mapping a market, not hunting one person. Run the search, look at the cluster. If 8 of 30 agents have YouTube, that's a market full of ambitious producers.",
  },
]

const ANNUITY_TIPS = [
  {
    tag: 'FIA / MYGA', color: 'var(--sig-green)',
    headline: "They won't look like annuity agents.",
    body: 'The best FIA producers call themselves "retirement planners" or "financial advisors." Look past the title and into the notes.',
  },
  {
    tag: 'SIGNAL', color: 'var(--sig-red)',
    headline: '"Safe money" is the magic phrase.',
    body: 'If their website mentions "safe money", "principal protection", "no market risk" — that\'s a pure FIA producer.',
  },
  {
    tag: 'INTEL', color: 'var(--orange)',
    headline: 'Carrier names confirm the kill.',
    body: 'Athene, North American, American Equity, Allianz, Nationwide — if you see any of these on their site, they\'re selling FIAs.',
  },
  {
    tag: 'AVOID', color: 'var(--sig-red)',
    headline: 'Fee-only = walk away.',
    body: 'Fee-only fiduciaries are philosophically anti-annuity. "AUM", "assets under management" — these are securities-first advisors. Don\'t waste time on COLD results here.',
  },
  {
    tag: 'NUANCE', color: 'var(--text-3)',
    headline: '"Fiduciary" alone means nothing.',
    body: 'Insurance agents can legally call themselves fiduciaries. Only walk away if you see "fee-only fiduciary" with AUM language.',
  },
  {
    tag: 'STRATEGY', color: 'var(--text-3)',
    headline: 'Retirement income = your target market.',
    body: 'WARM scores here often mean "I do some annuities" — that\'s a conversation worth having. Don\'t skip WARM on annuity searches.',
  },
]

const LOADING_PHASES = [
  { label: 'Scanning Google local listings',     detail: 'Pulling every agent in the market'         },
  { label: 'Crawling agent websites',            detail: 'Reading homepages, about pages, contact'   },
  { label: 'Checking job boards',                detail: 'Flagging agencies actively hiring'          },
  { label: 'Scanning YouTube presence',          detail: 'Finding agents building personal brands'   },
  { label: 'Running AI recruiter scoring',       detail: 'Writing intel briefs on every HOT target'  },
  { label: 'Preparing your results',             detail: 'Almost there — sorting by recruitability'  },
]

type Agent = {
  name: string; type: string; phone: string; address: string
  rating: number; reviews: number; website: string | null
  carriers: string[]; captive: boolean; score: number
  flag: 'hot' | 'warm' | 'cold'; notes: string; years: number | null
  hiring: boolean; hiring_roles: string[]
  youtube_channel: string | null; youtube_subscribers: string | null; youtube_video_count: number
  about: string | null; contact_email: string | null; social_links: string[]
}

type CitySuggestion = { city: string; state: string; state_name: string; county: string; label: string }

// ── Score Circle ──────────────────────────────────────────────────────────────

function ScoreCircle({ score, size = 52 }: { score: number; size?: number }) {
  const color = score >= 75 ? 'var(--sig-green)' : score >= 50 ? 'var(--sig-yellow)' : 'var(--text-3)'
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={2.5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={2.5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.34, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: size * 0.12, color, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 }}>SCORE</div>
      </div>
    </div>
  )
}

// ── Flag Badge ────────────────────────────────────────────────────────────────

function FlagBadge({ flag }: { flag: 'hot' | 'warm' | 'cold' }) {
  const map = {
    hot:  { bg: 'var(--sig-green-dim)',  border: 'var(--sig-green-border)',  color: 'var(--sig-green)',  label: '● HOT' },
    warm: { bg: 'var(--sig-yellow-dim)', border: 'var(--sig-yellow-border)', color: 'var(--sig-yellow)', label: 'WARM' },
    cold: { bg: 'transparent',           border: 'var(--border)',             color: 'var(--text-3)',     label: 'PASS' },
  }
  const s = map[flag]
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center',
      whiteSpace: 'nowrap', borderRadius: 3, fontWeight: 700,
    }}>{s.label}</div>
  )
}

// ── Compact Agent Card ────────────────────────────────────────────────────────

function CompactAgentCard({ agent, index, isSelected, onSelect }: {
  agent: Agent; index: number; isSelected: boolean; onSelect: () => void
}) {
  const borderColor = agent.flag === 'hot' ? 'var(--sig-green)' : agent.flag === 'warm' ? 'var(--sig-yellow)' : 'var(--border-strong)'
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected || hovered ? 'var(--bg-hover)' : 'transparent',
        borderLeft: `3px solid ${isSelected ? borderColor : 'transparent'}`,
        padding: '12px 14px', cursor: 'pointer',
        transition: 'background 0.1s, border-left-color 0.12s',
        borderBottom: '1px solid var(--border)',
        animation: `slideIn 0.2s ease ${index * 0.025}s both`,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-1)',
            marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {agent.name}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
            {agent.rating > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                ★ {agent.rating} <span style={{ color: 'var(--text-3)' }}>({agent.reviews})</span>
              </div>
            )}
            {agent.phone && (
              <a href={`tel:${agent.phone}`} onClick={e => e.stopPropagation()}
                style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none' }}>
                {agent.phone}
              </a>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {agent.hiring && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 6px',
                border: '1px solid var(--sig-green-border)', color: 'var(--sig-green)',
                background: 'var(--sig-green-dim)', borderRadius: 3, letterSpacing: 0.5,
              }}>HIRING</span>
            )}
            {agent.youtube_channel && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 6px',
                border: '1px solid var(--sig-red-border)', color: 'var(--sig-red)',
                background: 'var(--sig-red-dim)', borderRadius: 3, letterSpacing: 0.5,
              }}>YT</span>
            )}
            {agent.website && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 6px',
                border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 3, letterSpacing: 0.5,
              }}>WEB</span>
            )}
            {agent.captive && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 6px',
                border: '1px solid var(--sig-red-border)', color: 'var(--sig-red)',
                background: 'var(--sig-red-dim)', borderRadius: 3, letterSpacing: 0.5,
              }}>CAPTIVE</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <ScoreCircle score={agent.score} size={42} />
          <FlagBadge flag={agent.flag} />
        </div>
      </div>
    </div>
  )
}

// ── Market Summary ────────────────────────────────────────────────────────────

function MarketSummary({ agents, searchLabel, mode }: { agents: Agent[]; searchLabel: string; mode: string }) {
  const hot      = agents.filter(a => a.flag === 'hot')
  const warm     = agents.filter(a => a.flag === 'warm')
  const hiring   = agents.filter(a => a.hiring)
  const youtube  = agents.filter(a => a.youtube_channel)
  const hasWeb   = agents.filter(a => a.website)
  const avgScore = agents.length ? Math.round(agents.reduce((s, a) => s + a.score, 0) / agents.length) : 0
  const topAgent = agents[0]

  const verdict = (() => {
    if (hot.length >= 5)  return { label: 'STRONG MARKET', color: 'var(--sig-green)',  desc: `${hot.length} HOT targets — high independent density.` }
    if (hot.length >= 2)  return { label: 'ACTIVE MARKET', color: 'var(--sig-yellow)', desc: `${hot.length} HOT, ${warm.length} WARM. Worth working.` }
    if (warm.length >= 4) return { label: 'WARM MARKET',   color: 'var(--sig-yellow)', desc: `Low HOT count but ${warm.length} WARM agents worth a call.` }
    return { label: 'THIN MARKET', color: 'var(--text-3)', desc: 'Low independent density. Consider an adjacent city.' }
  })()

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 5 }}>Market Overview</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: 'var(--text-1)', letterSpacing: 2, lineHeight: 1 }}>{searchLabel}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 1, marginTop: 3 }}>{MODES.find(m => m.value === mode)?.desc}</div>
      </div>

      {/* Verdict */}
      <div style={{
        padding: '12px 14px', background: 'var(--bg)',
        border: `1px solid ${verdict.color}30`, borderLeft: `3px solid ${verdict.color}`,
        borderRadius: 'var(--radius)',
      }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: verdict.color, letterSpacing: 2, marginBottom: 4, fontWeight: 600 }}>{verdict.label}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-1)', lineHeight: 1.5 }}>{verdict.desc}</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {[
          { label: 'HOT TARGETS',      value: hot.length,     color: 'var(--sig-green)',  sub: 'Call today' },
          { label: 'WARM TARGETS',     value: warm.length,    color: 'var(--sig-yellow)', sub: 'Worth a call' },
          { label: 'ACTIVELY HIRING',  value: hiring.length,  color: 'var(--sig-green)',  sub: 'Growth signal' },
          { label: 'YOUTUBE PRESENCE', value: youtube.length, color: 'var(--sig-red)',    sub: 'Brand builders' },
          { label: 'HAVE WEBSITE',     value: hasWeb.length,  color: 'var(--text-2)',     sub: 'Crawled & scored' },
          { label: 'AVG SCORE',        value: avgScore,       color: avgScore >= 65 ? 'var(--sig-green)' : avgScore >= 50 ? 'var(--sig-yellow)' : 'var(--text-3)', sub: 'Market quality' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '14px', background: 'var(--bg)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, color: 'var(--text-3)', letterSpacing: 2, marginTop: 3 }}>{s.label}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, color: 'var(--text-4)', letterSpacing: 1, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Top agent */}
      {topAgent && (
        <div style={{
          padding: '14px', background: 'var(--bg)',
          border: '1px solid var(--orange-border)', borderRadius: 'var(--radius)',
        }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, marginBottom: 8, fontWeight: 600 }}>TOP RESULT</div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>{topAgent.name}</div>
          {topAgent.phone && (
            <a href={`tel:${topAgent.phone}`} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--orange)', textDecoration: 'none', display: 'block', marginBottom: 4 }}>
              {topAgent.phone}
            </a>
          )}
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.5 }}>{topAgent.notes?.slice(0, 120)}...</div>
        </div>
      )}

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-4)', letterSpacing: 1 }}>
        ← SELECT AN AGENT FOR FULL INTEL
      </div>
    </div>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ agent, city, state }: { agent: Agent | null; city: string; state: string }) {
  if (!agent) return null

  const socialLabel = (link: string) => {
    if (link.includes('facebook'))                    return { label: 'Facebook',   short: 'FB', color: '#4267B2' }
    if (link.includes('linkedin'))                    return { label: 'LinkedIn',   short: 'LI', color: '#0077B5' }
    if (link.includes('instagram'))                   return { label: 'Instagram',  short: 'IG', color: '#E1306C' }
    if (link.includes('twitter') || link.includes('x.com')) return { label: 'X / Twitter', short: 'TW', color: '#1DA1F2' }
    return { label: 'Social', short: '↗', color: 'var(--text-2)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', animation: 'fadeUp 0.2s ease both' }}>

      {/* Header */}
      <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: 2,
              textTransform: 'uppercase', marginBottom: 4, fontWeight: 500,
              color: agent.captive ? 'var(--sig-red)' : 'var(--sig-green)',
            }}>
              {agent.captive ? '⚠ CAPTIVE — LOW RECRUITABILITY' : '● INDEPENDENT SIGNAL'}
            </div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.15, marginBottom: 3 }}>{agent.name}</h2>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase' }}>{agent.type}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <ScoreCircle score={agent.score} size={60} />
            <FlagBadge flag={agent.flag} />
          </div>
        </div>

        {/* Contact */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {agent.phone && (
            <a href={`tel:${agent.phone}`} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'var(--sig-green-dim)', border: '1px solid var(--sig-green-border)',
              color: 'var(--sig-green)', textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 0.5,
              borderRadius: 'var(--radius)', transition: 'opacity 0.15s',
            }}>
              📞 {agent.phone}
            </a>
          )}
          {agent.contact_email && (
            <a href={`mailto:${agent.contact_email}`} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'transparent', border: '1px solid var(--border-strong)',
              color: 'var(--text-2)', textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 0.5,
              borderRadius: 'var(--radius)',
            }}>
              @ {agent.contact_email}
            </a>
          )}
        </div>
      </div>

      {/* Website */}
      {agent.website && (
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 8, fontWeight: 500 }}>WEBSITE</div>
          <a href={agent.website} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 13px', background: 'var(--orange-dim)',
            border: '1px solid var(--orange-border)', color: 'var(--orange)',
            textDecoration: 'none', borderRadius: 'var(--radius)', transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--orange-mid)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--orange-dim)')}
          >
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
              {agent.website}
            </span>
            <span style={{ fontSize: 14, flexShrink: 0 }}>↗</span>
          </a>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 0.5, marginTop: 5 }}>
            Carrier logos = independent · FMO branding = captive
          </div>
        </div>
      )}

      {/* Signals */}
      <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {agent.hiring && (
          <div style={{
            padding: '6px 11px', background: 'var(--sig-green-dim)',
            border: '1px solid var(--sig-green-border)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--sig-green)',
            letterSpacing: 0.5, borderRadius: 'var(--radius)', fontWeight: 500,
          }}>
            ▸ HIRING{agent.hiring_roles.length > 0 ? ` — ${agent.hiring_roles[0]}` : ''}
          </div>
        )}
        {agent.youtube_channel && (
          <a href={agent.youtube_channel} target="_blank" rel="noopener noreferrer" style={{
            padding: '6px 11px', background: 'var(--sig-red-dim)',
            border: '1px solid var(--sig-red-border)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--sig-red)',
            letterSpacing: 0.5, textDecoration: 'none', borderRadius: 'var(--radius)', fontWeight: 500,
          }}>
            ▸ YOUTUBE{agent.youtube_subscribers ? ` — ${agent.youtube_subscribers}` : ''} ↗
          </a>
        )}
        {agent.rating > 0 && (
          <div style={{
            padding: '6px 11px', background: 'var(--bg)',
            border: '1px solid var(--border)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            color: agent.reviews >= 100 ? 'var(--sig-yellow)' : 'var(--text-2)',
            letterSpacing: 0.5, borderRadius: 'var(--radius)',
          }}>
            ★ {agent.rating} · {agent.reviews} REVIEWS{agent.reviews >= 100 ? ' — ESTABLISHED' : agent.reviews >= 50 ? ' — ACTIVE' : ''}
          </div>
        )}
        {agent.address && (
          <div style={{
            padding: '6px 11px', background: 'transparent', border: '1px solid var(--border)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-3)',
            letterSpacing: 0.5, borderRadius: 'var(--radius)',
          }}>
            ◎ {agent.address}
          </div>
        )}
      </div>

      {/* AI Intel */}
      {agent.notes && (
        <div style={{ padding: '15px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 10, fontWeight: 500 }}>AI RECRUITER INTEL</div>
          <div style={{
            padding: '13px 15px', background: 'var(--orange-dim)',
            borderLeft: '3px solid var(--orange)', borderRadius: '0 var(--radius) var(--radius) 0',
            fontFamily: "'DM Sans', sans-serif", fontSize: 'var(--text-sm)',
            letterSpacing: 0.3, color: 'var(--text-1)', lineHeight: 1.8,
          }}>
            {agent.notes}
          </div>
        </div>
      )}

      {/* About */}
      {agent.about && (
        <div style={{ padding: '15px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 3, marginBottom: 10, fontWeight: 500 }}>ABOUT THIS AGENCY</div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.8 }}>{agent.about}</p>
        </div>
      )}

      {/* Carriers */}
      {agent.carriers.length > 0 && agent.carriers[0] !== 'Unknown' && (
        <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 3, marginBottom: 10, fontWeight: 500 }}>CARRIERS IDENTIFIED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {agent.carriers.map(c => (
              <span key={c} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, padding: '4px 10px',
                border: '1px solid var(--border)', color: 'var(--text-2)',
                background: 'var(--bg)', letterSpacing: 0.5, borderRadius: 'var(--radius)',
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hiring detail */}
      {agent.hiring && agent.hiring_roles.length > 0 && (
        <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--sig-green)', letterSpacing: 3, marginBottom: 10, fontWeight: 500 }}>ACTIVE JOB POSTINGS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {agent.hiring_roles.map(r => (
              <div key={r} style={{
                fontSize: 'var(--text-sm)', color: 'var(--text-1)', padding: '7px 10px',
                background: 'var(--sig-green-dim)', border: '1px solid var(--sig-green-border)',
                borderRadius: 'var(--radius)',
              }}>
                ▸ {r}
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 0.5, marginTop: 8 }}>
            Opener: "I saw you're building a team — what kind of support are you getting from your upline?"
          </div>
        </div>
      )}

      {/* Social links */}
      {(agent.social_links || []).length > 0 && (
        <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-3)', letterSpacing: 3, marginBottom: 10, fontWeight: 500 }}>SOCIAL PROFILES</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(agent.social_links || []).map((link, i) => {
              const s = socialLabel(link)
              return (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, padding: '5px 11px',
                  border: `1px solid ${s.color}40`, color: s.color, textDecoration: 'none',
                  letterSpacing: 0.5, background: `${s.color}0d`, borderRadius: 'var(--radius)',
                }}>
                  {s.short} — {s.label} ↗
                </a>
              )
            })}
          </div>
        </div>
      )}


    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function SearchPageInner() {
  const searchParams = useSearchParams()
  const [city, setCity]                       = useState('')
  const [state, setState]                     = useState('KS')
  const [mode, setMode]                       = useState('medicare')
  const [loading, setLoading]                 = useState(false)
  const [currentStep, setCurrentStep]         = useState(-1)
  const [agents, setAgents]                   = useState<Agent[]>([])
  const [searched, setSearched]               = useState(false)
  const [searchLabel, setSearchLabel]         = useState('')
  const [error, setError]                     = useState('')
  const [selectedIndex, setSelectedIndex]     = useState<number | null>(null)
  const [showAll, setShowAll]                 = useState(false)
  const [searchCollapsed, setSearchCollapsed] = useState(false)
  const [suggestions, setSuggestions]         = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [acLoading, setAcLoading]             = useState(false)
  const acRef    = useRef<HTMLDivElement>(null)
  const acTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) loadSavedSearch(id)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (acRef.current && !acRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (detailRef.current) detailRef.current.scrollTop = 0
  }, [selectedIndex])

  function handleCityChange(val: string) {
    setCity(val)
    if (acTimer.current) clearTimeout(acTimer.current)
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    setAcLoading(true)
    acTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(val)}`)
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions((data.suggestions || []).length > 0)
      } catch {}
      setAcLoading(false)
    }, 250)
  }

  function selectSuggestion(s: CitySuggestion) {
    setCity(s.city); setState(s.state)
    setSuggestions([]); setShowSuggestions(false)
  }

  async function loadSavedSearch(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/searches?id=${id}`)
      const data = await res.json()
      if (data.search) {
        setAgents(data.search.agents_json || [])
        setCity(data.search.city); setState(data.search.state)
        setSearchLabel(`${data.search.city.toUpperCase()}, ${data.search.state}`)
        setSearched(true); setSearchCollapsed(true)
      }
    } catch {}
    setLoading(false)
  }

  async function runSearch(overrideCity?: string, overrideState?: string) {
    const searchCity  = overrideCity  || city
    const searchState = overrideState || state
    if (!searchCity.trim()) return
    setLoading(true); setSearched(false); setAgents([])
    setError(''); setCurrentStep(0); setSelectedIndex(null); setShowAll(false)

    // Phase timing (ms) — matches the real pipeline order
    const PHASE_TIMINGS = [2000, 5000, 9000, 13000, 17000, 23000]
    const timers: ReturnType<typeof setTimeout>[] = []
    PHASE_TIMINGS.forEach((ms, i) => {
      timers.push(setTimeout(() => setCurrentStep(i), ms))
    })

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: searchCity.trim(), state: searchState, limit: 20, mode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAgents(data.agents || [])
      setCity(searchCity); setState(searchState)
      setSearchLabel(`${searchCity.toUpperCase()}, ${searchState}`)
      setSearchCollapsed(true)
    } catch (err: any) {
      setError(err.message || 'Search failed. Try again.')
    }
    timers.forEach(clearTimeout); setCurrentStep(-1)
    setLoading(false); setSearched(true)
  }

  const selectedAgent = selectedIndex !== null ? agents[selectedIndex] : null
  const visibleAgents = showAll ? agents : agents.filter(a => a.flag !== 'cold')
  const coldCount     = agents.filter(a => a.flag === 'cold').length
  const hotCount      = agents.filter(a => a.flag === 'hot').length
  const warmCount     = agents.filter(a => a.flag === 'warm').length

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400 }}>

      {/* Page header */}
      {!searchCollapsed && (
        <div style={{ marginBottom: 22 }}>
          <div className="page-eyebrow">Agent Search</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'var(--text-hero)', letterSpacing: 2, color: 'var(--text-1)', lineHeight: 0.9 }}>
            FIND AGENTS<span style={{ color: 'var(--orange)' }}>.</span>
          </h1>
        </div>
      )}

      {/* ── AGENT SEARCH ── */}
      <>
          {/* Collapsed bar */}
          {searchCollapsed ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              marginBottom: 14, boxShadow: '0 1px 4px var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sig-green)' }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-1)', fontWeight: 600 }}>
                  {searchLabel}
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)' }}>· {agents.length} agents</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--sig-green)', fontWeight: 500 }}>● {hotCount} HOT</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--sig-yellow)' }}>{warmCount} WARM</span>
              </div>
              <button onClick={() => { setSearchCollapsed(false); setSearched(false); setAgents([]); setSelectedIndex(null) }}
                className="btn-ghost">
                NEW SEARCH ↓
              </button>
            </div>
          ) : (
            <>
              {/* Search form */}
              <div style={{
                display: 'flex', background: 'var(--bg-card)',
                border: `1.5px solid ${loading ? 'var(--orange)' : 'var(--border-strong)'}`,
                borderRadius: 'var(--radius-md)', marginBottom: 10,
                boxShadow: loading ? `0 0 0 3px var(--orange-dim)` : '0 2px 8px var(--shadow-sm)',
                transition: 'border-color 0.2s, box-shadow 0.2s', overflow: 'visible', position: 'relative',
              }}>
                <select value={mode} onChange={e => setMode(e.target.value)} disabled={loading}
                  style={{
                    width: 185, padding: '16px 12px', background: 'transparent',
                    border: 'none', borderRight: '1px solid var(--border)', outline: 'none',
                    color: 'var(--orange)', fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                    cursor: 'pointer', appearance: 'none', textAlign: 'center', letterSpacing: 1, flexShrink: 0,
                  }}>
                  {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <div ref={acRef} style={{ position: 'relative', flex: 1 }}>
                  <input value={city} onChange={e => handleCityChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); runSearch() } if (e.key === 'Escape') setShowSuggestions(false) }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="City" disabled={loading} autoComplete="off"
                    style={{
                      width: '100%', padding: '16px 20px', background: 'transparent',
                      border: 'none', outline: 'none', color: 'var(--text-1)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 'var(--text-base)',
                    }} />
                  {acLoading && (
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                      <div style={{ width: 10, height: 10, border: '2px solid var(--border)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    </div>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)', zIndex: 300,
                      boxShadow: '0 8px 24px var(--shadow-md)', overflow: 'hidden',
                    }}>
                      {suggestions.map((s, i) => (
                        <div key={i} onMouseDown={() => selectSuggestion(s)}
                          style={{
                            padding: '11px 18px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{s.city}</span>
                            {s.county && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 1, marginLeft: 8 }}>{s.county} CO.</span>}
                          </div>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--orange)', letterSpacing: 2, fontWeight: 500 }}>{s.state}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => runSearch()} disabled={loading || !city.trim()}
                  style={{
                    padding: '14px 32px', background: loading ? 'var(--border)' : 'var(--orange)',
                    border: 'none', borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2,
                    color: 'white', transition: 'opacity 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  {loading ? 'SCANNING...' : 'SEARCH'}
                </button>
              </div>

              {/* Operator tips */}
              {!searched && !loading && (
                <div style={{ marginTop: 28, marginBottom: 36 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-2)', letterSpacing: 2, textTransform: 'uppercase' }}>Operator Intelligence</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      — {mode === 'annuities' ? 'how to find FIA & MYGA producers' : 'how to get the most out of every search'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {(mode === 'annuities' ? ANNUITY_TIPS : OPERATOR_TIPS).map((tip, i) => (
                      <div key={i} style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderTop: `2px solid ${tip.color}`, padding: '18px',
                        borderRadius: 'var(--radius)', boxShadow: '0 1px 3px var(--shadow-sm)',
                      }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: tip.color, letterSpacing: 2, marginBottom: 8, fontWeight: 600 }}>{tip.tag}</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-1)', marginBottom: 7, lineHeight: 1.3 }}>{tip.headline}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>{tip.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading */}
          {loading && currentStep >= 0 && (
            <div style={{ marginBottom: 36 }}>
              {/* Progress bar */}
              <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 20, borderRadius: 1 }}>
                <div style={{
                  position: 'absolute', left: 0, height: '100%', background: 'var(--orange)',
                  width: `${Math.round(((currentStep + 1) / LOADING_PHASES.length) * 100)}%`,
                  transition: 'width 1.2s ease',
                }} />
              </div>

              {/* Active phase callout */}
              {LOADING_PHASES[currentStep] && (
                <div style={{
                  padding: '14px 18px', marginBottom: 18,
                  background: 'var(--bg-card)', border: '1px solid var(--orange-border)',
                  borderLeft: '3px solid var(--orange)', borderRadius: 'var(--radius)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--orange)', fontSize: 9, animation: 'pulse 1s infinite' }}>◐</span>
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
                        {LOADING_PHASES[currentStep].label}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-3)', letterSpacing: 0.5 }}>
                        {LOADING_PHASES[currentStep].detail}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {LOADING_PHASES.map((phase, i) => (
                  <div key={phase.label} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 0.5,
                    display: 'flex', alignItems: 'center', gap: 10,
                    color: i < currentStep ? 'var(--sig-green)' : i === currentStep ? 'var(--orange)' : 'var(--text-4)',
                    transition: 'color 0.4s',
                  }}>
                    <span style={{ fontSize: 8, flexShrink: 0 }}>
                      {i < currentStep ? '●' : i === currentStep ? '◐' : '○'}
                    </span>
                    <span>{phase.label}</span>
                    {i < currentStep && (
                      <span style={{ fontSize: 9, color: 'var(--sig-green)', marginLeft: 'auto' }}>DONE</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Honest time warning — shows after 10s */}
              {currentStep >= 2 && (
                <div style={{
                  marginTop: 20, padding: '10px 14px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-3)', letterSpacing: 0.5,
                  lineHeight: 1.6,
                }}>
                  ⚡ Crawling websites and running AI scoring takes 20–40 seconds. Every HOT result comes with a full intel brief — worth the wait.
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{
              padding: '14px 18px', border: '1px solid var(--sig-red-border)',
              background: 'var(--sig-red-dim)', color: 'var(--sig-red)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 1,
              marginBottom: 28, borderRadius: 'var(--radius)',
            }}>
              {error}
            </div>
          )}

          {/* Results */}
          {searched && !loading && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-2)', letterSpacing: 1 }}>
                  <strong style={{ color: 'var(--text-1)' }}>{searchLabel}</strong> — {MODES.find(m => m.value === mode)?.label}
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--sig-green)', fontWeight: 500 }}>● {hotCount} HOT</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--sig-yellow)' }}>{warmCount} WARM</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--text-1)' }}>{agents.length} TOTAL</div>
                </div>
              </div>

              {agents.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '80px 0',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: 'var(--text-4)', marginBottom: 10 }}>NO AGENTS FOUND</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>Try a larger city or different search terms.</div>
                </div>
              ) : (
                <div style={{
                  display: 'grid', gridTemplateColumns: '320px 1fr',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  overflow: 'hidden', boxShadow: '0 2px 12px var(--shadow-sm)',
                }}>
                  {/* Left — agent list */}
                  <div style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
                    {/* Filter chips */}
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', gap: 5 }}>
                      {[
                        { label: `${hotCount} HOT`,    color: 'var(--sig-green)',  bg: 'var(--sig-green-dim)',  border: 'var(--sig-green-border)' },
                        { label: `${warmCount} WARM`,  color: 'var(--sig-yellow)', bg: 'var(--sig-yellow-dim)', border: 'var(--sig-yellow-border)' },
                        { label: `${agents.filter(a => a.hiring).length} HIRING`, color: 'var(--sig-green)', bg: 'var(--sig-green-dim)', border: 'var(--sig-green-border)' },
                        { label: `${agents.filter(a => a.youtube_channel).length} YT`, color: 'var(--sig-red)', bg: 'var(--sig-red-dim)', border: 'var(--sig-red-border)' },
                      ].map(f => (
                        <div key={f.label} style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: 10, padding: '3px 9px',
                          border: `1px solid ${f.border}`, color: f.color, background: f.bg,
                          borderRadius: 100, letterSpacing: 0.5, fontWeight: 500,
                        }}>
                          {f.label}
                        </div>
                      ))}
                    </div>

                    {visibleAgents.map((agent, i) => (
                      <CompactAgentCard key={i} agent={agent} index={i}
                        isSelected={selectedIndex === i} onSelect={() => setSelectedIndex(i)} />
                    ))}

                    {coldCount > 0 && (
                      <button onClick={() => setShowAll(v => !v)}
                        style={{
                          width: '100%', padding: '10px', background: 'transparent',
                          border: 'none', borderTop: '1px solid var(--border)',
                          color: 'var(--text-3)', fontFamily: "'DM Sans', sans-serif",
                          fontSize: 10, letterSpacing: 1, cursor: 'pointer', textAlign: 'center',
                        }}>
                        {showAll ? `▲ HIDE ${coldCount} PASS` : `▼ SHOW ${coldCount} PASS`}
                      </button>
                    )}
                  </div>

                  {/* Right — detail / market summary */}
                  <div ref={detailRef} style={{
                    position: 'sticky', top: 16,
                    maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
                    background: 'var(--bg-card)',
                  }}>
                    {selectedAgent
                      ? <DetailPanel agent={selectedAgent} city={city} state={state} />
                      : <MarketSummary agents={agents} searchLabel={searchLabel} mode={mode} />
                    }
                  </div>
                </div>
              )}
            </>
          )}
        </>

    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '60px 40px', color: 'var(--text-3)', fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>
        Loading...
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  )
}
