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
    tag: 'PRIORITY',
    color: 'var(--green)',
    headline: 'HOT means call today.',
    body: 'The HOT flag means independent signals fired — no captive contract language, no FMO branding, hiring activity, YouTube presence. These have the shortest path to a real conversation. Work HOT first, every time.',
  },
  {
    tag: 'SIGNAL',
    color: '#ff4444',
    headline: 'YouTube is your biggest tell.',
    body: 'An agent building a personal brand is thinking beyond their current upline. Producers don\'t make videos when they\'re happy where they are. Click the YT badge and watch what they\'re posting before you dial.',
  },
  {
    tag: 'INTEL',
    color: 'var(--orange)',
    headline: 'Their website tells you everything.',
    body: 'Before you call, click the website link and spend 60 seconds on it. Carrier logos on the homepage = independent. One company\'s branding everywhere = captive. \"Powered by\" or FMO co-branding = they already have an upline. Know before you dial.',
  },
  {
    tag: 'OPENER',
    color: 'var(--orange)',
    headline: 'The HIRING badge is a backdoor.',
    body: 'An agent actively hiring subagents has a book of business and is growing — and is probably dealing with support or lead problems from their upline. \"I saw you\'re building a team\" beats any other opener.',
  },
  {
    tag: 'READING',
    color: 'var(--muted)',
    headline: 'Reviews tell you who they are.',
    body: 'High rating + lots of reviews = established producer with a real client base. That\'s who you want. Both are recruitable but the conversation is completely different. Check the count before you call.',
  },
  {
    tag: 'STRATEGY',
    color: 'var(--muted)',
    headline: 'Search the city, not the agent.',
    body: 'You\'re mapping a market, not hunting one person. Run the search, look at the cluster. If 8 of 30 agents have YouTube, that\'s a market full of ambitious producers. If most are captive, move on.',
  },
]

const ANNUITY_TIPS = [
  {
    tag: 'FIA / MYGA',
    color: 'var(--green)',
    headline: 'They won\'t look like annuity agents.',
    body: 'The best FIA producers call themselves \"retirement planners\" or \"financial advisors\" — not annuity agents. They serve the same retirement-age client but are insurance-only licensed. Look past the title and into the notes.',
  },
  {
    tag: 'SIGNAL',
    color: '#ff4444',
    headline: '\"Safe money\" is the magic phrase.',
    body: 'If their website or notes mention \"safe money\", \"principal protection\", \"no market risk\", or \"guaranteed income\" — that\'s a pure FIA producer. These phrases are industry-specific shorthand that only insurance-licensed annuity agents use.',
  },
  {
    tag: 'INTEL',
    color: 'var(--orange)',
    headline: 'Carrier names confirm the kill.',
    body: 'Athene, North American, American Equity, Allianz, Nationwide, Pacific Life, Global Atlantic, Midland National — if you see any of these on their site, they\'re selling FIAs. That\'s your green light.',
  },
  {
    tag: 'AVOID',
    color: '#ff4444',
    headline: 'Fee-only = walk away.',
    body: 'Fee-only fiduciaries are philosophically anti-annuity. \"AUM\", \"assets under management\", \"portfolio management\" — these are securities-first advisors. The score will reflect it. Don\'t waste time on COLD results here.',
  },
  {
    tag: 'NUANCE',
    color: 'var(--muted)',
    headline: '\"Fiduciary\" alone means nothing.',
    body: 'Insurance agents can legally call themselves fiduciaries — and many do now. Don\'t let the word spook you. Only walk away if you see \"fee-only fiduciary\" or \"fiduciary financial advisor\" with AUM language. Context is everything.',
  },
  {
    tag: 'STRATEGY',
    color: 'var(--muted)',
    headline: 'Retirement income = your target market.',
    body: 'Search results will include some hybrid advisors who do both securities and insurance. WARM scores here often mean \"I do some annuities\" — that\'s a conversation worth having. Don\'t skip WARM on annuity searches the way you might on Medicare.',
  },
]

const LOADING_STEPS = [
  'Querying Google local listings',
  'Deep crawling agent websites',
  'Checking job postings',
  'Scanning YouTube presence',
  'Scoring recruitability',
]

const LOOKUP_STEPS = [
  'Searching the open web',
  'Locating agent website',
  'Crawling website content',
  'Scoring recruitability',
]

type Agent = {
  name: string; type: string; phone: string; address: string
  rating: number; reviews: number; website: string | null
  carriers: string[]; captive: boolean; score: number
  flag: 'hot' | 'warm' | 'cold'; notes: string; years: number | null
  hiring: boolean; hiring_roles: string[]
  youtube_channel: string | null; youtube_subscribers: string | null; youtube_video_count: number
  about: string | null; contact_email: string | null; social_links: string[]
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence_note?: string
  source_url?: string | null
  source_title?: string | null
}

