'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type TooltipPosition = 'right' | 'right-bottom' | 'top-right' | 'center'

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

// ── TOUR STEPS ────────────────────────────────────────────────────────────────
// Selectors now target sidebar nav items (.dash-nav-item).
// Positions changed from 'bottom' to 'right' since nav is on the left.

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    position: 'center',
    tag: 'WELCOME',
    tagColor: 'var(--orange)',
    headline: 'WELCOME TO\nRECRUITERRR.',
    body: "You're now inside the most powerful agent recruiting platform in insurance. This 60-second tour shows you exactly how to run your first search and what every tool does.",
    tip: "Use the arrow keys or click NEXT to move through the tour.",
    tipTag: 'QUICK TIP',
    tipColor: 'var(--text-3)',
  },
  {
    id: 'dashboard',
    target: '.dash-nav-item[data-nav="dashboard"]',
    position: 'right',
    tag: 'STEP 01',
    tagColor: 'var(--orange)',
    headline: 'YOUR DASHBOARD.',
    body: "Home base. See your stats at a glance — searches run, agents scored, hot leads identified, states covered. Your recent search history lives here too.",
    tip: "Your numbers grow with every search. The more markets you run, the more the dashboard tells you.",
    tipTag: 'HOME BASE',
    tipColor: 'var(--orange)',
    spotlightPadding: 8,
  },
  {
    id: 'search',
    target: '.dash-nav-item[href="/dashboard/search"]',
    position: 'right',
    tag: 'STEP 02',
    tagColor: 'var(--orange)',
    headline: 'SEARCH A MARKET.',
    body: "Start here. Enter any city, pick your vertical — Medicare, Life, or Annuities — and run it. The engine pulls every independent-leaning agent in that market and scores them automatically.",
    tip: "HOT agents have fired the strongest independent signals. Work them first.",
    tipTag: 'PRIORITY',
    tipColor: 'var(--sig-green)',
    spotlightPadding: 8,
  },
  {
    id: 'lookup',
    target: '.dash-nav-item[href="/dashboard/search"]',
    position: 'right',
    tag: 'STEP 03',
    tagColor: 'var(--orange)',
    headline: 'AGENT LOOKUP.',
    body: "Already have a name? Switch to Agent Lookup on the Search page and type any agent or agency name. The engine searches the open web — no Google Business listing required.",
    tip: "Useful when a referral gives you a name, or you spot someone on LinkedIn.",
    tipTag: 'USE CASE',
    tipColor: 'var(--orange)',
    spotlightPadding: 8,
  },
  {
    id: 'database',
    target: '.dash-nav-item[href="/dashboard/database"]',
    position: 'right',
    tag: 'STEP 04',
    tagColor: 'var(--text-3)',
    headline: 'YOUR DATABASE.',
    body: "Every agent you search or look up gets saved here automatically. Filter by state, HOT/WARM/COLD flag, YouTube presence, hiring status. Your CRM — it gets more powerful with every search.",
    tip: "The database remembers everything. Your search history compounds over time.",
    tipTag: 'INTEL',
    tipColor: 'var(--text-3)',
    spotlightPadding: 8,
  },
  {
    id: 'billing',
    target: 'button[data-billing="true"]',
    position: 'right',
    tag: 'STEP 05',
    tagColor: 'var(--text-3)',
    headline: 'BILLING.',
    body: "Manage your plan, update payment, or download receipts at any time. Your subscription is fully active right now — this is just here when you need it.",
    spotlightPadding: 8,
  },
  {
    id: 'anathema',
    target: '.dash-nav-item[href="/dashboard/anathema"]',
    position: 'right',
    tag: 'STEP 06',
    tagColor: 'var(--sig-green)',
    headline: 'ANATHEMA.',
    body: "Run a deep scan on a single agent — website, carrier affiliations, social presence, hiring signals. It tells you exactly what captive stage they're in and how to approach them.",
    tip: "Run Anathema on your HOT agents before you call. Know their upline before you dial.",
    tipTag: 'INTEL',
    tipColor: 'var(--sig-green)',
    spotlightPadding: 8,
  },
  {
    id: 'prometheus',
    target: '.dash-nav-item[href="/dashboard/prometheus"]',
    position: 'right',
    tag: 'STEP 07',
    tagColor: 'var(--orange)',
    headline: 'PROMETHEUS.',
    body: "Full intelligence report on any FMO or agency. Contacts, recruiting activity, carrier lineup, agent sentiment, and your exact sales angles against them.",
    tip: "Their trip thresholds, contract complaints, and tech gaps become your pitch.",
    tipTag: 'STRATEGY',
    tipColor: 'var(--orange)',
    spotlightPadding: 8,
  },
  {
    id: 'go',
    target: null,
    position: 'center',
    tag: 'READY',
    tagColor: 'var(--orange)',
    headline: "YOU'RE\nREADY.",
    body: "Search → Score → Scan → Close. Start with Search, pick a city you know, and run your first market. The platform does the rest.",
    tip: "Come back to Anathema and Prometheus once you have agents worth digging into.",
    tipTag: 'WORKFLOW',
    tipColor: 'var(--orange)',
  },
]

