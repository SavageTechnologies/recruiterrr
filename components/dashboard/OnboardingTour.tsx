'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TooltipPosition = 'bottom' | 'bottom-left' | 'bottom-right' | 'top' | 'center'

type TourStep = {
  id: string
  target: string | null
  position: TooltipPosition
  tag: string
  tagColor: string
  headline: string
  body: string
  tip?: string
  tipTag?: string
  tipColor?: string
  spotlightPadding?: number
}

// ─── TOUR STEPS ───────────────────────────────────────────────────────────────

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    position: 'center',
    tag: 'WELCOME',
    tagColor: '#ff5500',
    headline: 'WELCOME TO\nRECRUITERRR.',
    body: "You're now inside the most powerful agent recruiting platform in insurance. This 60-second tour shows you exactly how to run your first search and what every tool does.",
    tip: "Use the arrow keys or click NEXT to move through the tour.",
    tipTag: 'QUICK TIP',
    tipColor: '#7a7570',
  },
  {
    id: 'dashboard',
    target: 'nav a[href="/dashboard"]',
    position: 'bottom',
    tag: 'STEP 01',
    tagColor: '#ff5500',
    headline: 'YOUR DASHBOARD.',
    body: "Home base. See your stats at a glance — searches run, agents scored, hot leads identified, states covered. Your recent search history lives here too. Come back here anytime to pick up where you left off.",
    tip: "Your numbers grow with every search. The more markets you run, the more the dashboard tells you.",
    tipTag: 'HOME BASE',
    tipColor: '#ff5500',
    spotlightPadding: 10,
  },
  {
    id: 'search',
    target: 'a[href="/dashboard/search"]',
    position: 'bottom',
    tag: 'STEP 02',
    tagColor: '#ff5500',
    headline: 'SEARCH A MARKET.',
    body: "Start here. Enter any city, pick your vertical — Medicare, Life, or Annuities — and run it. The engine pulls every licensed independent-leaning agent in that market and scores them automatically.",
    tip: "HOT agents have fired the strongest independent signals. Work them first.",
    tipTag: 'PRIORITY',
    tipColor: '#ff5500',
    spotlightPadding: 10,
  },
  {
    id: 'database',
    target: 'a[href="/dashboard/database"]',
    position: 'bottom',
    tag: 'STEP 03',
    tagColor: '#aaaaaa',
    headline: 'YOUR DATABASE.',
    body: "Every agent you ever search gets saved here automatically. Filter by state, HOT/WARM/COLD flag, YouTube presence, hiring status. This is your growing CRM — it gets more powerful with every search you run.",
    tip: "The database remembers everything. Your search history compounds over time.",
    tipTag: 'INTEL',
    tipColor: '#aaaaaa',
    spotlightPadding: 10,
  },
  {
    id: 'billing',
    target: 'button[data-billing="true"]',
    position: 'bottom',
    tag: 'STEP 04',
    tagColor: '#aaaaaa',
    headline: 'BILLING.',
    body: "Manage your plan, update payment, or download receipts at any time. Your subscription is fully active right now — this is just here when you need it.",
    spotlightPadding: 10,
  },
  {
    id: 'anathema',
    target: 'a[href="/dashboard/anathema"]',
    position: 'bottom',
    tag: 'STEP 05',
    tagColor: '#00e676',
    headline: 'ANATHEMA.',
    body: "Run a deep pathogen scan on a single agent — website, carrier affiliations, social presence, hiring signals. It tells you exactly what captive stage they're in and how to approach them. Currently in beta.",
    tip: "Run Anathema on your HOT agents before you call. Know their upline before you dial.",
    tipTag: 'INTEL',
    tipColor: '#00e676',
    spotlightPadding: 10,
  },
  {
    id: 'prometheus',
    target: 'a[href="/dashboard/prometheus"]',
    position: 'bottom-left',
    tag: 'STEP 06',
    tagColor: '#ff5500',
    headline: 'PROMETHEUS.',
    body: "Full intelligence report on any FMO or agency. Contacts, recruiting activity, carrier lineup, agent sentiment, and your exact sales angles against them. Currently in beta.",
    tip: "Their trip thresholds, contract complaints, and tech gaps become your pitch.",
    tipTag: 'STRATEGY',
    tipColor: '#ff5500',
    spotlightPadding: 10,
  },
  {
    id: 'go',
    target: null,
    position: 'center',
    tag: 'READY',
    tagColor: '#ff5500',
    headline: "YOU'RE\nREADY.",
    body: "Search → Score → Scan → Close. Start with Search, pick a city you know, and run your first market. The platform does the rest.",
    tip: "Come back to Anathema and Prometheus once you have agents worth digging into.",
    tipTag: 'WORKFLOW',
    tipColor: '#ff5500',
  },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

