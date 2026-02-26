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

export default function XenoEgg() {
  const [phase, setPhase] = useState<Phase>('dormant')
  const [spores, setSpores] = useState<Spore[]>([])
  const timers = useRef<NodeJS.Timeout[]>([])

  function schedule(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms))
  }
  function clearAll() { timers.current.forEach(clearTimeout); timers.current = [] }

  function infect() {
    if (phase !== 'dormant') return
    setPhase('infected')

    setSpores(Array.from({ length: 28 }, (_, i) => ({
      id: i,
      endX: 2 + Math.random() * 96,
      endY: 2 + Math.random() * 96,
      size: 3 + Math.random() * 4,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 3,
      opacity: 0.15 + Math.random() * 0.25,
    })))

    schedule(() => setPhase('recovering'), 16000)
    schedule(() => {
      setPhase('dormant')
      setSpores([])
    }, 18000)
  }

  useEffect(() => () => clearAll(), [])

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,230,118,0.5); opacity: 0.6; }
          50% { box-shadow: 0 0 0 5px rgba(0,230,118,0); opacity: 0.95; }
        }
        @keyframes sporeDrift {
          0% { 
            left: calc(var(--startX) - 1px); 
            top: calc(var(--startY) - 1px); 
            opacity: 0; 
            transform: scale(0); 
          }
          8% { opacity: var(--op); transform: scale(1); }
          88% { opacity: var(--op); }
          100% { 
            left: var(--ex); 
            top: var(--ey); 
            opacity: 0; 
            transform: scale(0.2); 
          }
        }
      `}</style>

      {/* SPORES — drift subtly across the page */}
      {spores.map(s => (
        <div
          key={s.id}
          style={{
            position: 'fixed',
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,230,118,0.9) 0%, rgba(0,230,118,0.2) 70%, transparent 100%)',
            zIndex: 9997,
            pointerEvents: 'none',
            '--startX': 'calc(100vw - 6%)',
            '--startY': 'calc(100vh - 18%)',
            '--op': s.opacity,
            '--ex': `${s.endX}vw`,
            '--ey': `${s.endY}vh`,
            animation: `sporeDrift ${s.duration}s ease-in-out ${s.delay}s both`,
          } as React.CSSProperties}
        />
      ))}

      {/* THE DOT — unchanged */}
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
