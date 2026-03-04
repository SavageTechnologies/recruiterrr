'use client'

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TooltipPosition = 'bottom' | 'bottom-left' | 'bottom-right' | 'top' | 'center'

type TourStep = {
  id: string
  // CSS selector for the element to spotlight. null = welcome screen (no spotlight)
  target: string | null
  position: TooltipPosition
  tag: string
  tagColor: string
  headline: string
  body: string
  tip?: string
  tipTag?: string
  tipColor?: string
  // Padding around the spotlight rect (px)
  spotlightPadding?: number
}

// ─── TOUR STEPS ───────────────────────────────────────────────────────────────

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
    tipColor: 'var(--muted)',
    spotlightPadding: 0,
  },
  {
    id: 'search',
    target: 'a[href="/dashboard/search"]',
    position: 'bottom',
    tag: 'STEP 01',
    tagColor: 'var(--orange)',
    headline: 'SEARCH A MARKET.',
    body: "Start here. Enter any city, pick your vertical — Medicare, Life, or Annuities — and run it. The engine pulls every licensed independent-leaning agent in that market and scores them automatically.",
    tip: "HOT agents have fired the strongest independent signals. Work them first.",
    tipTag: 'PRIORITY',
    tipColor: 'var(--orange)',
    spotlightPadding: 10,
  },
  {
    id: 'database',
    target: 'a[href="/dashboard/database"]',
    position: 'bottom',
    tag: 'STEP 02',
    tagColor: '#aaa',
    headline: 'YOUR DATABASE.',
    body: "Every agent you ever search gets saved here automatically. Filter by state, HOT/WARM/COLD flag, YouTube presence, hiring status. This is your growing CRM — it gets more powerful with every search you run.",
    tip: "The database remembers everything. Your search history compounds over time.",
    tipTag: 'INTEL',
    tipColor: '#aaa',
    spotlightPadding: 10,
  },
  {
    id: 'billing',
    target: 'button[data-billing], a[href*="billing"], button:has-text("Billing")',
    position: 'bottom-left',
    tag: 'STEP 03',
    tagColor: '#aaa',
    headline: 'BILLING.',
    body: "Manage your plan, update payment, or download receipts at any time. Your subscription is fully active right now — this button is just here when you need it.",
    spotlightPadding: 10,
  },
  {
    id: 'anathema',
    target: 'a[href="/dashboard/anathema"]',
    position: 'bottom',
    tag: 'STEP 04',
    tagColor: 'var(--green)',
    headline: 'ANATHEMA.',
    body: "Run a deep pathogen scan on a single agent. Website content, carrier affiliations, social presence, hiring signals. It tells you exactly what captive stage they're in and how to approach them.",
    tip: "Run Anathema on HOT agents before you call. Know their upline before you dial.",
    tipTag: 'INTEL',
    tipColor: 'var(--green)',
    spotlightPadding: 10,
  },
  {
    id: 'prometheus',
    target: 'a[href="/dashboard/prometheus"]',
    position: 'bottom-left',
    tag: 'STEP 05',
    tagColor: 'var(--orange)',
    headline: 'PROMETHEUS.',
    body: "Full intelligence report on any FMO or agency. Contacts, recruiting activity, carrier lineup, what agents are saying, and your exact sales angles against them. Know their weaknesses before you recruit against them.",
    tip: "Their trip thresholds, contract complaints, and tech gaps become your pitch.",
    tipTag: 'STRATEGY',
    tipColor: 'var(--orange)',
    spotlightPadding: 10,
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
    spotlightPadding: 0,
  },
]

// ─── SPOTLIGHT RECT ───────────────────────────────────────────────────────────

type Rect = { top: number; left: number; width: number; height: number }