type Rect = { top: number; left: number; width: number; height: number }

function getRect(selector: string, padding = 10): Rect | null {
  try {
    const el = document.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return null
    return {
      top: r.top - padding,
      left: r.left - padding,
      width: r.width + padding * 2,
      height: r.height + padding * 2,
    }
  } catch {
    return null
  }
}

// ─── SPOTLIGHT ────────────────────────────────────────────────────────────────

function Spotlight({ rect }: { rect: Rect }) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900
  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1001 }}>
      <defs>
        <mask id="sm">
          <rect width={vw} height={vh} fill="white" />
          <rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} fill="black" rx={2} />
        </mask>
      </defs>
      <rect width={vw} height={vh} fill="rgba(26,24,20,0.86)" mask="url(#sm)" />
    </svg>
  )
}

// ─── GLOW RING ────────────────────────────────────────────────────────────────

function GlowRing({ rect, color }: { rect: Rect; color: string }) {
  return (
    <div style={{
      position: 'fixed',
      top: rect.top, left: rect.left,
      width: rect.width, height: rect.height,
      pointerEvents: 'none', zIndex: 1002,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        border: `1.5px solid ${color}`,
        boxShadow: `0 0 0 1px ${color}33, 0 0 20px 4px ${color}44`,
        animation: 'tourGlow 2s ease-in-out infinite',
      }} />
      {[{ top: -3, left: -3 }, { top: -3, right: -3 }, { bottom: -3, left: -3 }, { bottom: -3, right: -3 }].map((pos, i) => (
        <div key={i} style={{ position: 'absolute', width: 5, height: 5, background: color, ...pos }} />
      ))}
    </div>
  )
}

// ─── TOOLTIP ──────────────────────────────────────────────────────────────────

