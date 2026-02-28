"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// ─── TYPES ────────────────────────────────────────────────────────────────────
// In production these come from your DB david_facts field.
// For now we accept a davidFacts prop (array of DavidFact objects)
// plus agentName, recruitScore, recruitFlag, predictedTree, treeConfidence.

const SOURCE_COLORS = {
  FACEBOOK:     "#4fc3f7",
  YOUTUBE:      "#ff4444",
  GOOGLE_REVIEW:"#f4621f",
  SERP:         "#ce93d8",
  WEBSITE:      "#80cbc4",
  LINKEDIN:     "#29b6f6",
  OTHER:        "#888",
}

const SOURCE_ICONS = {
  FACEBOOK:      "FB",
  YOUTUBE:       "YT",
  GOOGLE_REVIEW: "GR",
  SERP:          "SR",
  WEBSITE:       "WB",
  LINKEDIN:      "LI",
  OTHER:         "??",
}

const USABILITY_GLOW = {
  HIGH: 1.0,
  MED:  0.55,
  LOW:  0.25,
}

const TREE_COLORS = {
  INTEGRITY:  "#f4621f",
  AMERILIFE:  "#4fc3f7",
  SMS:        "#ce93d8",
  UNKNOWN:    "#444",
  OTHER:      "#00e676",
}

// ─── PHYSICS HELPERS ─────────────────────────────────────────────────────────

function seededRandom(seed) {
  let s = seed
  return function() {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function buildGraph(facts, w, h) {
  const rng = seededRandom(facts.length * 137 + 42)
  const cx = w / 2, cy = h / 2

  // Central core node
  const core = {
    id: "core",
    x: cx, y: cy,
    vx: 0, vy: 0,
    r: 22,
    isCore: true,
    fixed: true,
  }

  // Source cluster nodes — one per unique source
  const sources = [...new Set(facts.map(f => f.source))]
  const sourceNodes = sources.map((src, i) => {
    const angle = (i / sources.length) * Math.PI * 2 - Math.PI / 2
    const dist = 100 + rng() * 30
    return {
      id: `src-${src}`,
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: 0, vy: 0,
      r: 14,
      isSource: true,
      source: src,
    }
  })

  // Fact leaf nodes
  const factNodes = facts.map((fact, i) => {
    const srcNode = sourceNodes.find(s => s.source === fact.source)
    const baseAngle = srcNode ? Math.atan2(srcNode.y - cy, srcNode.x - cx) : rng() * Math.PI * 2
    const spread = 0.6
    const angle = baseAngle + (rng() - 0.5) * spread
    const dist = 160 + rng() * 60
    return {
      id: `fact-${i}`,
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: (rng() - 0.5) * 0.5,
      vy: (rng() - 0.5) * 0.5,
      r: fact.usability === "HIGH" ? 9 : fact.usability === "MED" ? 7 : 5,
      isFact: true,
      fact,
      factIndex: i,
    }
  })

  const nodes = [core, ...sourceNodes, ...factNodes]

  // Edges
  const edges = []
  // Core → source nodes
  sourceNodes.forEach(s => edges.push({ from: "core", to: s.id, strength: 0.04 }))
  // Source → fact leaves
  factNodes.forEach(fn => {
    const srcId = `src-${fn.fact.source}`
    edges.push({ from: srcId, to: fn.id, strength: 0.06 })
  })

  return { nodes, edges }
}

function runPhysics(nodes, edges, w, h, iterations = 1) {
  const cx = w / 2, cy = h / 2
  const nodeMap = {}
  nodes.forEach(n => nodeMap[n.id] = n)

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        if (a.fixed && b.fixed) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const minDist = a.r + b.r + 20
        if (dist < minDist) {
          const force = (minDist - dist) / dist * 0.3
          if (!a.fixed) { a.vx -= dx * force; a.vy -= dy * force }
          if (!b.fixed) { b.vx += dx * force; b.vy += dy * force }
        }
      }
    }

    // Attraction along edges
    edges.forEach(e => {
      const a = nodeMap[e.from], b = nodeMap[e.to]
      if (!a || !b) return
      const dx = b.x - a.x, dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = dist * e.strength
      if (!a.fixed) { a.vx += dx * force; a.vy += dy * force }
      if (!b.fixed) { b.vx -= dx * force; b.vy -= dy * force }
    })

    // Weak center gravity for fact nodes
    nodes.forEach(n => {
      if (n.fixed) return
      n.vx += (cx - n.x) * 0.003
      n.vy += (cy - n.y) * 0.003
    })

    // Integrate + dampen
    nodes.forEach(n => {
      if (n.fixed) return
      n.vx *= 0.85; n.vy *= 0.85
      n.x += n.vx; n.y += n.vy
      // Bounds
      const pad = n.r + 10
      n.x = Math.max(pad, Math.min(w - pad, n.x))
      n.y = Math.max(pad, Math.min(h - pad, n.y))
    })
  }
}