type CitySuggestion = { city: string; state: string; state_name: string; county: string; label: string }

function ScoreCircle({ score, size = 52 }: { score: number; size?: number }) {
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--muted)'
  const circumference = 2 * Math.PI * (size * 0.38)
  const dash = (score / 100) * circumference
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={size*0.38} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
        <circle cx={size/2} cy={size/2} r={size*0.38} fill="none" stroke={color} strokeWidth={2}
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.36, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: size * 0.13, color, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 }}>SCORE</div>
      </div>
    </div>
  )
}

function FlagBadge({ flag }: { flag: 'hot' | 'warm' | 'cold' }) {
  const map = {
    hot:  { bg: 'rgba(0,230,118,0.12)', border: 'rgba(0,230,118,0.4)', color: 'var(--green)', label: '◈ HOT' },
    warm: { bg: 'rgba(255,214,0,0.08)', border: 'rgba(255,214,0,0.3)', color: 'var(--yellow)', label: 'WARM' },
    cold: { bg: 'rgba(255,255,255,0.03)', border: 'var(--border)', color: '#555', label: 'PASS' },
  }
  const s = map[flag]
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap',
    }}>{s.label}</div>
  )
}

function CompactAgentCard({ agent, index, isSelected, onSelect }: {
  agent: Agent; index: number; isSelected: boolean; onSelect: () => void
}) {
  const flagColor = agent.flag === 'hot' ? 'var(--green)' : agent.flag === 'warm' ? 'var(--yellow)' : 'var(--border)'
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? '#1e1c18' : hovered ? '#1a1916' : 'transparent',
        borderLeft: `3px solid ${isSelected ? flagColor : 'transparent'}`,
        padding: '11px 14px',
        cursor: 'pointer',
        transition: 'all 0.12s',
        borderBottom: '1px solid var(--border)',
        animation: `slideIn 0.25s ease ${index * 0.03}s both`,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--white)' : 'var(--white)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {agent.name}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
            {agent.rating > 0 && (
              <div style={{ fontSize: 10, color: agent.reviews >= 50 ? 'var(--yellow)' : 'var(--muted)' }}>
                ★ {agent.rating} <span style={{ color: '#444' }}>({agent.reviews})</span>
              </div>
            )}
            {agent.phone && (
              <a href={`tel:${agent.phone}`} onClick={e => e.stopPropagation()}
                style={{ fontSize: 10, color: '#555', fontFamily: "'DM Mono', monospace", textDecoration: 'none' }}>
                {agent.phone}
              </a>
            )}
          </div>

          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {agent.hiring && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, padding: '1px 5px', border: '1px solid rgba(0,230,118,0.3)', color: 'var(--green)', letterSpacing: 1 }}>HIRING</span>
            )}
            {agent.youtube_channel && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, padding: '1px 5px', border: '1px solid rgba(255,68,68,0.4)', color: '#ff4444', letterSpacing: 1 }}>YT</span>
            )}
            {agent.website && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, padding: '1px 5px', border: '1px solid var(--border-light)', color: '#555', letterSpacing: 1 }}>WEB</span>
            )}
            {agent.captive && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, padding: '1px 5px', border: '1px solid rgba(255,23,68,0.3)', color: '#ff4444', letterSpacing: 1 }}>CAPTIVE</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <ScoreCircle score={agent.score} size={40} />
          <FlagBadge flag={agent.flag} />
        </div>
      </div>
    </div>
  )
}

