'use client'

import { useState, useEffect, useRef } from 'react'

type Phase = 'dormant' | 'infected' | 'recovering'

const INFECTION_SEQUENCE = [
  { text: '[ ANATHEMA ] PATHOGEN DETECTED', color: '#00e676' },
  { text: '[ PROMETHEUS ] HOST COMPROMISED', color: '#ff5500' },
  { text: 'STRAIN IDENTIFICATION: IN PROGRESS...', color: '#00e676' },
  { text: '[ ANATHEMA ] CARRIER FINGERPRINT: INTEGRITY', color: '#00e676' },
  { text: '[ PROMETHEUS ] FMO INTEL EXTRACTED', color: '#ff5500' },
  { text: 'STAGE III INFECTION CONFIRMED', color: '#00e676' },
  { text: '[ ANATHEMA ] SPECIMEN ADDED TO DATABASE', color: '#00e676' },
  { text: '[ PROMETHEUS ] COUNTER-PITCH GENERATED', color: '#ff5500' },
  { text: 'CHEMICAL A0-3959X.91–15 RELEASED', color: '#00e676' },
  { text: 'BIOLOGICAL OVERRIDE COMPLETE', color: '#00e676' },
]

export default function XenoEgg() {
  const [phase, setPhase] = useState<Phase>('dormant')
  const [visibleMessages, setVisibleMessages] = useState<typeof INFECTION_SEQUENCE>([])
  const [veins, setVeins] = useState<{ x1: number; y1: number; x2: number; y2: number; len: number }[]>([])
  const timers = useRef<NodeJS.Timeout[]>([])

  function schedule(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms))
  }
  function clearAll() { timers.current.forEach(clearTimeout); timers.current = [] }

  function infect() {
    if (phase !== 'dormant') return
    setPhase('infected')

    setVeins(Array.from({ length: 24 }, () => ({
      x1: 95 + (Math.random() - 0.5) * 8,
      y1: 60 + (Math.random() - 0.5) * 20,
      x2: Math.random() * 100,
      y2: Math.random() * 100,
      len: 150 + Math.random() * 300,
    })))

    INFECTION_SEQUENCE.forEach((msg, i) => {
      schedule(() => setVisibleMessages(prev => [...prev, msg]), i * 400)
    })

    schedule(() => {
      setPhase('recovering')
      schedule(() => {
        setPhase('dormant')
        setVisibleMessages([])
        setVeins([])
      }, 1400)
    }, 6000)
  }

  useEffect(() => () => clearAll(), [])

  const showOverlay = phase === 'infected' || phase === 'recovering'
  const fading = phase === 'recovering'

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,230,118,0.5); opacity: 0.6; }
          50% { box-shadow: 0 0 0 5px rgba(0,230,118,0); opacity: 0.95; }
        }
        @keyframes veinGrow {
          from { stroke-dashoffset: 400; opacity: 0; }
          15% { opacity: 0.8; }
          to { stroke-dashoffset: 0; opacity: 0.15; }
        }
        @keyframes msgSlide {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scanFull {
          0% { top: -3px; opacity: 0.7; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes bgGlow {
          0%,100% { opacity: 0; }
          20%,80% { opacity: 1; }
        }
      `}</style>

      {/* FULL PAGE INFECTION */}
      {showOverlay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', opacity: fading ? 0 : 1, transition: 'opacity 1.4s ease' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 90% 50%, rgba(0,18,6,0.8) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)', animation: 'bgGlow 6s ease-in-out' }} />
          {[0, 0.5, 1.1, 1.9, 2.8].map((delay, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, width: '100%', height: 2, top: 0, background: i % 2 === 0 ? 'linear-gradient(90deg,transparent,rgba(0,230,118,0.5),transparent)' : 'linear-gradient(90deg,transparent,rgba(255,85,0,0.35),transparent)', animation: `scanFull ${1.7 + i * 0.3}s linear ${delay}s infinite` }} />
          ))}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            {veins.map((v, i) => (
              <line key={i} x1={`${v.x1}%`} y1={`${v.y1}%`} x2={`${v.x2}%`} y2={`${v.y2}%`}
                stroke="rgba(0,230,118,0.5)" strokeWidth="0.12"
                strokeDasharray={v.len} strokeDashoffset={v.len}
                style={{ animation: `veinGrow ${1 + i * 0.1}s ease-out ${i * 0.05}s both` }}
              />
            ))}
          </svg>
          <div style={{ position: 'absolute', left: 32, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleMessages.map((msg, i) => (
              <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1.5, color: msg.color, animation: 'msgSlide 0.25s ease both', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ opacity: 0.4 }}>▸</span>{msg.text}
              </div>
            ))}
          </div>
          {[
            { pos: { top: 20, left: 20 }, lines: ['ANATHEMA · ONLINE', 'STAGE IV', 'A0-3959X.91–15'], col: 'rgba(0,230,118,0.3)' },
            { pos: { top: 20, right: 20 }, lines: ['PROMETHEUS · ONLINE', 'INTEL EXTRACTED', 'HOST: COMPROMISED'], col: 'rgba(255,85,0,0.25)' },
            { pos: { bottom: 20, left: 20 }, lines: ['DISTRIBUTION TREE', 'CORRUPTED', 'SPECIMEN LOGGED'], col: 'rgba(0,230,118,0.25)' },
            { pos: { bottom: 20, right: 20 }, lines: ['BIOLOGICAL OVERRIDE', 'COMPLETE', 'RECRUITERRR.COM'], col: 'rgba(255,85,0,0.2)' },
          ].map((c, i) => (
            <div key={i} style={{ position: 'absolute', ...c.pos as any, fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 2, color: c.col, lineHeight: 2, textAlign: i % 2 === 1 ? 'right' : 'left' }}>
              {c.lines.map((l, j) => <div key={j}>{l}</div>)}
            </div>
          ))}
        </div>
      )}

      {/* THE DOT — that's it */}
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
          animation: 'dotPulse 3s ease-in-out infinite',
          cursor: 'pointer',
          zIndex: 50,
          opacity: phase === 'infected' ? 0 : 1,
          transition: 'opacity 0.4s',
        }}
        title="..."
      />
    </>
  )
}
