'use client'

import { useEffect, useRef } from 'react'

// Animation states for Guy
type GuyState = 'spinning' | 'windup' | 'throw' | 'ballArc' | 'miss' | 'sigh' | 'slump'

export default function GuyAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef<number>(0)
  const tRef      = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── Resolve CSS variables for theme awareness ────────────────────────────
    const style    = getComputedStyle(document.documentElement)
    const text1    = style.getPropertyValue('--text-1').trim()   || '#f0f0f0'
    const text3    = style.getPropertyValue('--text-3').trim()   || '#666'
    const text4    = style.getPropertyValue('--text-4').trim()   || '#444'
    const orange   = style.getPropertyValue('--orange').trim()   || '#e07b39'
    const bgCard   = style.getPropertyValue('--bg-card').trim()  || '#1a1a1a'

    const W = canvas.width  = 420
    const H = canvas.height = 260

    // ── Scene constants ──────────────────────────────────────────────────────
    const FLOOR_Y   = 210
    const DESK_X    = 120
    const DESK_Y    = FLOOR_Y - 48
    const CHAIR_X   = 130
    const CHAIR_Y   = FLOOR_Y - 20
    const GUY_X     = 130
    const GUY_Y     = DESK_Y - 8        // feet level
    const CAN_X     = 310
    const CAN_Y     = FLOOR_Y - 28      // trash can top

    // ── State machine ────────────────────────────────────────────────────────
    let state: GuyState = 'spinning'
    let stateTimer      = 0
    let spinAngle       = 0             // chair rotation phase
    let armAngle        = 0             // throw arm angle
    let ballX           = 0
    let ballY           = 0
    let ballVX          = 0
    let ballVY          = 0
    let ballVisible     = false
    let slumpAmount     = 0             // 0–1, how slumped Guy is
    let sighAlpha       = 0            // opacity of sigh wisps
    let sighY           = 0            // sigh wisp Y offset
    let windupAngle     = 0
    let bounceX         = 0
    let bounceY         = 0
    let bounceVX        = 0
    let bounceVY        = 0

    function setState(s: GuyState) {
      state = s
      stateTimer = 0
    }

    // ── Draw helpers ─────────────────────────────────────────────────────────
    function drawDesk() {
      // Desktop surface
      ctx.fillStyle = text4
      ctx.fillRect(DESK_X - 40, DESK_Y, 100, 8)
      // Desk legs
      ctx.fillRect(DESK_X - 36, DESK_Y + 8, 6, 40)
      ctx.fillRect(DESK_X + 52, DESK_Y + 8, 6, 40)
      // Monitor
      ctx.fillStyle = text3
      ctx.fillRect(DESK_X - 20, DESK_Y - 38, 44, 30)
      ctx.fillStyle = bgCard
      ctx.fillRect(DESK_X - 16, DESK_Y - 35, 36, 24)
      // Screen glow — a tiny blue-ish rect
      ctx.fillStyle = 'rgba(100,160,255,0.15)'
      ctx.fillRect(DESK_X - 16, DESK_Y - 35, 36, 24)
      // Monitor stand
      ctx.fillStyle = text4
      ctx.fillRect(DESK_X + 1, DESK_Y - 8, 6, 8)
      ctx.fillRect(DESK_X - 4, DESK_Y - 2, 16, 4)
    }

    function drawTrashCan() {
      // Trash can body (trapezoid)
      ctx.beginPath()
      ctx.moveTo(CAN_X - 14, CAN_Y)
      ctx.lineTo(CAN_X + 14, CAN_Y)
      ctx.lineTo(CAN_X + 10, CAN_Y + 28)
      ctx.lineTo(CAN_X - 10, CAN_Y + 28)
      ctx.closePath()
      ctx.fillStyle = text4
      ctx.fill()
      ctx.strokeStyle = text3
      ctx.lineWidth = 1
      ctx.stroke()
      // Rim
      ctx.beginPath()
      ctx.moveTo(CAN_X - 15, CAN_Y)
      ctx.lineTo(CAN_X + 15, CAN_Y)
      ctx.strokeStyle = text3
      ctx.lineWidth = 2
      ctx.stroke()
      // Lines on can
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.lineWidth = 1
      for (let i = 1; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(CAN_X - 14 + i * 8, CAN_Y + 2)
        ctx.lineTo(CAN_X - 10 + i * 7, CAN_Y + 26)
        ctx.stroke()
      }
    }

    function drawChairBase(angle: number) {
      // Chair wheels — 5 spokes
      const cx = CHAIR_X, cy = CHAIR_Y + 4
      for (let i = 0; i < 5; i++) {
        const a = angle + (i / 5) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 6)
        ctx.strokeStyle = text4
        ctx.lineWidth = 3
        ctx.stroke()
        // wheel dot
        ctx.beginPath()
        ctx.arc(cx + Math.cos(a) * 18, cy + Math.sin(a) * 6, 3, 0, Math.PI * 2)
        ctx.fillStyle = text3
        ctx.fill()
      }
      // Pole
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx, cy - 22)
      ctx.strokeStyle = text3
      ctx.lineWidth = 4
      ctx.stroke()
      // Seat
      ctx.beginPath()
      ctx.ellipse(cx, cy - 22, 22, 8, 0, 0, Math.PI * 2)
      ctx.fillStyle = text3
      ctx.fill()
    }

    function drawGuy(slump: number, throwArm: number) {
      const x = GUY_X
      const y = GUY_Y - slump * 6   // slump shifts body down a bit

      // Body
      ctx.fillStyle = orange
      ctx.fillRect(x - 10, y - 44 + slump * 4, 20, 26)

      // Head
      ctx.beginPath()
      ctx.arc(x, y - 52 + slump * 4, 10, 0, Math.PI * 2)
      ctx.fillStyle = text1
      ctx.fill()

      // Face — sad eyes + mouth based on slump
      ctx.fillStyle = bgCard
      // eyes
      ctx.beginPath(); ctx.arc(x - 3, y - 53 + slump * 4, 1.5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + 3, y - 53 + slump * 4, 1.5, 0, Math.PI * 2); ctx.fill()
      // mouth — straight when normal, frown when slumped
      ctx.beginPath()
      ctx.strokeStyle = bgCard
      ctx.lineWidth = 1.5
      if (slump > 0.3) {
        // frown
        ctx.arc(x, y - 47 + slump * 4, 4, 0.2, Math.PI - 0.2)
      } else {
        // flat
        ctx.moveTo(x - 3, y - 47 + slump * 4)
        ctx.lineTo(x + 3, y - 47 + slump * 4)
      }
      ctx.stroke()

      // Legs (sitting)
      ctx.strokeStyle = text1
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      // Left leg
      ctx.beginPath()
      ctx.moveTo(x - 5, y - 18 + slump * 2)
      ctx.lineTo(x - 14, y - 4)
      ctx.lineTo(x - 18, y - 4)
      ctx.stroke()
      // Right leg
      ctx.beginPath()
      ctx.moveTo(x + 5, y - 18 + slump * 2)
      ctx.lineTo(x + 14, y - 4)
      ctx.lineTo(x + 18, y - 4)
      ctx.stroke()

      // Arms
      ctx.lineWidth = 4
      // Left arm (idle, resting on desk)
      ctx.beginPath()
      ctx.moveTo(x - 10, y - 38 + slump * 3)
      ctx.lineTo(x - 22, y - 28 + slump * 2)
      ctx.stroke()

      // Right arm — throw arm, angle controlled by throwArm param
      const shoulderX = x + 10
      const shoulderY = y - 38 + slump * 3
      const elbowX = shoulderX + Math.cos(throwArm) * 14
      const elbowY = shoulderY + Math.sin(throwArm) * 14
      const handX  = elbowX + Math.cos(throwArm - 0.6) * 12
      const handY  = elbowY + Math.sin(throwArm - 0.6) * 12
      ctx.beginPath()
      ctx.moveTo(shoulderX, shoulderY)
      ctx.lineTo(elbowX, elbowY)
      ctx.lineTo(handX, handY)
      ctx.stroke()
    }

    function drawPaperBall(bx: number, by: number) {
      ctx.beginPath()
      ctx.arc(bx, by, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#ddd'
      ctx.fill()
      ctx.strokeStyle = text3
      ctx.lineWidth = 0.5
      ctx.stroke()
      // crumple lines
      ctx.beginPath()
      ctx.moveTo(bx - 2, by - 2); ctx.lineTo(bx + 1, by + 2)
      ctx.moveTo(bx + 2, by - 1); ctx.lineTo(bx - 1, by + 2)
      ctx.strokeStyle = text4
      ctx.lineWidth = 0.8
      ctx.stroke()
    }

    function drawSigh(alpha: number, offsetY: number) {
      if (alpha <= 0) return
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = text3
      ctx.lineWidth = 1.5
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        const wx = GUY_X - 6 + i * 7
        const wy = GUY_Y - 66 - offsetY
        ctx.moveTo(wx, wy)
        ctx.quadraticCurveTo(wx + 3, wy - 8, wx, wy - 16)
        ctx.stroke()
      }
      ctx.restore()
    }

    function drawFloor() {
      ctx.strokeStyle = text4
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, FLOOR_Y)
      ctx.lineTo(W, FLOOR_Y)
      ctx.stroke()
    }

    // ── Main loop ────────────────────────────────────────────────────────────
    function tick() {
      tRef.current++
      stateTimer++
      const t = tRef.current

      ctx.clearRect(0, 0, W, H)

      // State transitions
      switch (state) {
        case 'spinning':
          spinAngle += 0.04
          armAngle = -0.5          // arm resting
          slumpAmount = 0
          sighAlpha = Math.max(0, sighAlpha - 0.05)
          if (stateTimer > 90) setState('windup')
          break

        case 'windup':
          spinAngle += 0.01
          windupAngle = stateTimer / 15
          armAngle = -0.5 - windupAngle * 0.8
          if (stateTimer > 25) {
            // spawn ball at hand position
            const shoulderX = GUY_X + 10
            const shoulderY = GUY_Y - 38
            ballX = shoulderX + Math.cos(armAngle) * 26
            ballY = shoulderY + Math.sin(armAngle) * 26
            ballVX = 4.2
            ballVY = -4.8
            ballVisible = true
            setState('throw')
          }
          break

        case 'throw':
          armAngle = Math.min(armAngle + 0.18, 0.4)  // arm follows through
          if (stateTimer > 8) setState('ballArc')
          break

        case 'ballArc':
          ballX += ballVX
          ballVY += 0.28          // gravity
          ballY += ballVY
          // Did it reach the can?
          if (ballX >= CAN_X - 2) {
            // Miss! — hits rim and bounces off
            bounceX = CAN_X + 14
            bounceY = CAN_Y
            bounceVX = 1.8
            bounceVY = -2.5
            ballVisible = false
            setState('miss')
          }
          break

        case 'miss':
          bounceX += bounceVX
          bounceVY += 0.35
          bounceY += bounceVY
          if (bounceY > FLOOR_Y) {
            bounceY = FLOOR_Y
            bounceVY *= -0.3
            bounceVX *= 0.7
          }
          slumpAmount = Math.min(slumpAmount + 0.06, 1)
          if (stateTimer > 35) setState('sigh')
          break

        case 'sigh':
          slumpAmount = 1
          sighAlpha = Math.min(sighAlpha + 0.04, 0.7)
          sighY = (stateTimer / 40) * 20
          if (stateTimer > 60) setState('slump')
          break

        case 'slump':
          slumpAmount = Math.max(slumpAmount - 0.015, 0)
          sighAlpha = Math.max(sighAlpha - 0.03, 0)
          if (stateTimer > 50) {
            bounceX = 0; bounceY = 0
            setState('spinning')
          }
          break
      }

      // ── Draw scene ────────────────────────────────────────────────────────
      drawFloor()
      drawDesk()
      drawTrashCan()
      drawChairBase(spinAngle)
      drawGuy(slumpAmount, state === 'windup' ? armAngle : state === 'throw' || state === 'ballArc' ? armAngle : -0.5)

      if (ballVisible) drawPaperBall(ballX, ballY)
      if (state === 'miss' || state === 'sigh' || state === 'slump') {
        drawPaperBall(bounceX, bounceY)
      }
      drawSigh(sighAlpha, sighY)

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 0 20px', gap: 10,
    }}>
      <canvas
        ref={canvasRef}
        style={{ opacity: 0.85 }}
      />
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        color: 'var(--text-4)', letterSpacing: 2, textTransform: 'uppercase',
      }}>
        agents loading...
      </div>
    </div>
  )
}
