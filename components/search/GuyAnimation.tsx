'use client'

import { useEffect, useRef } from 'react'

type Phase = 'chase' | 'catch' | 'confused' | 'carleaves' | 'reset'

export default function GuyAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    if (!ctx) return

    const W = canvas.width  = 520
    const H = canvas.height = 200

    const cs      = getComputedStyle(document.documentElement)
    const GROUND  = 155
    const textCol = cs.getPropertyValue('--text-3').trim() || '#888'
    const bgCol   = cs.getPropertyValue('--bg-card').trim() || '#fff'

    // ── palette ──────────────────────────────────────────────────────────────
    const DOG_BODY  = '#c8a876'
    const DOG_DARK  = '#8a6a3a'
    const CAR_BODY  = '#cc4400'   // orange-red, fun
    const CAR_DARK  = '#882200'
    const WHEEL_COL = '#333'
    const WINDOW    = '#a8d4f0'
    const ROAD_LINE = textCol + '33'

    // ── state ─────────────────────────────────────────────────────────────────
    let phase: Phase = 'chase'
    let t = 0

    let carX  = W + 60      // car starts off right edge
    let dogX  = -40         // dog starts off left edge
    let carSpd = 2.8
    let dogSpd = 4.2

    let legCycle = 0         // for running leg animation
    let tiltAngle = 0        // dog head tilt on confused
    let questionAlpha = 0
    let questionY     = 0
    let subtextAlpha  = 0
    let tailWag = 0          // tail wag angle

    function nextPhase(p: Phase) { phase = p; t = 0 }
    function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
    function easeOut(x: number) { return 1 - (1 - x) * (1 - x) }
    function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

    // ── DRAW CAR ──────────────────────────────────────────────────────────────
    function drawCar(x: number, spd: number) {
      const y = GROUND
      const bounce = Math.sin(legCycle * 2) * (spd > 0.5 ? 1.5 : 0)

      ctx.save()
      ctx.translate(x, y + bounce)

      // Shadow
      ctx.beginPath()
      ctx.ellipse(0, 4, 55, 6, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fill()

      // Body — car faces left (driving left)
      // Main body
      ctx.beginPath()
      ctx.roundRect(-58, -28, 116, 28, 6)
      ctx.fillStyle = CAR_BODY
      ctx.fill()

      // Roof
      ctx.beginPath()
      ctx.moveTo(-32, -28)
      ctx.lineTo(-22, -52)
      ctx.lineTo(28, -52)
      ctx.lineTo(38, -28)
      ctx.closePath()
      ctx.fillStyle = CAR_DARK
      ctx.fill()

      // Windows
      ctx.beginPath()
      ctx.moveTo(-26, -30)
      ctx.lineTo(-18, -50)
      ctx.lineTo(4, -50)
      ctx.lineTo(4, -30)
      ctx.closePath()
      ctx.fillStyle = WINDOW
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(8, -30)
      ctx.lineTo(8, -50)
      ctx.lineTo(26, -50)
      ctx.lineTo(34, -30)
      ctx.closePath()
      ctx.fillStyle = WINDOW
      ctx.fill()

      // Wheels
      for (const wx of [-36, 32]) {
        ctx.beginPath()
        ctx.arc(wx, 2, 14, 0, Math.PI * 2)
        ctx.fillStyle = WHEEL_COL
        ctx.fill()
        ctx.beginPath()
        ctx.arc(wx, 2, 7, 0, Math.PI * 2)
        ctx.fillStyle = '#aaa'
        ctx.fill()
        // Spinning spokes
        const angle = -legCycle * 3
        for (let i = 0; i < 4; i++) {
          const a = angle + i * Math.PI / 2
          ctx.beginPath()
          ctx.moveTo(wx, 2)
          ctx.lineTo(wx + Math.cos(a) * 7, 2 + Math.sin(a) * 7)
          ctx.strokeStyle = '#888'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }

      // Headlights (front = left side since car drives left)
      ctx.beginPath()
      ctx.ellipse(-56, -12, 5, 4, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#ffee88'
      ctx.fill()

      // Exhaust puff when moving
      if (spd > 0.5) {
        for (let i = 0; i < 3; i++) {
          const px = 58 + i * 10 + (legCycle * 8 % 10)
          const py = -6 + Math.sin(legCycle + i) * 3
          const pr = 4 + i * 2
          ctx.beginPath()
          ctx.arc(px, py, pr, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(180,180,180,${0.3 - i * 0.08})`
          ctx.fill()
        }
      }

      ctx.restore()
    }

    // ── DRAW DOG ──────────────────────────────────────────────────────────────
    function drawDog(x: number, running: boolean, tilt: number, wag: number) {
      const y = GROUND
      const lc = legCycle

      ctx.save()
      ctx.translate(x, y)

      // Shadow
      ctx.beginPath()
      ctx.ellipse(0, 4, 28, 5, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fill()

      // ── Tail ──────────────────────────────────────────────────────────────
      const tailBase = { x: -22, y: -22 }
      const tailWagAmt = running ? Math.sin(lc * 4) * 0.6 : Math.sin(lc * 3) * wag * 0.8
      ctx.beginPath()
      ctx.moveTo(tailBase.x, tailBase.y)
      ctx.quadraticCurveTo(
        tailBase.x - 14, tailBase.y - 16 + tailWagAmt * 8,
        tailBase.x - 18 + tailWagAmt * 6, tailBase.y - 28 + tailWagAmt * 4
      )
      ctx.strokeStyle = DOG_DARK
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.stroke()

      // ── Legs ──────────────────────────────────────────────────────────────
      ctx.lineCap = 'round'
      ctx.lineWidth = 6

      if (running) {
        // galloping legs
        const pairs = [
          { ox: -12, phase: 0    },
          { ox:  -4, phase: Math.PI * 0.5 },
          { ox:   4, phase: Math.PI },
          { ox:  12, phase: Math.PI * 1.5 },
        ]
        for (const leg of pairs) {
          const la = Math.sin(lc * 6 + leg.phase)
          ctx.beginPath()
          ctx.moveTo(leg.ox, -8)
          ctx.lineTo(leg.ox + la * 10, 0)
          ctx.strokeStyle = DOG_DARK
          ctx.stroke()
        }
      } else {
        // sitting-ish still legs
        for (const lx of [-10, -4, 4, 10]) {
          ctx.beginPath()
          ctx.moveTo(lx, -8)
          ctx.lineTo(lx + Math.sin(lc * 2) * 1, 0)
          ctx.strokeStyle = DOG_DARK
          ctx.stroke()
        }
      }

      // ── Body ──────────────────────────────────────────────────────────────
      const bodyBob = running ? Math.sin(lc * 6) * 2.5 : 0
      ctx.beginPath()
      ctx.ellipse(0, -18 + bodyBob, 24, 14, 0, 0, Math.PI * 2)
      ctx.fillStyle = DOG_BODY
      ctx.fill()

      // Belly patch
      ctx.beginPath()
      ctx.ellipse(4, -14 + bodyBob, 12, 8, 0.2, 0, Math.PI * 2)
      ctx.fillStyle = '#e8c89a'
      ctx.fill()

      // ── Head ──────────────────────────────────────────────────────────────
      const headX = 18
      const headY = -30 + bodyBob
      ctx.save()
      ctx.translate(headX, headY)
      ctx.rotate(tilt)

      // Head
      ctx.beginPath()
      ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2)
      ctx.fillStyle = DOG_BODY
      ctx.fill()

      // Snout
      ctx.beginPath()
      ctx.ellipse(10, 4, 8, 6, 0.2, 0, Math.PI * 2)
      ctx.fillStyle = '#b88a52'
      ctx.fill()

      // Nose
      ctx.beginPath()
      ctx.ellipse(16, 3, 4, 3, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#222'
      ctx.fill()

      // Nostrils
      ctx.beginPath()
      ctx.arc(14, 4, 1.2, 0, Math.PI * 2)
      ctx.arc(17, 4, 1.2, 0, Math.PI * 2)
      ctx.fillStyle = '#111'
      ctx.fill()

      // Eye
      ctx.beginPath()
      ctx.arc(6, -4, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(7, -4, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#222'
      ctx.fill()
      // Eye shine
      ctx.beginPath()
      ctx.arc(8, -5, 1, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()

      // Floppy ear
      ctx.beginPath()
      ctx.moveTo(-4, -8)
      ctx.quadraticCurveTo(
        -18, -6 + (running ? Math.sin(lc * 6) * 5 : 0),
        -14, 10
      )
      ctx.quadraticCurveTo(-6, 14, -2, 6)
      ctx.closePath()
      ctx.fillStyle = DOG_DARK
      ctx.fill()

      // Tongue (always out — he's a dog)
      const tongueWag = running ? Math.sin(lc * 6) * 3 : Math.sin(lc * 2) * 2
      ctx.beginPath()
      ctx.moveTo(12, 8)
      ctx.quadraticCurveTo(14 + tongueWag, 18, 12, 20)
      ctx.quadraticCurveTo(10, 22, 8, 20)
      ctx.quadraticCurveTo(6, 18, 8 + tongueWag * 0.5, 8)
      ctx.closePath()
      ctx.fillStyle = '#e86090'
      ctx.fill()

      ctx.restore()

      ctx.restore()
    }

    // ── Road dashes ───────────────────────────────────────────────────────────
    function drawRoad(offset: number) {
      ctx.strokeStyle = ROAD_LINE
      ctx.lineWidth = 2
      ctx.setLineDash([30, 20])
      ctx.lineDashOffset = -offset % 50
      ctx.beginPath()
      ctx.moveTo(0, GROUND + 8)
      ctx.lineTo(W, GROUND + 8)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // ── Reaction ──────────────────────────────────────────────────────────────
    function drawReaction(qA: number, qY: number, stA: number) {
      if (qA > 0) {
        ctx.save()
        ctx.globalAlpha = qA
        ctx.font = "bold 20px 'Bebas Neue', sans-serif"
        ctx.fillStyle = textCol
        ctx.textAlign = 'center'
        ctx.fillText('...now what', dogX, qY)
        ctx.restore()
      }
      if (stA > 0) {
        ctx.save()
        ctx.globalAlpha = stA
        ctx.font = "10px 'DM Mono', monospace"
        ctx.fillStyle = textCol
        ctx.textAlign = 'center'
        ctx.fillText('agents loading...', W / 2, GROUND + 42)
        ctx.restore()
      }
    }

    // ── Main tick ─────────────────────────────────────────────────────────────
    let roadOffset = 0

    function tick() {
      t++
      legCycle += 0.15
      ctx.clearRect(0, 0, W, H)

      switch (phase) {

        case 'chase':
          carX  -= carSpd
          dogX  += dogSpd
          roadOffset += (carSpd + dogSpd) * 0.5
          tailWag = 1
          tiltAngle = 0
          questionAlpha = 0
          subtextAlpha  = 0

          // Dog catches car when close enough
          if (dogX >= carX - 70) {
            nextPhase('catch')
          }
          // If they've scrolled past mid without catching, reset positions
          if (carX < -100) {
            carX = W + 60; dogX = -40
          }
          break

        case 'catch':
          // Both slow to a stop
          carSpd = Math.max(0, carSpd - 0.18)
          dogSpd = Math.max(0, dogSpd - 0.22)
          carX  -= carSpd
          dogX  += dogSpd
          roadOffset += carSpd * 0.5
          tailWag = lerp(tailWag, 0.3, 0.1)
          if (t > 18) nextPhase('confused')
          break

        case 'confused':
          carSpd = 0; dogSpd = 0
          // Head tilt builds up
          tiltAngle = easeOut(clamp(t / 25, 0, 1)) * 0.45
          tailWag = 0.2
          questionAlpha = clamp((t - 10) / 20, 0, 1)
          questionY = GROUND - 72 - clamp((t - 10) / 20, 0, 1) * 10
          subtextAlpha = clamp((t - 20) / 20, 0, 0.8)
          if (t > 90) nextPhase('carleaves')
          break

        case 'carleaves':
          // Car slowly drives away, dog watches
          carSpd = lerp(0, 2.2, clamp(t / 30, 0, 1))
          carX  -= carSpd
          tiltAngle = lerp(0.45, 0, clamp(t / 40, 0, 1))
          questionAlpha = lerp(1, 0, clamp(t / 20, 0, 1))
          subtextAlpha  = lerp(0.8, 0, clamp(t / 25, 0, 1))
          tailWag = lerp(0.2, 0, clamp(t / 30, 0, 1))
          if (carX < -120) nextPhase('reset')
          break

        case 'reset':
          // Reset everything off screen and restart
          carX   = W + 60
          dogX   = -40
          carSpd = 2.8
          dogSpd = 4.2
          tiltAngle     = 0
          questionAlpha = 0
          subtextAlpha  = 0
          tailWag       = 0
          if (t > 8) nextPhase('chase')
          break
      }

      const isRunning = phase === 'chase' || (phase === 'catch' && (carSpd > 0.5 || dogSpd > 0.5))

      drawRoad(roadOffset)
      drawCar(carX, carSpd)
      drawDog(dogX, isRunning, tiltAngle, tailWag)
      drawReaction(questionAlpha, questionY, subtextAlpha)

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 4px' }}>
      <canvas ref={canvasRef} style={{ opacity: 0.92 }} />
    </div>
  )
}