// ── Market Summary (shown in right panel before any agent is selected) ─────────
function MarketSummary({ agents, searchLabel, mode }: { agents: Agent[]; searchLabel: string; mode: string }) {
  const hot = agents.filter(a => a.flag === 'hot')
  const warm = agents.filter(a => a.flag === 'warm')
  const hiring = agents.filter(a => a.hiring)
  const youtube = agents.filter(a => a.youtube_channel)
  const hasWebsite = agents.filter(a => a.website)
  const avgScore = agents.length ? Math.round(agents.reduce((s, a) => s + a.score, 0) / agents.length) : 0
  const topAgent = agents[0]

  const marketVerdict = () => {
    if (hot.length >= 5) return { label: 'STRONG MARKET', color: 'var(--green)', desc: `${hot.length} HOT targets — high independent density. Priority market.` }
    if (hot.length >= 2) return { label: 'ACTIVE MARKET', color: 'var(--yellow)', desc: `${hot.length} HOT, ${warm.length} WARM. Worth working.` }
    if (warm.length >= 4) return { label: 'WARM MARKET', color: 'var(--yellow)', desc: `Low HOT count but ${warm.length} WARM agents worth a call.` }
    return { label: 'THIN MARKET', color: 'var(--muted)', desc: 'Low independent density. Consider an adjacent city.' }
  }
  const verdict = marketVerdict()

  return (
    <div style={{ height: '100%', padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
      {/* Market header */}
      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Market Overview</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--white)', letterSpacing: 2, lineHeight: 1 }}>{searchLabel}</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 1, marginTop: 4 }}>{MODES.find(m => m.value === mode)?.desc}</div>
      </div>

      {/* Verdict */}
      <div style={{ padding: '14px 16px', background: `rgba(0,0,0,0.3)`, border: `1px solid ${verdict.color}30`, borderLeft: `3px solid ${verdict.color}` }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: verdict.color, letterSpacing: 2, marginBottom: 4 }}>{verdict.label}</div>
        <div style={{ fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>{verdict.desc}</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {[
          { label: 'HOT TARGETS', value: hot.length, color: 'var(--green)', sub: 'Call today' },
          { label: 'WARM TARGETS', value: warm.length, color: 'var(--yellow)', sub: 'Worth a call' },
          { label: 'ACTIVELY HIRING', value: hiring.length, color: 'var(--green)', sub: 'Growth signal' },
          { label: 'YOUTUBE PRESENCE', value: youtube.length, color: '#ff4444', sub: 'Brand builders' },
          { label: 'HAVE WEBSITE', value: hasWebsite.length, color: 'var(--muted)', sub: 'Crawled & scored' },
          { label: 'AVG SCORE', value: avgScore, color: avgScore >= 65 ? 'var(--green)' : avgScore >= 50 ? 'var(--yellow)' : 'var(--muted)', sub: 'Market quality' },
        ].map(s => (
          <div key={s.label} style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--muted)', letterSpacing: 2, marginTop: 2 }}>{s.label}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 1, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Top agent callout */}
      {topAgent && (
        <div style={{ padding: '14px 16px', background: 'rgba(255,85,0,0.05)', border: '1px solid rgba(255,85,0,0.2)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, marginBottom: 8 }}>TOP RESULT</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>{topAgent.name}</div>
          {topAgent.phone && (
            <a href={`tel:${topAgent.phone}`} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', textDecoration: 'none', display: 'block', marginBottom: 4 }}>
              {topAgent.phone}
            </a>
          )}
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{topAgent.notes?.slice(0, 120)}...</div>
        </div>
      )}

      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>
        ← SELECT AN AGENT FOR FULL INTEL
      </div>
    </div>
  )
}

// ── Full Detail Panel ─────────────────────────────────────────────────────────
function DetailPanel({ agent, city, state }: { agent: Agent | null; city: string; state: string }) {
  if (!agent) return null

  const flagColor = agent.flag === 'hot' ? 'var(--green)' : agent.flag === 'warm' ? 'var(--yellow)' : 'var(--border)'
  const socialLabel = (link: string) => {
    if (link.includes('facebook')) return { label: 'Facebook', short: 'FB', color: '#4267B2' }
    if (link.includes('linkedin')) return { label: 'LinkedIn', short: 'LI', color: '#0077B5' }
    if (link.includes('instagram')) return { label: 'Instagram', short: 'IG', color: '#E1306C' }
    if (link.includes('twitter') || link.includes('x.com')) return { label: 'X / Twitter', short: 'TW', color: '#1DA1F2' }
    return { label: 'Social', short: '↗', color: 'var(--muted)' }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', animation: 'fadeUp 0.2s ease both' }}>

      {/* ── Header strip ── */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: agent.captive ? '#ff4444' : 'var(--green)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 5 }}>
              {agent.captive ? '⚠ CAPTIVE — LOW RECRUITABILITY' : '◈ INDEPENDENT SIGNAL'}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--white)', lineHeight: 1.1, marginBottom: 4 }}>{agent.name}</h2>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{agent.type}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <ScoreCircle score={agent.score} size={58} />
            <FlagBadge flag={agent.flag} />
          </div>
        </div>

        {/* ── Primary contact row ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {agent.phone && (
            <a href={`tel:${agent.phone}`} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: `${flagColor}15`, border: `1px solid ${flagColor}40`,
              color: 'var(--white)', textDecoration: 'none', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5,
              transition: 'background 0.15s',
            }}>
              <span style={{ fontSize: 10 }}>📞</span> {agent.phone}
            </a>
          )}
          {agent.contact_email && (
            <a href={`mailto:${agent.contact_email}`} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
              color: 'var(--muted)', textDecoration: 'none', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5,
            }}>
              @ {agent.contact_email}
            </a>
          )}
        </div>
      </div>

      {/* ── Website — front and center ── */}
      {agent.website && (
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(255,85,0,0.04)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--orange)', letterSpacing: 3, marginBottom: 8 }}>WEBSITE</div>
          <a href={agent.website} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: 'rgba(255,85,0,0.06)', border: '1px solid rgba(255,85,0,0.25)',
            color: 'var(--orange)', textDecoration: 'none', transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,85,0,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,85,0,0.06)')}
          >
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
              {agent.website}
            </span>
            <span style={{ fontSize: 14, flexShrink: 0 }}>↗</span>
          </a>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 1, marginTop: 6 }}>
            Spend 60s here before you dial — carrier logos = independent, FMO branding = captive
          </div>
        </div>
      )}

      {/* ── Signal badges ── */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {agent.hiring && (
          <div style={{ padding: '6px 12px', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.3)', fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 1 }}>
            ▸ HIRING{agent.hiring_roles.length > 0 ? ` — ${agent.hiring_roles[0]}` : ''}
          </div>
        )}
        {agent.youtube_channel && (
          <a href={agent.youtube_channel} target="_blank" rel="noopener noreferrer" style={{
            padding: '6px 12px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)',
            fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#ff4444', letterSpacing: 1, textDecoration: 'none',
          }}>
            ▸ YOUTUBE{agent.youtube_subscribers ? ` — ${agent.youtube_subscribers}` : ''} ↗
          </a>
        )}
        {agent.rating > 0 && (
          <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', fontFamily: "'DM Mono', monospace", fontSize: 9, color: agent.reviews >= 100 ? 'var(--yellow)' : 'var(--muted)', letterSpacing: 1 }}>
            ★ {agent.rating} · {agent.reviews} REVIEWS{agent.reviews >= 100 ? ' — ESTABLISHED' : agent.reviews >= 50 ? ' — ACTIVE' : ''}
          </div>
        )}
        {agent.address && (
          <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1 }}>
            ◎ {agent.address}
          </div>
        )}
      </div>

      {/* ── AI Intel ── */}
      {agent.notes && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--orange)', letterSpacing: 3, marginBottom: 10 }}>AI RECRUITER INTEL</div>
          <div style={{ padding: '14px 16px', background: 'rgba(255,85,0,0.06)', borderLeft: '2px solid var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.3, color: 'var(--white)', lineHeight: 1.8 }}>
            {agent.notes}
          </div>
        </div>
      )}

      {/* ── About ── */}
      {agent.about && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--muted)', letterSpacing: 3, marginBottom: 10 }}>ABOUT THIS AGENCY</div>
          <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.75)', lineHeight: 1.75 }}>{agent.about}</p>
        </div>
      )}

      {/* ── Carriers ── */}
      {agent.carriers.length > 0 && agent.carriers[0] !== 'Unknown' && (
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--muted)', letterSpacing: 3, marginBottom: 10 }}>CARRIERS IDENTIFIED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {agent.carriers.map(c => (
              <span key={c} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '4px 10px', border: '1px solid var(--border-light)', color: 'var(--white)', letterSpacing: 0.5, background: 'rgba(255,255,255,0.03)' }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Hiring detail ── */}
      {agent.hiring && agent.hiring_roles.length > 0 && (
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--green)', letterSpacing: 3, marginBottom: 10 }}>ACTIVE JOB POSTINGS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {agent.hiring_roles.map(r => (
              <div key={r} style={{ fontSize: 13, color: 'var(--white)', padding: '6px 10px', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)' }}>
                ▸ {r}
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#555', letterSpacing: 1, marginTop: 8 }}>
            Opener: "I saw you're building a team — what kind of support are you getting from your upline?"
          </div>
        </div>
      )}

      {/* ── Social links ── */}
      {(agent.social_links || []).length > 0 && (
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--muted)', letterSpacing: 3, marginBottom: 10 }}>SOCIAL PROFILES</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(agent.social_links || []).map((link, i) => {
              const s = socialLabel(link)
              return (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '5px 12px',
                  border: `1px solid ${s.color}40`, color: s.color, textDecoration: 'none', letterSpacing: 1,
                  background: `${s.color}0d`,
                }}>
                  {s.short} — {s.label} ↗
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ANATHEMA CTA ── */}
      <div style={{ padding: '16px 24px', marginTop: 'auto' }}>
        <a
          href={`/dashboard/anathema?name=${encodeURIComponent(agent.name)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}${agent.website ? `&url=${encodeURIComponent(agent.website)}` : ''}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)',
            textDecoration: 'none', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,230,118,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,230,118,0.05)')}
        >
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)', letterSpacing: 2 }}>◈ RUN ANATHEMA SCAN</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 1, marginTop: 3 }}>Deep-scan for upline affiliation & captive contract signals</div>
          </div>
          <span style={{ color: 'var(--green)', fontSize: 16 }}>→</span>
        </a>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function SearchPageInner() {
  const searchParams = useSearchParams()
  const [city, setCity]                       = useState('')
  const [state, setState]                     = useState('KS')
  const [mode, setMode]                       = useState('medicare')
  const [searchMode, setSearchMode]           = useState<'market' | 'lookup'>('market')
  const [loading, setLoading]                 = useState(false)
  const [currentStep, setCurrentStep]         = useState(-1)
  const [agents, setAgents]                   = useState<Agent[]>([])
  const [searched, setSearched]               = useState(false)
  const [searchLabel, setSearchLabel]         = useState('')
  const [error, setError]                     = useState('')
  const [selectedIndex, setSelectedIndex]     = useState<number | null>(null)
  const [showAll, setShowAll]                 = useState(false)
  const [searchCollapsed, setSearchCollapsed] = useState(false)
  const [lookupName, setLookupName]           = useState('')
  const [lookupLoading, setLookupLoading]     = useState(false)
  const [lookupStep, setLookupStep]           = useState(-1)
  const [lookupResult, setLookupResult]       = useState<Agent | null>(null)
  const [lookupError, setLookupError]         = useState('')
  const [suggestions, setSuggestions]         = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [acLoading, setAcLoading]             = useState(false)
  const acRef   = useRef<HTMLDivElement>(null)
  const acTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  // Scroll detail panel to top when agent changes
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
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => prev < LOADING_STEPS.length - 1 ? prev + 1 : prev)
    }, 1800)
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
    clearInterval(stepInterval); setCurrentStep(-1)
    setLoading(false); setSearched(true)
  }

  async function runLookup() {
    if (!lookupName.trim() || lookupLoading) return
    setLookupLoading(true); setLookupResult(null); setLookupError(''); setLookupStep(0)
    const stepInterval = setInterval(() => {
      setLookupStep(prev => prev < LOOKUP_STEPS.length - 1 ? prev + 1 : prev)
    }, 2000)
    try {
      const res = await fetch('/api/search/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: lookupName.trim(), city: city.trim(), state, mode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLookupResult(data.agent)
    } catch (err: any) {
      setLookupError(err.message || 'Lookup failed. Try again.')
    }
    clearInterval(stepInterval); setLookupStep(-1); setLookupLoading(false)
  }

  const selectedAgent   = selectedIndex !== null ? agents[selectedIndex] : null
  const visibleAgents   = showAll ? agents : agents.filter(a => a.flag !== 'cold')
  const coldCount       = agents.filter(a => a.flag === 'cold').length
  const hotCount        = agents.filter(a => a.flag === 'hot').length
  const warmCount       = agents.filter(a => a.flag === 'warm').length

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, minHeight: '100vh' }}>
      <style>{`
        @keyframes slideIn  { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp   { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadSlide{ 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes pulse    { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        select option { background: #1a1814; }
        .phone-link:hover { color: var(--white) !important; }
        .detail-scroll::-webkit-scrollbar { width: 3px; }
        .detail-scroll::-webkit-scrollbar-thumb { background: var(--border-light); }
      `}</style>

      {/* ── Page header ── */}
      {!searchCollapsed && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            {searchMode === 'market' ? 'Market Search' : 'Agent Lookup'}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: 'var(--white)', lineHeight: 0.9 }}>
              {searchMode === 'market'
                ? <span>FIND AGENTS<span style={{ color: 'var(--orange)' }}>.</span></span>
                : <span>AGENT LOOKUP<span style={{ color: 'var(--orange)' }}>.</span></span>
              }
            </h1>
            <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
              {(['market', 'lookup'] as const).map(m => (
                <button key={m} onClick={() => { setSearchMode(m); setLookupResult(null); setLookupError('') }}
                  style={{ background: searchMode === m ? 'var(--card)' : 'transparent', border: `1px solid ${searchMode === m ? 'var(--border-light)' : 'var(--border)'}`, color: searchMode === m ? 'var(--orange)' : 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '8px 18px', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {m === 'market' ? '◈ MARKET SWEEP' : '⊕ AGENT LOOKUP'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MARKET SWEEP ════════════════ */}
      {searchMode === 'market' && (
        <>
          {/* Collapsed bar */}
          {searchCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'var(--card)', border: '1px solid var(--border-light)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)', letterSpacing: 1 }}>
                  {searchLabel} · {agents.length} agents
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 1 }}>◈ {hotCount} HOT</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--yellow)', letterSpacing: 1 }}>{warmCount} WARM</span>
              </div>
              <button onClick={() => { setSearchCollapsed(false); setSearched(false); setAgents([]); setSelectedIndex(null) }}
                style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '5px 12px', cursor: 'pointer' }}>
                NEW SEARCH ↓
              </button>
            </div>
          ) : (
            <>
              {/* Search form */}
              <div style={{ display: 'flex', gap: 0, border: `1px solid ${loading ? 'var(--orange)' : 'var(--border-light)'}`, background: 'var(--card)', marginBottom: 12, boxShadow: loading ? '0 0 0 1px var(--orange)' : 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                <select value={mode} onChange={e => setMode(e.target.value)} disabled={loading}
                  style={{ width: 180, padding: '18px 12px', background: 'transparent', border: 'none', borderRight: '1px solid var(--border-light)', outline: 'none', color: 'var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer', appearance: 'none', textAlign: 'center', letterSpacing: 1, flexShrink: 0 }}>
                  {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <div ref={acRef} style={{ position: 'relative', flex: 1 }}>
                  <input value={city} onChange={e => handleCityChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); runSearch() } if (e.key === 'Escape') setShowSuggestions(false) }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="City" disabled={loading} autoComplete="off"
                    style={{ width: '100%', padding: '18px 20px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }} />
                  {acLoading && (
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                      <div style={{ width: 10, height: 10, border: '1px solid var(--border-light)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    </div>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: -1, right: -1, background: 'var(--card)', border: '1px solid var(--border-light)', borderTop: 'none', zIndex: 300 }}>
                      {suggestions.map((s, i) => (
                        <div key={i} onMouseDown={() => selectSuggestion(s)}
                          style={{ padding: '11px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#1f1d19')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)' }}>{s.city}</span>
                            {s.county && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1, marginLeft: 8 }}>{s.county} CO.</span>}
                          </div>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, flexShrink: 0 }}>{s.state}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => runSearch()} disabled={loading || !city.trim()}
                  style={{ padding: '18px 36px', background: loading ? '#333' : 'var(--orange)', border: 'none', borderLeft: '1px solid var(--border-light)', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: 'var(--black)', transition: 'background 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {loading ? 'SCANNING...' : 'SEARCH'}
                </button>
              </div>

              {/* Operator tips */}
              {!searched && !loading && (
                <div style={{ marginTop: 32, marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>Operator Intelligence</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>
                      — {mode === 'annuities' ? 'how to find FIA & MYGA producers hiding in plain sight' : 'how to get the most out of every search'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    {(mode === 'annuities' ? ANNUITY_TIPS : OPERATOR_TIPS).map((tip, i) => (
                      <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderTop: `2px solid ${tip.color}`, padding: '20px 22px' }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: tip.color, letterSpacing: 2, marginBottom: 10 }}>{tip.tag}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 8, lineHeight: 1.3 }}>{tip.headline}</div>
                        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.7 }}>{tip.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading */}
          {loading && currentStep >= 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--orange)', animation: 'loadSlide 1s ease-in-out infinite' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {LOADING_STEPS.map((step, i) => (
                  <div key={step} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10, color: i < currentStep ? 'var(--green)' : i === currentStep ? 'var(--orange)' : '#333', transition: 'color 0.3s' }}>
                    <span style={{ fontSize: 8 }}>{i < currentStep ? '●' : i === currentStep ? '◐' : '○'}</span>
                    {step}
                    {i === currentStep && <span style={{ animation: 'pulse 1s infinite', fontSize: 8 }}>...</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: '16px 20px', border: '1px solid var(--red)', background: 'rgba(255,23,68,0.05)', color: 'var(--red)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1, marginBottom: 32 }}>
              {error}
            </div>
          )}

          {/* Results */}
          {searched && !loading && (
            <>
              {/* Results header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  {searchLabel} — {MODES.find(m => m.value === mode)?.label}
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)' }}>◈ {hotCount} HOT</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--yellow)' }}>{warmCount} WARM</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--orange)' }}>{agents.length} TOTAL</div>
                </div>
              </div>

              {agents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#222', marginBottom: 12 }}>NO AGENTS FOUND</div>
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>Try a larger city or different search terms.</div>
                </div>
              ) : (
                // ── Two column layout ──
                <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 0, alignItems: 'start' }}>

                  {/* Left: list */}
                  <div style={{ borderRight: '1px solid var(--border)', background: 'var(--card)', border: '1px solid var(--border)' }}>
                    {/* Filter bar */}
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4 }}>
                      {[
                        { label: `${hotCount} HOT`, filter: 'hot', color: 'var(--green)' },
                        { label: `${warmCount} WARM`, filter: 'warm', color: 'var(--yellow)' },
                        { label: `${agents.filter(a => a.hiring).length} HIRING`, filter: 'hiring', color: 'var(--green)' },
                        { label: `${agents.filter(a => a.youtube_channel).length} YT`, filter: 'yt', color: '#ff4444' },
                      ].map(f => (
                        <div key={f.filter} style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '3px 7px', border: `1px solid ${f.color}30`, color: f.color, letterSpacing: 1 }}>
                          {f.label}
                        </div>
                      ))}
                    </div>

                    {visibleAgents.map((agent, i) => (
                      <CompactAgentCard key={i} agent={agent} index={i} isSelected={selectedIndex === i} onSelect={() => setSelectedIndex(i)} />
                    ))}

                    {coldCount > 0 && (
                      <button onClick={() => setShowAll(v => !v)}
                        style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, cursor: 'pointer', textAlign: 'center' }}>
                        {showAll ? `▲ HIDE ${coldCount} PASS` : `▼ SHOW ${coldCount} PASS`}
                      </button>
                    )}
                  </div>

                  {/* Right: detail or market summary */}
                  <div ref={detailRef} className="detail-scroll" style={{
                    position: 'sticky', top: 16,
                    maxHeight: 'calc(100vh - 120px)',
                    overflowY: 'auto',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderLeft: 'none',
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
      )}

      {/* ════════════════ AGENT LOOKUP ════════════════ */}
      {searchMode === 'lookup' && (
        <div>
          <div style={{ display: 'flex', gap: 0, border: `1px solid ${lookupLoading ? 'var(--orange)' : 'var(--border-light)'}`, background: 'var(--card)', marginBottom: 2, boxShadow: lookupLoading ? '0 0 0 1px var(--orange)' : 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}>
            <select value={mode} onChange={e => setMode(e.target.value)} disabled={lookupLoading}
              style={{ width: 180, padding: '18px 12px', background: 'transparent', border: 'none', borderRight: '1px solid var(--border-light)', outline: 'none', color: 'var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer', appearance: 'none', textAlign: 'center', letterSpacing: 1, flexShrink: 0 }}>
              {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <input value={lookupName} onChange={e => setLookupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && runLookup()}
              placeholder="Agent or agency name — e.g. John Smith Insurance"
              disabled={lookupLoading} autoComplete="off"
              style={{ flex: 1, padding: '18px 20px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: 1 }} />
            <button onClick={runLookup} disabled={lookupLoading || !lookupName.trim()}
              style={{ padding: '18px 36px', background: 'transparent', border: 'none', borderLeft: '1px solid var(--border-light)', cursor: lookupLoading || !lookupName.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3, color: lookupLoading ? '#333' : 'var(--orange)', transition: 'color 0.15s', whiteSpace: 'nowrap' }}>
              {lookupLoading ? 'SCANNING...' : '⊕ LOOKUP'}
            </button>
          </div>

          <div ref={acRef} style={{ position: 'relative', marginBottom: 2 }}>
            <input value={city} onChange={e => handleCityChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); runLookup() } if (e.key === 'Escape') setShowSuggestions(false) }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="City (optional — improves accuracy)" disabled={lookupLoading} autoComplete="off"
              style={{ width: '100%', padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', outline: 'none', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5, boxSizing: 'border-box' }} />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border-light)', borderTop: 'none', zIndex: 300 }}>
                {suggestions.map((s, i) => (
                  <div key={i} onMouseDown={() => selectSuggestion(s)}
                    style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1f1d19')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)' }}>{s.city}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2 }}>{s.state}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1, marginBottom: 24 }}>
            SEARCHES THE OPEN WEB · WORKS WITHOUT A GOOGLE BUSINESS LISTING · CITY + STATE OPTIONAL BUT IMPROVE ACCURACY
          </div>

          {lookupLoading && lookupStep >= 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ position: 'absolute', left: '-40%', width: '40%', height: '100%', background: 'var(--orange)', animation: 'loadSlide 1s ease-in-out infinite' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {LOOKUP_STEPS.map((step, i) => (
                  <div key={step} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10, color: i < lookupStep ? 'var(--green)' : i === lookupStep ? 'var(--orange)' : '#333', transition: 'color 0.3s' }}>
                    <span style={{ fontSize: 8 }}>{i < lookupStep ? '●' : i === lookupStep ? '◐' : '○'}</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {lookupError && (
            <div style={{ padding: '16px 20px', border: '1px solid var(--red)', background: 'rgba(255,23,68,0.05)', color: 'var(--red)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1, marginBottom: 24 }}>
              {lookupError}
            </div>
          )}

          {lookupResult && !lookupLoading && (
            <div style={{ animation: 'slideIn 0.3s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', marginBottom: 2, background: lookupResult.confidence === 'HIGH' ? 'rgba(0,230,118,0.04)' : lookupResult.confidence === 'MEDIUM' ? 'rgba(255,214,0,0.04)' : 'rgba(255,85,0,0.04)', border: `1px solid ${lookupResult.confidence === 'HIGH' ? 'rgba(0,230,118,0.2)' : lookupResult.confidence === 'MEDIUM' ? 'rgba(255,214,0,0.2)' : 'rgba(255,85,0,0.2)'}` }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, color: lookupResult.confidence === 'HIGH' ? 'var(--green)' : lookupResult.confidence === 'MEDIUM' ? 'var(--yellow)' : 'var(--orange)' }}>
                  {lookupResult.confidence === 'HIGH' ? '● HIGH CONFIDENCE' : lookupResult.confidence === 'MEDIUM' ? '◐ MEDIUM CONFIDENCE' : '○ LOW CONFIDENCE'}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1 }}>{lookupResult.confidence_note}</span>
                {lookupResult.source_url && (
                  <a href={lookupResult.source_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1, textDecoration: 'none', marginLeft: 'auto' }}>SOURCE ↗</a>
                )}
              </div>

              <div style={{ background: 'var(--card)', border: '1px solid var(--border-light)', borderLeft: `3px solid ${lookupResult.flag === 'hot' ? 'var(--green)' : lookupResult.flag === 'warm' ? 'var(--yellow)' : 'var(--border)'}` }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>{lookupResult.name}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{lookupResult.type}</div>
                    {lookupResult.phone && (
                      <a href={`tel:${lookupResult.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'var(--white)', textDecoration: 'none', fontFamily: "'DM Mono', monospace", fontSize: 13, marginBottom: 12 }}>
                        📞 {lookupResult.phone}
                      </a>
                    )}
                    {lookupResult.about && <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.7)', lineHeight: 1.65, marginBottom: 12 }}>{lookupResult.about}</p>}
                    {lookupResult.notes && (
                      <div style={{ padding: '12px 14px', background: 'var(--orange-dim)', borderLeft: '2px solid var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 0.5, color: 'var(--white)', lineHeight: 1.7, marginBottom: 12 }}>
                        {lookupResult.notes}
                      </div>
                    )}
                    {lookupResult.website && (
                      <a href={lookupResult.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,85,0,0.06)', border: '1px solid rgba(255,85,0,0.25)', color: 'var(--orange)', textDecoration: 'none', marginBottom: 12 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{lookupResult.website}</span>
                        <span>↗</span>
                      </a>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {lookupResult.youtube_channel && (
                        <a href={lookupResult.youtube_channel} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', border: '1px solid #ff4444', color: '#ff4444', textDecoration: 'none', letterSpacing: 1 }}>YOUTUBE ↗</a>
                      )}
                      {lookupResult.contact_email && (
                        <a href={`mailto:${lookupResult.contact_email}`} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', border: '1px solid var(--border)', color: '#666', textDecoration: 'none', letterSpacing: 1 }}>✉ {lookupResult.contact_email}</a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <ScoreCircle score={lookupResult.score} size={64} />
                    <FlagBadge flag={lookupResult.flag} />
                  </div>
                </div>

                {(lookupResult.carriers || []).length > 0 && lookupResult.carriers[0] !== 'Unknown' && (
                  <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1, marginRight: 4 }}>CARRIERS</span>
                    {lookupResult.carriers.map((c, i) => (
                      <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px', border: '1px solid var(--border-light)', color: 'var(--muted)', letterSpacing: 0.5 }}>{c}</span>
                    ))}
                  </div>
                )}

                <div style={{ padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <a href={`/dashboard/anathema?name=${encodeURIComponent(lookupResult.name)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}${lookupResult.website ? `&url=${encodeURIComponent(lookupResult.website)}` : ''}`}
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '6px 14px', border: '1px solid rgba(0,230,118,0.3)', color: 'var(--green)', textDecoration: 'none', letterSpacing: 2 }}>
                    ◈ RUN ANATHEMA SCAN →
                  </a>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>Deep-scan for captive affiliation</span>
                </div>
              </div>

              <button onClick={() => { setLookupResult(null); setLookupName('') }}
                style={{ marginTop: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: '7px 14px', cursor: 'pointer' }}>
                CLEAR
              </button>
            </div>
          )}

          {!lookupResult && !lookupLoading && !lookupError && (
            <div style={{ marginTop: 32 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>HOW AGENT LOOKUP WORKS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {[
                  { n: '01', title: 'Open web search', body: 'Searches Google organic results for the agent\'s name — not just Google Business listings. Works even if they have no local listing.' },
                  { n: '02', title: 'Website crawl', body: 'Finds their website from search results and crawls it for carrier signals, independent language, and contact info.' },
                  { n: '03', title: 'AI scoring', body: 'Same scoring engine as Market Sweep. HOT, WARM, or COLD with a confidence rating based on how much data was found.' },
                ].map(c => (
                  <div key={c.n} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px 22px' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2, marginBottom: 10 }}>{c.n}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 8, lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: '#555', lineHeight: 1.7 }}>{c.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 40px', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading...</div>}>
      <SearchPageInner />
    </Suspense>
  )
}