// ── HELPERS ───────────────────────────────────────────────────────────────────

type Rect = { top: number; left: number; width: number; height: number }

function getRect(selector: string, padding = 8): Rect | null {
  try {
    const el = document.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return null
    return {
      top:    r.top    - padding,
      left:   r.left   - padding,
      width:  r.width  + padding * 2,
      height: r.height + padding * 2,
    }
  } catch { return null }
}

// ── SPOTLIGHT ─────────────────────────────────────────────────────────────────

function Spotlight({ rect }: { rect: Rect }) {
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1440
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900
  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1001 }}>
      <defs>
        <mask id="sm">
          <rect width={vw} height={vh} fill="white" />
          <rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} fill="black" rx={3} />
        </mask>
      </defs>
      <rect width={vw} height={vh} fill="rgba(0,0,0,0.75)" mask="url(#sm)" />
    </svg>
  )
}

// ── GLOW RING ─────────────────────────────────────────────────────────────────

function GlowRing({ rect, color }: { rect: Rect; color: string }) {
  return (
    <div style={{
      position: 'fixed', top: rect.top, left: rect.left,
      width: rect.width, height: rect.height,
      pointerEvents: 'none', zIndex: 1002,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        border: `1.5px solid ${color}`,
        boxShadow: `0 0 0 1px ${color}33, 0 0 16px 4px ${color}33`,
        animation: 'tourGlow 2s ease-in-out infinite',
        borderRadius: 3,
      }} />
    </div>
  )
}

// ── TOOLTIP ───────────────────────────────────────────────────────────────────

