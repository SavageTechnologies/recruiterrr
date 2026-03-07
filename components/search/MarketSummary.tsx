import type { Agent } from './types'
import { resolveMode } from './searchData'

export function MarketSummary({ agents, searchLabel, mode }: { agents: Agent[]; searchLabel: string; mode: string }) {
  const hot      = agents.filter(a => a.flag === 'hot')
  const warm     = agents.filter(a => a.flag === 'warm')
  const hiring   = agents.filter(a => a.hiring)
  const youtube  = agents.filter(a => a.youtube_channel)
  const hasWeb   = agents.filter(a => a.website)
  const avgScore = agents.length ? Math.round(agents.reduce((s, a) => s + a.score, 0) / agents.length) : 0
  const topAgent = agents[0]

  // resolveMode falls back to medicare if mode is unrecognized (e.g. 'financial'
  // restored from an old saved search) — UI never renders blank.
  const resolvedMode = resolveMode(mode)

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
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-3)', letterSpacing: 1, marginTop: 3 }}>{resolvedMode.desc}</div>
      </div>

      <div style={{
        padding: '12px 14px', background: 'var(--bg)',
        border: `1px solid ${verdict.color}30`, borderLeft: `3px solid ${verdict.color}`,
        borderRadius: 'var(--radius)',
      }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: verdict.color, letterSpacing: 2, marginBottom: 4, fontWeight: 600 }}>{verdict.label}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-1)', lineHeight: 1.5 }}>{verdict.desc}</div>
      </div>

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