function getElementRect(selector: string, padding = 8): Rect | null {
  // Try multiple selector strategies for robustness
  let el: Element | null = null

  // Direct query
  el = document.querySelector(selector)

  // Fallback: find by text content for nav links
  if (!el && selector.includes('href')) {
    const href = selector.match(/href="([^"]+)"/)?.[1]
    if (href) {
      el = document.querySelector(`a[href="${href}"]`)
    }
  }

  // Fallback for billing button — find by text
  if (!el && selector.includes('billing')) {
    const buttons = document.querySelectorAll('button, a')
    for (const btn of buttons) {
      if (btn.textContent?.toLowerCase().includes('billing')) {
        el = btn
        break
      }
    }
  }

  if (!el) return null

  const r = el.getBoundingClientRect()
  return {
    top: r.top - padding,
    left: r.left - padding,
    width: r.width + padding * 2,
    height: r.height + padding * 2,
  }
}

// ─── SVG SPOTLIGHT MASK ───────────────────────────────────────────────────────

function SpotlightMask({ rect, visible }: { rect: Rect | null; visible: boolean }) {
  const W = typeof window !== 'undefined' ? window.innerWidth : 1440
  const H = typeof window !== 'undefined' ? window.innerHeight : 900

  if (!rect) return null

  const { top, left, width, height } = rect

  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1001,
        transition: 'opacity 0.3s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      <defs>
        <mask id="spotlight-mask">
          {/* Full white = visible (dimmed) */}
          <rect width={W} height={H} fill="white" />
          {/* Cut out = transparent (spotlit) */}
          <rect
            x={left}
            y={top}
            width={width}
            height={height}
            fill="black"
            rx={2}
            style={{ transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </mask>
      </defs>
      {/* Dark overlay with hole cut out */}
      <rect
        width={W}
        height={H}
        fill="rgba(26,24,20,0.82)"
        mask="url(#spotlight-mask)"
      />
    </svg>
  )
}

// ─── GLOW RING ────────────────────────────────────────────────────────────────

function GlowRing({ rect, color, visible }: { rect: Rect | null; color: string; visible: boolean }) {
  if (!rect) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        pointerEvents: 'none',
        zIndex: 1002,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease, top 0.4s cubic-bezier(0.16,1,0.3,1), left 0.4s cubic-bezier(0.16,1,0.3,1), width 0.4s cubic-bezier(0.16,1,0.3,1), height 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Animated glow border */}
      <div style={{
        position: 'absolute',
        inset: 0,
        border: `1.5px solid ${color}`,
        boxShadow: `0 0 0 1px ${color}22, 0 0 16px 2px ${color}44, inset 0 0 12px ${color}11`,
        animation: 'tourGlow 2s ease-in-out infinite',
      }} />
      {/* Corner accents */}
      {[
        { top: -3, left: -3 },
        { top: -3, right: -3 },
        { bottom: -3, left: -3 },
        { bottom: -3, right: -3 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            background: color,
            ...pos,
          }}
        />
      ))}
    </div>
  )
}

// ─── TOOLTIP ──────────────────────────────────────────────────────────────────

type TooltipProps = {
  step: TourStep
  stepIndex: number
  totalSteps: number
  rect: Rect | null
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  visible: boolean
  isLast: boolean
}