// Pre-settle the graph before rendering
function settleGraph(nodes, edges, w, h, steps = 200) {
  runPhysics(nodes, edges, w, h, steps)
}

// ─── NEURON PULSE ANIMATION ───────────────────────────────────────────────────

function usePulses(edges, nodes) {
  const [pulses, setPulses] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    if (!edges.length || !nodes.length) return
    const factEdges = edges.filter(e => e.to.startsWith("fact-"))
    if (!factEdges.length) return

    const interval = setInterval(() => {
      const e = factEdges[Math.floor(Math.random() * factEdges.length)]
      const fromNode = nodes.find(n => n.id === e.from)
      const toNode = nodes.find(n => n.id === e.to)
      if (!fromNode || !toNode) return
      const id = idRef.current++
      setPulses(prev => [...prev, { id, fromNode, toNode, progress: 0, createdAt: Date.now() }])
    }, 400)

    return () => clearInterval(interval)
  }, [edges, nodes])

  useEffect(() => {
    let raf
    const animate = () => {
      const now = Date.now()
      setPulses(prev => prev
        .map(p => ({ ...p, progress: (now - p.createdAt) / 900 }))
        .filter(p => p.progress < 1)
      )
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  return pulses
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function DavidBrain({
  agentName = "Agent",
  recruitFlag = "WARM",
  recruitScore = 55,
  predictedTree = "UNKNOWN",
  treeConfidence = 0,
  davidFacts = [],
  isLoading = false,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [size, setSize] = useState({ w: 480, h: 380 })
  const [graph, setGraph] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [selectedFact, setSelectedFact] = useState(null)
  const [revealedCount, setRevealedCount] = useState(0)
  const animFrameRef = useRef(null)
  const pulses = usePulses(graph?.edges || [], graph?.nodes || [])

  // Size tracking
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect
      setSize({ w: Math.floor(width), h: Math.floor(Math.min(width * 0.75, 420)) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Build + settle graph when facts or size changes
  useEffect(() => {
    if (!davidFacts.length) { setGraph(null); return }
    const { nodes, edges } = buildGraph(davidFacts, size.w, size.h)
    settleGraph(nodes, edges, size.w, size.h, 300)
    setGraph({ nodes, edges })
    setRevealedCount(0)
  }, [davidFacts, size.w, size.h])

  // Staggered reveal
  useEffect(() => {
    if (!graph) return
    if (revealedCount >= graph.nodes.length) return
    const t = setTimeout(() => setRevealedCount(c => c + 1), 60)
    return () => clearTimeout(t)
  }, [graph, revealedCount])

  // Hover detection on canvas
  const handleMouseMove = useCallback((e) => {
    if (!graph || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    let found = null
    for (const node of graph.nodes) {
      const dx = mx - node.x, dy = my - node.y
      if (Math.sqrt(dx * dx + dy * dy) < node.r + 6) {
        found = node
        break
      }
    }
    setHoveredNode(found)
  }, [graph])

  const handleClick = useCallback((e) => {
    if (!graph || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    for (const node of graph.nodes) {
      if (!node.isFact) continue
      const dx = mx - node.x, dy = my - node.y
      if (Math.sqrt(dx * dx + dy * dy) < node.r + 8) {
        setSelectedFact(node.fact)
        return
      }
    }
    setSelectedFact(null)
  }, [graph])

  // Canvas draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const dpr = window.devicePixelRatio || 1
    canvas.width = size.w * dpr
    canvas.height = size.h * dpr
    canvas.style.width = size.w + "px"
    canvas.style.height = size.h + "px"
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, size.w, size.h)

    if (!graph) return

    const nodeMap = {}
    graph.nodes.forEach(n => nodeMap[n.id] = n)

    // Draw edges
    graph.edges.forEach((e, ei) => {
      const a = nodeMap[e.from], b = nodeMap[e.to]
      if (!a || !b) return
      const aVisible = graph.nodes.indexOf(a) < revealedCount
      const bVisible = graph.nodes.indexOf(b) < revealedCount
      if (!aVisible || !bVisible) return

      const srcColor = a.isSource
        ? SOURCE_COLORS[a.source] || "#555"
        : b.isFact
        ? SOURCE_COLORS[b.fact?.source] || "#555"
        : "#333"

      ctx.beginPath()
      ctx.moveTo(a.x, a.y)

      // Bezier for organic feel
      const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.15
      const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.15
      ctx.quadraticCurveTo(mx, my, b.x, b.y)

      const isHovered = hoveredNode && (hoveredNode.id === a.id || hoveredNode.id === b.id)
      ctx.strokeStyle = isHovered
        ? srcColor + "cc"
        : b.isFact
        ? srcColor + "33"
        : "#ffffff18"
      ctx.lineWidth = isHovered ? 1.5 : 0.8
      ctx.stroke()
    })

    // Draw pulse dots along edges
    pulses.forEach(p => {
      const { fromNode: a, toNode: b, progress } = p
      const aIdx = graph.nodes.indexOf(a)
      const bIdx = graph.nodes.indexOf(b)
      if (aIdx >= revealedCount || bIdx >= revealedCount) return

      const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress
      const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.15
      const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.15

      const t = eased
      const px = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x
      const py = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y

      const srcColor = b.isFact ? SOURCE_COLORS[b.fact?.source] || "#888" : "#f4621f"
      const alpha = Math.sin(progress * Math.PI)
      ctx.beginPath()
      ctx.arc(px, py, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = srcColor + Math.round(alpha * 255).toString(16).padStart(2, "0")
      ctx.fill()
    })

    // Draw nodes
    graph.nodes.forEach((node, ni) => {
      if (ni >= revealedCount) return
      const isHovered = hoveredNode?.id === node.id
      const isSelected = selectedFact && node.isFact && selectedFact === node.fact

      if (node.isCore) {
        const treeColor = TREE_COLORS[predictedTree] || "#f4621f"
        // Outer glow
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 2.5)
        grad.addColorStop(0, treeColor + "44")
        grad.addColorStop(1, "transparent")
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // Core ring
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fillStyle = "#0a0a0a"
        ctx.fill()
        ctx.strokeStyle = treeColor
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Inner dot
        ctx.beginPath()
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = treeColor
        ctx.fill()

        return
      }

      if (node.isSource) {
        const color = SOURCE_COLORS[node.source] || "#555"
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fillStyle = "#111"
        ctx.fill()
        ctx.strokeStyle = isHovered ? color : color + "88"
        ctx.lineWidth = isHovered ? 1.5 : 1
        ctx.stroke()

        // Label
        ctx.fillStyle = isHovered ? color : color + "cc"
        ctx.font = `bold 7px 'DM Mono', monospace`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(SOURCE_ICONS[node.source] || "??", node.x, node.y)
        return
      }

      if (node.isFact) {
        const color = SOURCE_COLORS[node.fact.source] || "#555"
        const glow = USABILITY_GLOW[node.fact.usability] || 0.3
        const isHighlight = isHovered || isSelected

        if (isHighlight || node.fact.usability === "HIGH") {
          const glowGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 3)
          glowGrad.addColorStop(0, color + Math.round(glow * 120).toString(16).padStart(2, "0"))
          glowGrad.addColorStop(1, "transparent")
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.r * 3, 0, Math.PI * 2)
          ctx.fillStyle = glowGrad
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fillStyle = isHighlight ? color + "33" : "#0d0d0d"
        ctx.fill()
        ctx.strokeStyle = isHighlight ? color : color + Math.round(glow * 180).toString(16).padStart(2, "0")
        ctx.lineWidth = isHighlight ? 1.5 : 0.8
        ctx.stroke()

        // Usability center dot
        if (node.fact.usability === "HIGH") {
          ctx.beginPath()
          ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()
        }
      }
    })

    // Cursor tooltip hint for hovered fact node
    if (hoveredNode?.isFact) {
      canvas.style.cursor = "pointer"
    } else {
      canvas.style.cursor = "default"
    }
  }, [graph, revealedCount, hoveredNode, selectedFact, pulses, size, predictedTree])

  const treeColor = TREE_COLORS[predictedTree] || "#444"
  const flagColor = recruitFlag === "HOT" ? "#00e676" : recruitFlag === "WARM" ? "#ffb300" : "#555"
  const factCount = davidFacts.length
  const highCount = davidFacts.filter(f => f.usability === "HIGH").length

  const mono = { fontFamily: "'DM Mono', 'Courier New', monospace" }
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" }

  return (
    <div style={{ background: "#050505", border: "1px solid #1a1a1a", width: "100%" }}>

      {/* ── HEADER ── */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #111",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: treeColor, boxShadow: `0 0 6px ${treeColor}` }} />
          <span style={{ ...mono, fontSize: 9, color: "#333", letterSpacing: 3, textTransform: "uppercase" }}>
            ◈ DAVID PROFILE
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {factCount > 0 && (
            <span style={{ ...mono, fontSize: 9, color: treeColor, letterSpacing: 2, borderLeft: `1px solid ${treeColor}33`, paddingLeft: 8 }}>
              {factCount} FACTS · {highCount} HIGH
            </span>
          )}
          <span style={{ ...mono, fontSize: 9, color: flagColor, letterSpacing: 2 }}>
            {recruitFlag}
          </span>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div
        ref={containerRef}
        style={{ width: "100%", position: "relative", background: "#030303" }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={handleClick}
        />

        {/* Empty state */}
        {!isLoading && factCount === 0 && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 10, pointerEvents: "none",
          }}>
            <div style={{ ...bebas, fontSize: 32, color: "#1a1a1a", letterSpacing: 4 }}>DAVID</div>
            <div style={{ ...mono, fontSize: 9, color: "#1e1e1e", letterSpacing: 3 }}>
              RUN ANATHEMA TO SEED THIS PROFILE
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 12, pointerEvents: "none",
          }}>
            <div style={{ ...mono, fontSize: 9, color: "#f4621f", letterSpacing: 3 }}>
              ■ EXTRACTING DAVID FACTS
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{
                  width: 3, height: 3, borderRadius: "50%",
                  background: "#f4621f",
                  animation: `davidPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
            <style>{`
              @keyframes davidPulse {
                0%,100% { opacity: 0.1; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.4); }
              }
            `}</style>
          </div>
        )}

        {/* Hovered node label — floating */}
        {hoveredNode?.isFact && !selectedFact && (
          <div style={{
            position: "absolute",
            left: Math.min(hoveredNode.x + 14, size.w - 200),
            top: Math.max(hoveredNode.y - 40, 4),
            background: "#0d0d0d",
            border: `1px solid ${SOURCE_COLORS[hoveredNode.fact.source] || "#555"}44`,
            borderLeft: `2px solid ${SOURCE_COLORS[hoveredNode.fact.source] || "#555"}`,
            padding: "8px 12px",
            maxWidth: 200,
            pointerEvents: "none",
            zIndex: 10,
          }}>
            <div style={{ ...mono, fontSize: 8, color: SOURCE_COLORS[hoveredNode.fact.source] || "#888", letterSpacing: 2, marginBottom: 4 }}>
              {hoveredNode.fact.source} · {hoveredNode.fact.usability}
            </div>
            <div style={{ fontSize: 11, color: "#ccc", lineHeight: 1.4 }}>
              {hoveredNode.fact.fact.length > 80
                ? hoveredNode.fact.fact.slice(0, 80) + "…"
                : hoveredNode.fact.fact}
            </div>
          </div>
        )}
      </div>

      {/* ── SELECTED FACT DETAIL ── */}
      {selectedFact && (
        <div style={{
          borderTop: `1px solid ${SOURCE_COLORS[selectedFact.source] || "#333"}33`,
          padding: "14px 20px",
          background: "#070707",
          position: "relative",
        }}>
          <button
            onClick={() => setSelectedFact(null)}
            style={{
              position: "absolute", top: 10, right: 12,
              background: "transparent", border: "none",
              color: "#333", cursor: "pointer", ...mono, fontSize: 10,
            }}
          >✕</button>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span style={{
              ...mono, fontSize: 8, letterSpacing: 2,
              color: SOURCE_COLORS[selectedFact.source] || "#888",
              border: `1px solid ${SOURCE_COLORS[selectedFact.source] || "#888"}44`,
              padding: "2px 6px",
            }}>
              {selectedFact.source}
            </span>
            <span style={{
              ...mono, fontSize: 8, letterSpacing: 2,
              color: selectedFact.usability === "HIGH" ? "#00e676" : selectedFact.usability === "MED" ? "#ffb300" : "#555",
            }}>
              {selectedFact.usability} SIGNAL
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#ddd", lineHeight: 1.6, marginBottom: 8 }}>
            {selectedFact.fact}
          </div>
          {selectedFact.raw_quote && (
            <div style={{
              ...mono, fontSize: 10, color: "#444", lineHeight: 1.5,
              borderLeft: "1px solid #1a1a1a", paddingLeft: 10,
              fontStyle: "italic",
            }}>
              "{selectedFact.raw_quote.slice(0, 140)}{selectedFact.raw_quote.length > 140 ? "…" : ""}"
            </div>
          )}
        </div>
      )}

      {/* ── FACT LIST ── */}
      {factCount > 0 && !selectedFact && (
        <div style={{ borderTop: "1px solid #0d0d0d", padding: "12px 0" }}>
          {davidFacts.slice(0, 4).map((fact, i) => (
            <div
              key={i}
              onClick={() => setSelectedFact(fact)}
              style={{
                padding: "8px 20px",
                cursor: "pointer",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#0d0d0d"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{
                ...mono, fontSize: 7, color: SOURCE_COLORS[fact.source] || "#555",
                letterSpacing: 1, marginTop: 2, flexShrink: 0,
                border: `1px solid ${SOURCE_COLORS[fact.source] || "#555"}33`,
                padding: "1px 4px",
              }}>
                {fact.source.slice(0, 2)}
              </span>
              <span style={{ fontSize: 11, color: "#666", lineHeight: 1.5, flex: 1 }}>
                {fact.fact.length > 90 ? fact.fact.slice(0, 90) + "…" : fact.fact}
              </span>
              <span style={{
                ...mono, fontSize: 7, flexShrink: 0, marginTop: 2,
                color: fact.usability === "HIGH" ? "#00e67644" : "#2a2a2a",
              }}>
                {fact.usability === "HIGH" ? "●" : "○"}
              </span>
            </div>
          ))}
          {factCount > 4 && (
            <div style={{ ...mono, fontSize: 9, color: "#2a2a2a", letterSpacing: 2, padding: "6px 20px" }}>
              +{factCount - 4} MORE FACTS — CLICK NODES TO EXPLORE
            </div>
          )}
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{
        borderTop: "1px solid #0d0d0d",
        padding: "8px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ ...mono, fontSize: 8, color: "#1e1e1e", letterSpacing: 1 }}>
          ↳ ANATHEMA EXHAUST → DAVID STRUCTURE
        </div>
        {predictedTree !== "UNKNOWN" && (
          <div style={{ ...mono, fontSize: 8, color: treeColor + "88", letterSpacing: 2 }}>
            {predictedTree} · {treeConfidence}%
          </div>
        )}
      </div>
    </div>
  )
}


// ─── DEMO WRAPPER ─────────────────────────────────────────────────────────────
// Remove this and use DavidBrain directly in your DetailPanel

const DEMO_FACTS = [
  { source: "YOUTUBE", fact: "Video: 'Why I switched from captive to independent Medicare — my honest story' — 2,400 views, posted 8 months ago", raw_quote: "Why I switched from captive to independent Medicare — my honest story", usability: "HIGH" },
  { source: "FACEBOOK", fact: "Commented on a GoHealth affiliate post: 'These tools are getting better but still not where I need them'", raw_quote: "These tools are getting better but still not where I need them", usability: "HIGH" },
  { source: "GOOGLE_REVIEW", fact: "Client wrote: 'Marcus actually called me back on a Saturday. Nobody does that anymore'", raw_quote: "Marcus actually called me back on a Saturday. Nobody does that anymore", usability: "HIGH" },
  { source: "LINKEDIN", fact: "Posted 3 weeks ago: 'Thinking about what the next chapter of my practice looks like. Open to conversations.'", raw_quote: "Thinking about what the next chapter of my practice looks like.", usability: "HIGH" },
  { source: "SERP", fact: "Featured in Oklahoma Insurance Today: 'Top Medicare Producers to Watch in 2024'", raw_quote: "Top Medicare Producers to Watch in 2024", usability: "MED" },
  { source: "WEBSITE", fact: "Bio mentions 'FFL agent since 2019' and references integrityconnect tools by name", raw_quote: "FFL agent since 2019", usability: "MED" },
  { source: "FACEBOOK", fact: "Commented on an Integrity Summit recap post — 'Best event of the year, our team crushed it'", raw_quote: "Best event of the year, our team crushed it", usability: "MED" },
  { source: "SERP", fact: "No press mentions or conference appearances found — quiet operation, likely referral-only growth", raw_quote: "", usability: "LOW" },
]

export function DavidBrainDemo() {
  const [facts, setFacts] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  function addFact() {
    const next = DEMO_FACTS[facts.length % DEMO_FACTS.length]
    setFacts(prev => [...prev, next])
  }

  function simulateLoad() {
    setFacts([])
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setFacts(DEMO_FACTS)
    }, 2200)
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: 32, fontFamily: "'DM Mono', monospace" }}>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <button onClick={addFact} disabled={facts.length >= DEMO_FACTS.length} style={{ background: "#f4621f", border: "none", color: "#000", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: "8px 16px", cursor: "pointer" }}>
            + ADD FACT ({facts.length}/{DEMO_FACTS.length})
          </button>
          <button onClick={simulateLoad} style={{ background: "transparent", border: "1px solid #333", color: "#888", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: "8px 16px", cursor: "pointer" }}>
            SIMULATE ANATHEMA SCAN
          </button>
          <button onClick={() => setFacts([])} style={{ background: "transparent", border: "1px solid #1a1a1a", color: "#333", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, padding: "8px 16px", cursor: "pointer" }}>
            RESET
          </button>
        </div>

        <DavidBrain
          agentName="Marcus Williams"
          recruitFlag="WARM"
          recruitScore={41}
          predictedTree="AMERILIFE"
          treeConfidence={78}
          davidFacts={facts}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