function Tooltip({ step, stepIndex, total, rect, onNext, onPrev, onSkip, isLast }: {
  step: TourStep; stepIndex: number; total: number; rect: Rect | null
  onNext: () => void; onPrev: () => void; onSkip: () => void; isLast: boolean
}) {
  const W = 380
  const isCentered = step.position === 'center' || !rect
  const c = step.tagColor

  let style: React.CSSProperties
  if (isCentered) {
    style = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(520px, calc(100vw - 48px))' }
  } else {
    const GAP = 14
    let top = rect!.top + rect!.height + GAP
    let left = rect!.left + rect!.width / 2 - W / 2
    if (step.position === 'bottom-left') left = rect!.left + rect!.width - W
    if (step.position === 'bottom-right') left = rect!.left
    left = Math.max(16, Math.min(left, window.innerWidth - W - 16))
    if (top + 320 > window.innerHeight) top = rect!.top - 320 - GAP
    style = { position: 'fixed', top, left, width: W }
  }

  return (
    <div style={{ ...style, zIndex: 1003, background: '#1a1814', border: '1px solid #2e2b27', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>
      {/* Arrow */}
      {!isCentered && rect && (() => {
        const tl = Math.max(16, Math.min(
          step.position === 'bottom-left' ? rect.left + rect.width - W : rect.left + rect.width / 2 - W / 2,
          window.innerWidth - W - 16
        ))
        const ax = Math.max(12, Math.min(rect.left + rect.width / 2 - tl - 6, W - 28))
        return (
          <div style={{ position: 'absolute', top: -6, left: ax, width: 12, height: 6, overflow: 'hidden' }}>
            <div style={{ width: 10, height: 10, background: '#1a1814', border: '1px solid #2e2b27', transform: 'rotate(45deg)', margin: '3px 1px 0' }} />
          </div>
        )
      })()}

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 3, padding: '16px 20px 0' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ height: 2, flex: 1, background: i <= stepIndex ? c : '#2e2b27', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ padding: '14px 20px' }}>
        {/* Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, marginBottom: 10 }}>
          <span style={{ color: c, background: `${c}18`, border: `1px solid ${c}35`, padding: '3px 8px' }}>{step.tag}</span>
          <span style={{ color: '#3a3732' }}>{stepIndex + 1} / {total}</span>
        </div>

        {/* Headline */}
        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isCentered ? 'clamp(38px, 5vw, 54px)' : 28, letterSpacing: 2, lineHeight: 0.92, color: '#f0ede8', marginBottom: 10, whiteSpace: 'pre-line' }}>
          {step.headline}
        </h3>

        {/* Body */}
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(240,237,232,0.68)', lineHeight: 1.65, marginBottom: step.tip ? 12 : 0 }}>
          {step.body}
        </p>

        {/* Tip */}
        {step.tip && (
          <div style={{ borderLeft: `2px solid ${step.tipColor || c}`, background: `${step.tipColor || c}0c`, padding: '9px 12px' }}>
            {step.tipTag && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 3, color: step.tipColor || c, textTransform: 'uppercase', marginBottom: 4 }}>{step.tipTag}</div>
            )}
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(240,237,232,0.58)', lineHeight: 1.55 }}>{step.tip}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #2e2b27', background: 'rgba(0,0,0,0.18)', gap: 8 }}>
        <button onClick={onSkip} style={{ background: 'none', border: 'none', color: '#3a3732', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', padding: '4px 0' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#7a7570')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3a3732')}
        >SKIP TOUR</button>

        <div style={{ display: 'flex', gap: 8 }}>
          {stepIndex > 0 && (
            <button onClick={onPrev} style={{ background: 'none', border: '1px solid #2e2b27', color: '#7a7570', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7a7570'; e.currentTarget.style.color = '#f0ede8' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2b27'; e.currentTarget.style.color = '#7a7570' }}
            >←</button>
          )}
          <button onClick={onNext} style={{ background: isLast ? '#ff5500' : 'transparent', border: `1px solid ${isLast ? '#ff5500' : '#3a3732'}`, color: isLast ? '#1a1814' : '#f0ede8', fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: isLast ? 600 : 400, letterSpacing: 2, textTransform: 'uppercase', padding: '8px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { if (!isLast) { e.currentTarget.style.borderColor = '#ff5500'; e.currentTarget.style.color = '#ff5500' } else e.currentTarget.style.background = '#ff6a1a' }}
            onMouseLeave={e => { if (!isLast) { e.currentTarget.style.borderColor = '#3a3732'; e.currentTarget.style.color = '#f0ede8' } else e.currentTarget.style.background = '#ff5500' }}
          >{isLast ? 'LAUNCH →' : 'NEXT →'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [visible, setVisible] = useState(false)
  const busy = useRef(false)

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  const measure = useCallback((s: TourStep) => {
    if (!s.target) { setRect(null); return }
    setRect(getRect(s.target, s.spotlightPadding ?? 10))
  }, [])

  // Mount
  useEffect(() => {
    measure(STEPS[0])
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Resize
  useEffect(() => {
    const onResize = () => measure(STEPS[stepIndex])
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [stepIndex, measure])

  const goTo = useCallback((next: number) => {
    if (busy.current) return
    busy.current = true
    setVisible(false)
    setTimeout(() => {
      setStepIndex(next)
      measure(STEPS[next])
      setTimeout(() => {
        setVisible(true)
        busy.current = false
      }, 60)
    }, 180)
  }, [measure])

  const handleComplete = useCallback(() => {
    setVisible(false)
    setTimeout(onComplete, 280)
  }, [onComplete])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') isLast ? handleComplete() : goTo(stepIndex + 1)
      if (e.key === 'ArrowLeft' && stepIndex > 0) goTo(stepIndex - 1)
      if (e.key === 'Escape') handleComplete()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stepIndex, isLast, goTo, handleComplete])

  return (
    <>
      <style>{`@keyframes tourGlow { 0%,100%{opacity:0.55} 50%{opacity:1} }`}</style>

      {/* Full backdrop (no spotlight) */}
      {!rect && (
        <div onClick={handleComplete} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(26,24,20,0.88)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }} />
      )}

      {/* SVG spotlight cutout */}
      {rect && <Spotlight rect={rect} />}

      {/* Glow ring */}
      {rect && visible && <GlowRing rect={rect} color={step.tagColor} />}

      {/* Tooltip card */}
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease', pointerEvents: visible ? 'auto' : 'none' }}>
        <Tooltip
          step={step} stepIndex={stepIndex} total={STEPS.length} rect={rect}
          onNext={() => isLast ? handleComplete() : goTo(stepIndex + 1)}
          onPrev={() => stepIndex > 0 && goTo(stepIndex - 1)}
          onSkip={handleComplete}
          isLast={isLast}
        />
      </div>
    </>
  )
}