function Tooltip({ step, stepIndex, totalSteps, rect, onNext, onPrev, onSkip, visible, isLast }: TooltipProps) {
  const isCentered = step.position === 'center' || !rect

  // Calculate tooltip position
  const tooltipStyle: React.CSSProperties = isCentered
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.93})`,
        width: 'min(520px, calc(100vw - 48px))',
      }
    : (() => {
        if (!rect) return {}
        const TOOLTIP_W = 380
        const ARROW_H = 12
        const GAP = 12

        let top = rect.top + rect.height + GAP + ARROW_H
        let left = rect.left + rect.width / 2 - TOOLTIP_W / 2

        if (step.position === 'bottom-left') {
          left = rect.left + rect.width - TOOLTIP_W
        }
        if (step.position === 'bottom-right') {
          left = rect.left
        }
        if (step.position === 'top') {
          top = rect.top - GAP - ARROW_H - 10 // height handled by auto
        }

        // Clamp to viewport
        left = Math.max(16, Math.min(left, window.innerWidth - TOOLTIP_W - 16))

        return {
          position: 'fixed' as const,
          top,
          left,
          width: TOOLTIP_W,
          transform: `scale(${visible ? 1 : 0.93}) translateY(${visible ? 0 : -8}px)`,
        }
      })()

  return (
    <div
      style={{
        ...tooltipStyle,
        zIndex: 1003,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
        background: '#1a1814',
        border: '1px solid #2e2b27',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,85,0,0.08)',
      }}
    >
      {/* Arrow (only for anchored tooltips) */}
      {!isCentered && rect && (
        <div style={{
          position: 'absolute',
          top: -7,
          left: (() => {
            const TOOLTIP_W = 380
            const tooltipLeft = Math.max(16, Math.min(
              step.position === 'bottom-left'
                ? rect.left + rect.width - TOOLTIP_W
                : rect.left + rect.width / 2 - TOOLTIP_W / 2,
              window.innerWidth - TOOLTIP_W - 16
            ))
            const arrowCenter = rect.left + rect.width / 2
            return Math.max(16, Math.min(arrowCenter - tooltipLeft - 6, TOOLTIP_W - 28))
          })(),
          width: 12,
          height: 7,
          overflow: 'hidden',
        }}>
          <div style={{
            width: 12,
            height: 12,
            background: '#1a1814',
            border: '1px solid #2e2b27',
            transform: 'rotate(45deg)',
            transformOrigin: 'center',
            marginTop: 3,
          }} />
        </div>
      )}

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 3, padding: '16px 20px 0' }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} style={{
            height: 2,
            flex: 1,
            background: i <= stepIndex ? step.tagColor : '#2e2b27',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px' }}>
        {/* Tag */}
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          letterSpacing: 3,
          color: step.tagColor,
          textTransform: 'uppercase',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{
            background: `${step.tagColor}18`,
            border: `1px solid ${step.tagColor}30`,
            padding: '3px 8px',
          }}>
            {step.tag}
          </span>
          <span style={{ color: '#3a3732', fontSize: 9 }}>
            {stepIndex + 1} / {totalSteps}
          </span>
        </div>

        {/* Headline */}
        <h3 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: isCentered ? 'clamp(40px, 5vw, 58px)' : 30,
          letterSpacing: 2,
          lineHeight: 0.9,
          color: '#f0ede8',
          marginBottom: 12,
          whiteSpace: 'pre-line',
        }}>
          {step.headline}
        </h3>

        {/* Body */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'rgba(240,237,232,0.7)',
          lineHeight: 1.65,
          marginBottom: step.tip ? 14 : 0,
        }}>
          {step.body}
        </p>

        {/* Tip */}
        {step.tip && (
          <div style={{
            background: `${step.tipColor}0c`,
            borderLeft: `2px solid ${step.tipColor}`,
            padding: '10px 12px',
            marginBottom: 0,
          }}>
            {step.tipTag && (
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8,
                color: step.tipColor,
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                {step.tipTag}
              </div>
            )}
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(240,237,232,0.6)',
              lineHeight: 1.55,
            }}>
              {step.tip}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderTop: '1px solid #2e2b27',
        background: 'rgba(0,0,0,0.2)',
        gap: 8,
      }}>
        <button
          onClick={onSkip}
          style={{
            background: 'none',
            border: 'none',
            color: '#4a4540',
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '4px 0',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#7a7570')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a4540')}
        >
          SKIP TOUR
        </button>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {stepIndex > 0 && (
            <button
              onClick={onPrev}
              style={{
                background: 'none',
                border: '1px solid #2e2b27',
                color: '#7a7570',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: 2,
                textTransform: 'uppercase',
                padding: '8px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#7a7570'
                e.currentTarget.style.color = '#f0ede8'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#2e2b27'
                e.currentTarget.style.color = '#7a7570'
              }}
            >
              ←
            </button>
          )}

          <button
            onClick={onNext}
            style={{
              background: isLast ? 'var(--orange, #ff5500)' : 'transparent',
              border: `1px solid ${isLast ? 'var(--orange, #ff5500)' : '#3a3732'}`,
              color: isLast ? '#1a1814' : '#f0ede8',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              fontWeight: isLast ? 600 : 400,
              letterSpacing: 2,
              textTransform: 'uppercase',
              padding: '8px 18px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (!isLast) {
                e.currentTarget.style.borderColor = 'var(--orange, #ff5500)'
                e.currentTarget.style.color = 'var(--orange, #ff5500)'
              } else {
                e.currentTarget.style.background = '#ff6a1a'
              }
            }}
            onMouseLeave={e => {
              if (!isLast) {
                e.currentTarget.style.borderColor = '#3a3732'
                e.currentTarget.style.color = '#f0ede8'
              } else {
                e.currentTarget.style.background = 'var(--orange, #ff5500)'
              }
            }}
          >
            {isLast ? 'LAUNCH →' : 'NEXT →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  // Measure the target element
  const measureTarget = useCallback((s: TourStep) => {
    if (!s.target) {
      setRect(null)
      return
    }
    const r = getElementRect(s.target, s.spotlightPadding ?? 10)
    setRect(r)
  }, [])

  // Animate step transition
  const goTo = useCallback((target: number) => {
    if (animRef.current) clearTimeout(animRef.current)

    // Fade out tooltip
    setTooltipVisible(false)

    animRef.current = setTimeout(() => {
      setStepIndex(target)
      measureTarget(STEPS[target])
      // Fade in tooltip
      animRef.current = setTimeout(() => setTooltipVisible(true), 80)
    }, 220)
  }, [measureTarget])

  // Mount: entrance animation
  useEffect(() => {
    measureTarget(step)
    const t1 = setTimeout(() => setOverlayVisible(true), 60)
    const t2 = setTimeout(() => setTooltipVisible(true), 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Re-measure on resize
  useEffect(() => {
    const handleResize = () => measureTarget(STEPS[stepIndex])
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [stepIndex, measureTarget])

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        isLast ? handleComplete() : goTo(stepIndex + 1)
      }
      if (e.key === 'ArrowLeft' && stepIndex > 0) goTo(stepIndex - 1)
      if (e.key === 'Escape') handleComplete()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [stepIndex, isLast, goTo])

  const handleComplete = useCallback(() => {
    setClosing(true)
    setTooltipVisible(false)
    setTimeout(() => {
      setOverlayVisible(false)
      setTimeout(onComplete, 300)
    }, 150)
  }, [onComplete])

  const hasSpotlight = !!rect

  return (
    <>
      {/* CSS for glow animation */}
      <style>{`
        @keyframes tourGlow {
          0%, 100% { opacity: 0.7; box-shadow: 0 0 0 1px var(--glow-color, rgba(255,85,0,0.3)), 0 0 12px 2px var(--glow-color, rgba(255,85,0,0.2)); }
          50% { opacity: 1; box-shadow: 0 0 0 1px var(--glow-color, rgba(255,85,0,0.6)), 0 0 24px 4px var(--glow-color, rgba(255,85,0,0.35)); }
        }
        @keyframes tourPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.04); opacity: 0.85; }
        }
      `}</style>

      {/* Backdrop (for centered steps with no spotlight) */}
      {!hasSpotlight && (
        <div
          onClick={handleComplete}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26,24,20,0.86)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            opacity: overlayVisible && !closing ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      )}

      {/* SVG Spotlight mask (for anchored steps) */}
      {hasSpotlight && (
        <SpotlightMask rect={rect} visible={overlayVisible && !closing} />
      )}

      {/* Glow ring around target element */}
      {hasSpotlight && (
        <GlowRing
          rect={rect}
          color={step.tagColor.startsWith('var') ? '#ff5500' : step.tagColor}
          visible={overlayVisible && !closing}
        />
      )}

      {/* Tooltip / card */}
      <Tooltip
        step={step}
        stepIndex={stepIndex}
        totalSteps={STEPS.length}
        rect={rect}
        onNext={() => isLast ? handleComplete() : goTo(stepIndex + 1)}
        onPrev={() => stepIndex > 0 && goTo(stepIndex - 1)}
        onSkip={handleComplete}
        visible={tooltipVisible && !closing}
        isLast={isLast}
      />
    </>
  )
}
