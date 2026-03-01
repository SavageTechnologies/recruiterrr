'use client'

import { useState, useEffect, useRef } from 'react'

type Phase = 'dormant' | 'infected' | 'recovering'

interface Spore {
  id: number
  endX: number
  endY: number
  size: number
  duration: number
  delay: number
  opacity: number
}

interface StrainSweep {
  id: number
  y: number        // vh position
  duration: number // seconds to cross screen
  delay: number
  opacity: number
  direction: 1 | -1
}

const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!%&×'
const ORIGINAL_LABEL = 'Producer Intelligence Platform'
const INFECTED_LABEL = 'PATHOGEN A0-3959X.91–15 ACTIVE'
const STRAIN = 'CHEMICAL A0-3959X.91–15 · CHEMICAL A0-3959X.91–15 · CHEMICAL A0-3959X.91–15 · CHEMICAL A0-3959X.91–15 · '

function scramble(target: string, progress: number): string {
  return target.split('').map((char, i) => {
    if (char === ' ') return ' '
    const pos = i / target.replace(/ /g, '').length
    if (progress < pos + 0.15 && Math.random() > 0.35) {
      return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
    }
    return char
  }).join('')
}

export default function XenoEgg() {
  const [phase, setPhase] = useState<Phase>('dormant')
  const [spores, setSpores] = useState<Spore[]>([])
  const [label, setLabel] = useState(ORIGINAL_LABEL)
  const [sweeps, setSweeps] = useState<StrainSweep[]>([])
  const [watermarkVisible, setWatermarkVisible] = useState(false)
  const timers = useRef<NodeJS.Timeout[]>([])
  const raf = useRef<number>(0)

  function later(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
    return t
  }

  function clearAll() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    cancelAnimationFrame(raf.current)
  }

  function animateLabel(to: string, onDone?: () => void) {
    let progress = 0
    const tick = () => {
      progress += 0.035
      setLabel(scramble(to, progress))
      if (progress < 1.3) {
        raf.current = requestAnimationFrame(tick)
      } else {
        setLabel(to)
        onDone?.()
      }
    }
    raf.current = requestAnimationFrame(tick)
  }

  function infect() {
    if (phase !== 'dormant') return
    setPhase('infected')

    // Spore burst — radial from dot position
    setSpores(Array.from({ length: 52 }, (_, i) => {
      const angle = (i / 52) * 360 + (Math.random() - 0.5) * 15
      const rad = (angle * Math.PI) / 180
      const dist = 25 + Math.random() * 70
      return {
        id: i,
        endX: 94 + Math.cos(rad) * dist * 1.4,
        endY: 82 + Math.sin(rad) * dist * 0.85,
        size: 2 + Math.random() * 5,
        duration: 4 + Math.random() * 7,
        delay: Math.random() * 1.2,
        opacity: 0.12 + Math.random() * 0.3,
      }
    }))

    // Strain text sweeps at staggered vertical positions
    setSweeps([
      { id: 0, y: 18,  duration: 9,  delay: 0.2, opacity: 0.18, direction: 1  },
      { id: 1, y: 37,  duration: 11, delay: 1.1, opacity: 0.12, direction: -1 },
      { id: 2, y: 55,  duration: 8,  delay: 0.6, opacity: 0.20, direction: 1  },
      { id: 3, y: 72,  duration: 13, delay: 1.8, opacity: 0.10, direction: -1 },
      { id: 4, y: 88,  duration: 10, delay: 0.9, opacity: 0.15, direction: 1  },
    ])

    // Glitch label → infected
    later(() => animateLabel(INFECTED_LABEL, () => {
      later(() => setWatermarkVisible(true), 200)
    }), 300)

    // Glitch label back + hide watermark + clear sweeps
    later(() => {
      setWatermarkVisible(false)
      later(() => animateLabel(ORIGINAL_LABEL), 500)
      later(() => setSweeps([]), 2000)
    }, 9000)

    // Full recovery
    later(() => setPhase('recovering'), 13000)
    later(() => {
      setPhase('dormant')
      setSpores([])
      setLabel(ORIGINAL_LABEL)
    }, 15000)
  }

  useEffect(() => () => clearAll(), [])

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,230,118,0.5); opacity: 0.6; }
          50% { box-shadow: 0 0 0 6px rgba(0,230,118,0); opacity: 1; }
        }
        @keyframes dotBurst {
          0%   { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(0,230,118,0.9); }
          40%  { transform: scale(3); box-shadow: 0 0 0 16px rgba(0,230,118,0.2); }
          100% { transform: scale(0); opacity: 0; box-shadow: 0 0 0 40px rgba(0,230,118,0); }
        }
        @keyframes sporeBurst {
          0%   { left: var(--sx); top: var(--sy); opacity: 0; transform: scale(0); }
          6%   { opacity: var(--op); transform: scale(1.5); }
          18%  { transform: scale(1); }
          82%  { opacity: var(--op); }
          100% { left: var(--ex); top: var(--ey); opacity: 0; transform: scale(0.1); }
        }
        @keyframes strainSweepLTR {
          0%   { transform: translateX(-100%); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(100vw); opacity: 0; }
        }
        @keyframes strainSweepRTL {
          0%   { transform: translateX(100vw); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes wmFadeIn {
          from { opacity: 0; letter-spacing: 12px; }
          to   { opacity: 1; letter-spacing: 6px; }
        }
        @keyframes wmFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>

      {/* SPORES */}
      {spores.map(s => (
        <div
          key={s.id}
          style={{
            position: 'fixed',
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,230,118,1) 0%, rgba(0,230,118,0.3) 55%, transparent 100%)',
            zIndex: 9997,
            pointerEvents: 'none',
            '--sx': '94vw',
            '--sy': '82vh',
            '--op': s.opacity,
            '--ex': `${s.endX}vw`,
            '--ey': `${s.endY}vh`,
            animation: `sporeBurst ${s.duration}s cubic-bezier(0.15, 0.85, 0.35, 1) ${s.delay}s both`,
          } as React.CSSProperties}
        />
      ))}

      {/* STRAIN SWEEPS — replace the scan line */}
      {sweeps.map(sw => (
        <div
          key={sw.id}
          style={{
            position: 'fixed',
            top: `${sw.y}vh`,
            left: 0,
            width: 'max-content',
            whiteSpace: 'nowrap',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: 4,
            color: `rgba(0,230,118,${sw.opacity})`,
            zIndex: 9998,
            pointerEvents: 'none',
            userSelect: 'none',
            animation: `${sw.direction === 1 ? 'strainSweepLTR' : 'strainSweepRTL'} ${sw.duration}s linear ${sw.delay}s both`,
          }}
        >
          {STRAIN}
        </div>
      ))}

      {/* WATERMARK — diagonal center, hidden until infected */}
      {watermarkVisible && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-10deg)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(10px, 1.8vw, 16px)',
          letterSpacing: 6,
          color: 'rgba(0,230,118,0.09)',
          whiteSpace: 'nowrap',
          zIndex: 9996,
          pointerEvents: 'none',
          userSelect: 'none',
          textTransform: 'uppercase',
          animation: 'wmFadeIn 0.8s ease forwards',
        }}>
          CHEMICAL A0-3959X.91–15
        </div>
      )}

      {/* GLITCH LABEL overlay */}
      {phase !== 'dormant' && (
        <div style={{
          position: 'absolute',
          top: 100,
          left: 40,
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: label === INFECTED_LABEL ? '#00e676' : 'var(--orange)',
          letterSpacing: 3,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 10,
          pointerEvents: 'none',
          transition: 'color 0.3s',
        }}>
          <span style={{
            width: 24,
            height: 1,
            background: label === INFECTED_LABEL ? '#00e676' : 'var(--orange)',
            display: 'inline-block',
            transition: 'background 0.3s',
          }} />
          {label}
        </div>
      )}

      {/* THE DOT */}
      <div
        onClick={infect}
        style={{
          position: 'absolute',
          bottom: '18%',
          right: '6%',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#00e676',
          animation: phase === 'infected'
            ? 'dotBurst 0.7s ease-out forwards'
            : 'dotPulse 3s ease-in-out infinite',
          cursor: phase === 'dormant' ? 'pointer' : 'default',
          zIndex: 50,
        }}
        title="..."
      />
    </>
  )
}
