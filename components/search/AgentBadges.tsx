import type { Agent } from './types'

export function ScoreCircle({ score, size = 52 }: { score: number; size?: number }) {
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

export function FlagBadge({ flag }: { flag: Agent['flag'] }) {
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