function Tooltip({ step, stepIndex, total, rect, onNext, onPrev, onSkip, isLast }: {
  step: TourStep; stepIndex: number; total: number; rect: Rect | null
  onNext: () => void; onPrev: () => void; onSkip: () => void; isLast: boolean
}) {
  const W = 380
  const isCentered = step.position === 'center' || !rect

  let style: React.CSSProperties
  if (isCentered) {
    style = {
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(500px, calc(100vw - 48px))',
    }
  } else {
    // Position tooltip to the RIGHT of the sidebar element
    const GAP = 14
    const left = rect!.left + rect!.width + GAP
    let top = rect!.top + rect!.height / 2 - 80
    // Keep on screen vertically
    top = Math.max(16, Math.min(top, window.innerHeight - 380))
    style = { position: 'fixed', top, left, width: W }
  }

  // Resolve any CSS var strings to display colors
  const tagColor = step.tagColor

  return (
    <div style={{
      ...style, zIndex: 1003,
      background: 'var(--bg-raised)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 24px 60px var(--shadow-lg)',
    }}>
      {/* Arrow pointing left (toward sidebar) */}
      {!isCentered && rect && (
        <div style={{
          position: 'absolute', left: -7, top: 40,
          width: 14, height: 14, overflow: 'hidden',
        }}>
          <div style={{
            width: 10, height: 10,
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            transform: 'rotate(45deg)',
            margin: '3px 4px',
          }} />
        </div>
      )}

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 3, padding: '16px 20px 0' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            height: 2, flex: 1,
            background: i <= stepIndex ? 'var(--orange)' : 'var(--border)',
            transition: 'background 0.3s',
            borderRadius: 1,
          }} />
        ))}
      </div>

      <div style={{ padding: '14px 20px' }}>
        {/* Tag + counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3,
            color: 'var(--orange)',
            background: 'var(--orange-dim)', border: '1px solid var(--orange-border)',
            padding: '3px 8px', borderRadius: 3,
          }}>{step.tag}</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-3)', letterSpacing: 1 }}>
            {stepIndex + 1} / {total}
          </span>
        </div>

        {/* Headline */}
        <h3 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: isCentered ? 'clamp(36px, 5vw, 52px)' : 28,
          letterSpacing: 2, lineHeight: 0.95,
          color: 'var(--text-1)', marginBottom: 10, whiteSpace: 'pre-line',
        }}>
          {step.headline}
        </h3>

        {/* Body */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 'var(--text-sm)',
          color: 'var(--text-2)', lineHeight: 1.65,
          marginBottom: step.tip ? 12 : 0,
        }}>
          {step.body}
        </p>

        {/* Tip */}
        {step.tip && (
          <div style={{
            borderLeft: '2px solid var(--orange)',
            background: 'var(--orange-dim)',
            padding: '9px 12px', borderRadius: '0 var(--radius) var(--radius) 0',
          }}>
            {step.tipTag && (
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 8,
                letterSpacing: 3, color: 'var(--orange)',
                textTransform: 'uppercase', marginBottom: 4,
              }}>{step.tipTag}</div>
            )}
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12,
              color: 'var(--text-2)', lineHeight: 1.55,
            }}>{step.tip}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        gap: 8,
      }}>
        <button
          onClick={onSkip}
          style={{
            background: 'none', border: 'none', color: 'var(--text-3)',
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', padding: '4px 0',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >SKIP TOUR</button>

        <div style={{ display: 'flex', gap: 8 }}>
          {stepIndex > 0 && (
            <button
              onClick={onPrev}
              style={{
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-2)', fontFamily: "'DM Mono', monospace",
                fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                padding: '8px 14px', cursor: 'pointer', borderRadius: 'var(--radius)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >←</button>
          )}
          <button
            onClick={onNext}
            style={{
              background: isLast ? 'var(--orange)' : 'transparent',
              border: `1px solid ${isLast ? 'var(--orange)' : 'var(--border-strong)'}`,
              color: isLast ? 'white' : 'var(--text-1)',
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              fontWeight: isLast ? 600 : 400,
              letterSpacing: 2, textTransform: 'uppercase',
              padding: '8px 18px', cursor: 'pointer', whiteSpace: 'nowrap',
              borderRadius: 'var(--radius)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >{isLast ? 'LAUNCH →' : 'NEXT →'}</button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [visible, setVisible] = useState(false)
  const busy = useRef(false)

  const step   = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  const measure = useCallback((s: TourStep) => {
    if (!s.target) { setRect(null); return }
    setRect(getRect(s.target, s.spotlightPadding ?? 8))
  }, [])

  useEffect(() => {
    measure(STEPS[0])
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [measure])

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
      setTimeout(() => { setVisible(true); busy.current = false }, 60)
    }, 180)
  }, [measure])

  const handleComplete = useCallback(() => {
    setVisible(false)
    setTimeout(onComplete, 280)
  }, [onComplete])

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
      {/* Full backdrop */}
      {!rect && (
        <div
          onClick={handleComplete}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.25s ease',
          }}
        />
      )}

      {rect && <Spotlight rect={rect} />}
      {rect && visible && <GlowRing rect={rect} color="var(--orange)" />}

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
