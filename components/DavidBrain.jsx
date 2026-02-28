"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const SOURCE_COLORS = {
  FACEBOOK:     "#4fc3f7",
  YOUTUBE:      "#ff4444",
  GOOGLE_REVIEW:"#f4621f",
  SERP:         "#ce93d8",
  WEBSITE:      "#80cbc4",
  LINKEDIN:     "#29b6f6",
  OTHER:        "#888888",
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

const TREE_COLORS = {
  INTEGRITY:  "#f4621f",
  AMERILIFE:  "#4fc3f7",
  SMS:        "#ce93d8",
  UNKNOWN:    "#444444",
  OTHER:      "#00e676",
}

// ─── SEEDED RNG ───────────────────────────────────────────────────────────────
function seededRng(seed) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

// ─── BUILD GRAPH ──────────────────────────────────────────────────────────────
function buildGraph(facts, w, h) {
  const rng = seededRng(facts.length * 137 + facts.reduce((a, f) => a + f.source.charCodeAt(0), 0))
  const cx = w / 2
  const cy = h / 2

  const core = { id: "core", x: cx, y: cy, vx: 0, vy: 0, r: 18, isCore: true, fixed: true }

  const sources = [...new Set(facts.map(f => f.source))]
  const sourceRing = Math.min(72, 44 + sources.length * 7)

  const sourceNodes = sources.map((src, i) => {
    const angle = (i / sources.length) * Math.PI * 2 - Math.PI / 2
    return {
      id: `src-${src}`,
      x: cx + Math.cos(angle) * sourceRing,
      y: cy + Math.sin(angle) * sourceRing,
      vx: 0, vy: 0,
      r: 12,
      isSource: true,
      source: src,
      fixed: false,
    }
  })

  const factsBySource = {}
  facts.forEach((f, i) => {
    if (!factsBySource[f.source]) factsBySource[f.source] = []
    factsBySource[f.source].push({ ...f, factIndex: i })
  })

  const factNodes = []
  sources.forEach(src => {
    const srcNode = sourceNodes.find(s => s.source === src)
    const group = factsBySource[src] || []
    const leafRing = 50 + group.length * 5
    group.forEach((fact, gi) => {
      const baseAngle = srcNode ? Math.atan2(srcNode.y - cy, srcNode.x - cx) : 0
      const spread = Math.min(1.1, 0.3 * group.length)
      const angle = baseAngle + (group.length > 1 ? (gi / (group.length - 1) - 0.5) * spread : 0)
      factNodes.push({
        id: `fact-${fact.factIndex}`,
        x: (srcNode?.x ?? cx) + Math.cos(angle) * leafRing,
        y: (srcNode?.y ?? cy) + Math.sin(angle) * leafRing,
        vx: (rng() - 0.5) * 0.3,
        vy: (rng() - 0.5) * 0.3,
        r: fact.usability === "HIGH" ? 8 : fact.usability === "MED" ? 6 : 4,
        isFact: true,
        fact,
        factIndex: fact.factIndex,
        fixed: false,
      })
    })
  })

  const nodes = [core, ...sourceNodes, ...factNodes]

  const edges = []
  sourceNodes.forEach(s => edges.push({ from: "core", to: s.id, restLen: sourceRing, k: 0.08 }))
  factNodes.forEach(fn => {
    const srcNode = sourceNodes.find(s => s.source === fn.fact.source)
    if (srcNode) {
      const group = factsBySource[fn.fact.source] || []
      const leafRing = 50 + group.length * 5
      edges.push({ from: srcNode.id, to: fn.id, restLen: leafRing * 0.88, k: 0.1 })
    }
  })

  return { nodes, edges }
}

// ─── PHYSICS ──────────────────────────────────────────────────────────────────
function tick(nodes, edges, w, h) {
  const map = {}
  nodes.forEach(n => { map[n.id] = n })

  edges.forEach(e => {
    const a = map[e.from], b = map[e.to]
    if (!a || !b) return
    const dx = b.x - a.x, dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const force = (dist - e.restLen) * e.k
    const fx = (dx / dist) * force, fy = (dy / dist) * force
    if (!a.fixed) { a.vx += fx; a.vy += fy }
    if (!b.fixed) { b.vx -= fx; b.vy -= fy }
  })

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      if (a.isCore || b.isCore) continue
      const dx = b.x - a.x, dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const minD = a.r + b.r + 12
      if (dist < minD) {
        const force = ((minD - dist) / dist) * 0.22
        if (!a.fixed) { a.vx -= dx * force; a.vy -= dy * force }
        if (!b.fixed) { b.vx += dx * force; b.vy += dy * force }
      }
    }
  }

  nodes.forEach(n => {
    if (n.fixed) return
    n.vx += (w / 2 - n.x) * 0.004
    n.vy += (h / 2 - n.y) * 0.004
    n.vx *= 0.82; n.vy *= 0.82
    n.x += n.vx; n.y += n.vy
    const pad = n.r + 8
    n.x = Math.max(pad, Math.min(w - pad, n.x))
    n.y = Math.max(pad, Math.min(h - pad, n.y))
  })
}

function settle(nodes, edges, w, h, steps = 300) {
  for (let i = 0; i < steps; i++) tick(nodes, edges, w, h)
}

// ─── PULSES ───────────────────────────────────────────────────────────────────
function usePulses(edges, nodes, active) {
  const [pulses, setPulses] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    if (!active || !edges.length) return
    const factEdges = edges.filter(e => e.to.startsWith("fact-"))
    if (!factEdges.length) return
    const iv = setInterval(() => {
      const e = factEdges[Math.floor(Math.random() * factEdges.length)]
      const a = nodes.find(n => n.id === e.from)
      const b = nodes.find(n => n.id === e.to)
      if (!a || !b) return
      setPulses(prev => [...prev, { id: idRef.current++, a, b, born: Date.now() }])
    }, 280)
    return () => clearInterval(iv)
  }, [edges, nodes, active])

  useEffect(() => {
    let raf
    const loop = () => {
      const now = Date.now()
      setPulses(prev => prev.map(p => ({ ...p, t: (now - p.born) / 750 })).filter(p => p.t < 1))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return pulses
}

// ─── DRAW ─────────────────────────────────────────────────────────────────────
function draw(canvas, graph, revealedCount, hoveredNode, clickedNode, pulses, size, predictedTree) {
  if (!canvas || !graph) return
  const ctx = canvas.getContext("2d")
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== size.w * dpr || canvas.height !== size.h * dpr) {
    canvas.width = size.w * dpr
    canvas.height = size.h * dpr
    ctx.scale(dpr, dpr)
  }
  canvas.style.width = size.w + "px"
  canvas.style.height = size.h + "px"

  ctx.clearRect(0, 0, size.w, size.h)

  const map = {}
  graph.nodes.forEach(n => { map[n.id] = n })
  const treeColor = TREE_COLORS[predictedTree?.toUpperCase()] || TREE_COLORS.UNKNOWN

  // Brain background glow
  const bg = ctx.createRadialGradient(size.w / 2, size.h / 2, 0, size.w / 2, size.h / 2, size.w * 0.44)
  bg.addColorStop(0, treeColor + "09")
  bg.addColorStop(1, "transparent")
  ctx.beginPath()
  ctx.arc(size.w / 2, size.h / 2, size.w * 0.44, 0, Math.PI * 2)
  ctx.fillStyle = bg
  ctx.fill()

  // Edges
  graph.edges.forEach(e => {
    const a = map[e.from], b = map[e.to]
    if (!a || !b) return
    if (graph.nodes.indexOf(a) >= revealedCount || graph.nodes.indexOf(b) >= revealedCount) return
    const isActive = (hoveredNode && (hoveredNode.id === a.id || hoveredNode.id === b.id))
      || (clickedNode && (clickedNode.id === a.id || clickedNode.id === b.id))
    const col = b.isFact ? SOURCE_COLORS[b.fact?.source] || "#888888"
      : a.isSource ? SOURCE_COLORS[a.source] || "#888888" : treeColor
    const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.1
    const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.1
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.quadraticCurveTo(mx, my, b.x, b.y)
    ctx.strokeStyle = isActive ? col + "bb" : col + "26"
    ctx.lineWidth = isActive ? 1.2 : 0.6
    ctx.stroke()
  })

  // Pulse dots
  pulses.forEach(p => {
    if (graph.nodes.indexOf(p.a) >= revealedCount || graph.nodes.indexOf(p.b) >= revealedCount) return
    const t = p.t < 0.5 ? 2 * p.t * p.t : -1 + (4 - 2 * p.t) * p.t
    const mx = (p.a.x + p.b.x) / 2 + (p.b.y - p.a.y) * 0.1
    const my = (p.a.y + p.b.y) / 2 - (p.b.x - p.a.x) * 0.1
    const px = (1 - t) * (1 - t) * p.a.x + 2 * (1 - t) * t * mx + t * t * p.b.x
    const py = (1 - t) * (1 - t) * p.a.y + 2 * (1 - t) * t * my + t * t * p.b.y
    const col = p.b.isFact ? SOURCE_COLORS[p.b.fact?.source] || "#888888" : treeColor
    const alpha = Math.round(Math.sin(p.t * Math.PI) * 200).toString(16).padStart(2, "0")
    ctx.beginPath()
    ctx.arc(px, py, 2, 0, Math.PI * 2)
    ctx.fillStyle = col + alpha
    ctx.fill()
  })

  // Nodes
  graph.nodes.forEach((node, ni) => {
    if (ni >= revealedCount) return
    const isHovered = hoveredNode?.id === node.id
    const isClicked = clickedNode?.id === node.id

    if (node.isCore) {
      const pulse = (Date.now() % 2600) / 2600
      const pr = node.r + 5 + Math.sin(pulse * Math.PI * 2) * 3
      ctx.beginPath(); ctx.arc(node.x, node.y, pr, 0, Math.PI * 2)
      ctx.strokeStyle = treeColor + "1e"; ctx.lineWidth = 1; ctx.stroke()

      const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 2.2)
      g.addColorStop(0, treeColor + "44"); g.addColorStop(1, "transparent")
      ctx.beginPath(); ctx.arc(node.x, node.y, node.r * 2.2, 0, Math.PI * 2)
      ctx.fillStyle = g; ctx.fill()

      ctx.beginPath(); ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
      ctx.fillStyle = "#070707"; ctx.fill()
      ctx.strokeStyle = treeColor; ctx.lineWidth = 1.5; ctx.stroke()

      ctx.beginPath(); ctx.arc(node.x, node.y, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = treeColor; ctx.fill()
      return
    }

    if (node.isSource) {
      const col = SOURCE_COLORS[node.source] || "#888888"
      const active = isHovered || isClicked
      if (active) {
        const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 2.5)
        g.addColorStop(0, col + "44"); g.addColorStop(1, "transparent")
        ctx.beginPath(); ctx.arc(node.x, node.y, node.r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
      }
      ctx.beginPath(); ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
      ctx.fillStyle = active ? col + "1a" : "#0c0c0c"; ctx.fill()
      ctx.strokeStyle = active ? col : col + "66"; ctx.lineWidth = active ? 1.5 : 1; ctx.stroke()
      ctx.fillStyle = active ? col : col + "bb"
      ctx.font = "bold 7px 'DM Mono', monospace"
      ctx.textAlign = "center"; ctx.textBaseline = "middle"
      ctx.fillText(SOURCE_ICONS[node.source] || "??", node.x, node.y)
      return
    }

    if (node.isFact) {
      const col = SOURCE_COLORS[node.fact.source] || "#888888"
      const active = isHovered || isClicked
      const isHigh = node.fact.usability === "HIGH"

      if (active || isHigh) {
        const gr = node.r * (active ? 3.8 : 2.4)
        const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, gr)
        g.addColorStop(0, col + (active ? "55" : "28")); g.addColorStop(1, "transparent")
        ctx.beginPath(); ctx.arc(node.x, node.y, gr, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
      }

      ctx.beginPath(); ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
      ctx.fillStyle = active ? col + "28" : "#090909"; ctx.fill()
      ctx.strokeStyle = active ? col : col + (isHigh ? "bb" : "44")
      ctx.lineWidth = active ? 1.5 : 0.8; ctx.stroke()

      if (isHigh) {
        ctx.beginPath(); ctx.arc(node.x, node.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = active ? col : col + "88"; ctx.fill()
      }

      if (isClicked) {
        ctx.beginPath(); ctx.arc(node.x, node.y, node.r + 5, 0, Math.PI * 2)
        ctx.strokeStyle = col + "66"; ctx.lineWidth = 1
        ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([])
      }
    }
  })
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function DavidBrain({
  agentName = "Agent",
  recruitFlag = "WARM",
  recruitScore = 0,
  predictedTree = "UNKNOWN",
  treeConfidence = 0,
  davidFacts = [],
  isLoading = false,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const [size, setSize] = useState({ w: 520, h: 300 })
  const [graph, setGraph] = useState(null)
  const [revealedCount, setRevealedCount] = useState(0)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [clickedNode, setClickedNode] = useState(null)
  const pulses = usePulses(
    graph?.edges || [],
    graph?.nodes || [],
    revealedCount >= (graph?.nodes?.length || 0)
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width)
      setSize({ w, h: Math.floor(Math.min(w * 0.58, 320)) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!davidFacts?.length) { setGraph(null); setRevealedCount(0); return }
    const { nodes, edges } = buildGraph(davidFacts, size.w, size.h)
    settle(nodes, edges, size.w, size.h, 320)
    setGraph({ nodes, edges })
    setRevealedCount(0)
    setClickedNode(null)
  }, [davidFacts, size.w, size.h])

  useEffect(() => {
    if (!graph || revealedCount >= graph.nodes.length) return
    const t = setTimeout(() => setRevealedCount(c => c + 1), 40)
    return () => clearTimeout(t)
  }, [graph, revealedCount])

  useEffect(() => {
    const loop = () => {
      if (canvasRef.current && graph) {
        draw(canvasRef.current, graph, revealedCount, hoveredNode, clickedNode, pulses, size, predictedTree)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [graph, revealedCount, hoveredNode, clickedNode, pulses, size, predictedTree])

  const hitTest = useCallback((e) => {
    if (!graph || !canvasRef.current) return null
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    for (const node of [...graph.nodes].reverse()) {
      if (Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2) < node.r + 7) return node
    }
    return null
  }, [graph])

  const handleMouseMove = useCallback((e) => {
    const node = hitTest(e)
    setHoveredNode(node)
    if (canvasRef.current) canvasRef.current.style.cursor = node?.isFact ? "pointer" : "default"
  }, [hitTest])

  const handleClick = useCallback((e) => {
    const node = hitTest(e)
    if (node?.isFact) setClickedNode(prev => prev?.id === node.id ? null : node)
    else setClickedNode(null)
  }, [hitTest])

  const treeColor = TREE_COLORS[predictedTree?.toUpperCase()] || TREE_COLORS.UNKNOWN
  const flagColor = recruitFlag === "HOT" ? "#00e676" : recruitFlag === "WARM" ? "#ffb300" : "#555555"
  const factCount = davidFacts?.length || 0
  const highCount = davidFacts?.filter(f => f.usability === "HIGH").length || 0
  const mono = { fontFamily: "'DM Mono', 'Courier New', monospace" }
  const clickedFact = clickedNode?.fact || null

  return (
    <div style={{ background: "#040404", border: "1px solid #141414", width: "100%", userSelect: "none" }}>
      <style>{`
        @keyframes factIn { from { opacity:0; transform:translateY(-3px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dp { 0%,100%{opacity:.1;transform:scale(.8)} 50%{opacity:1;transform:scale(1.4)} }
      `}</style>

      {/* Header */}
      <div style={{ padding: "11px 18px", borderBottom: "1px solid #0d0d0d", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: treeColor, boxShadow: `0 0 5px ${treeColor}` }} />
          <span style={{ ...mono, fontSize: 8, color: "#2a2a2a", letterSpacing: 3, textTransform: "uppercase" }}>◈ DAVID PROFILE</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {factCount > 0 && (
            <span style={{ ...mono, fontSize: 8, color: "#2a2a2a", letterSpacing: 2 }}>
              {factCount} FACTS · <span style={{ color: highCount > 0 ? "#00e67688" : "#2a2a2a" }}>{highCount} HIGH</span>
            </span>
          )}
          <span style={{ ...mono, fontSize: 8, color: flagColor, letterSpacing: 2, borderLeft: `1px solid ${flagColor}33`, paddingLeft: 8 }}>
            {recruitFlag}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ width: "100%", position: "relative", background: "#020202" }}>
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: size.h }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={handleClick}
        />

        {!isLoading && factCount === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, pointerEvents: "none" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "#131313", letterSpacing: 5 }}>DAVID</div>
            <div style={{ ...mono, fontSize: 7, color: "#181818", letterSpacing: 3 }}>RUN ANATHEMA TO SEED THIS PROFILE</div>
          </div>
        )}

        {isLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, pointerEvents: "none" }}>
            <div style={{ ...mono, fontSize: 8, color: "#f4621f", letterSpacing: 3 }}>■ EXTRACTING DAVID FACTS</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#f4621f", animation: `dp 1.2s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredNode?.isFact && !clickedNode && (
          <div style={{
            position: "absolute",
            left: Math.min(hoveredNode.x + 14, size.w - 215),
            top: Math.max(hoveredNode.y - 36, 4),
            background: "#0a0a0a",
            border: `1px solid ${SOURCE_COLORS[hoveredNode.fact.source] || "#333333"}33`,
            borderLeft: `2px solid ${SOURCE_COLORS[hoveredNode.fact.source] || "#333333"}`,
            padding: "7px 10px", maxWidth: 205,
            pointerEvents: "none", zIndex: 20,
          }}>
            <div style={{ ...mono, fontSize: 7, color: SOURCE_COLORS[hoveredNode.fact.source] || "#888888", letterSpacing: 2, marginBottom: 3 }}>
              {hoveredNode.fact.source} · {hoveredNode.fact.usability}
            </div>
            <div style={{ fontSize: 10, color: "#aaa", lineHeight: 1.5 }}>
              {hoveredNode.fact.fact.length > 72 ? hoveredNode.fact.fact.slice(0, 72) + "…" : hoveredNode.fact.fact}
            </div>
            <div style={{ ...mono, fontSize: 7, color: "#222", marginTop: 4 }}>CLICK TO EXPAND</div>
          </div>
        )}
      </div>

      {/* Clicked fact card */}
      {clickedFact && (() => {
        const col = SOURCE_COLORS[clickedFact.source] || "#888888"
        const usabilityColor = clickedFact.usability === "HIGH" ? "#00e676" : clickedFact.usability === "MED" ? "#ffb300" : "#555555"
        return (
          <div style={{
            margin: "2px",
            background: "#060606",
            border: `1px solid ${col}1a`,
            borderLeft: `2px solid ${col}`,
            padding: "14px 18px",
            position: "relative",
            animation: "factIn 0.16s ease both",
          }}>
            <button onClick={() => setClickedNode(null)} style={{ position: "absolute", top: 10, right: 12, background: "transparent", border: "none", color: "#2a2a2a", cursor: "pointer", ...mono, fontSize: 11 }}>✕</button>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
              <span style={{ ...mono, fontSize: 7, letterSpacing: 2, color: col, border: `1px solid ${col}33`, padding: "2px 6px" }}>
                {clickedFact.source}
              </span>
              <span style={{ ...mono, fontSize: 7, letterSpacing: 2, color: usabilityColor }}>
                {clickedFact.usability === "HIGH" ? "● HIGH SIGNAL" : clickedFact.usability === "MED" ? "◐ MED SIGNAL" : "○ LOW SIGNAL"}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#ddd", lineHeight: 1.65, marginBottom: 4 }}>
              {clickedFact.fact}
            </div>
            {clickedFact.raw_quote && (
              <div style={{ ...mono, fontSize: 9, color: "#383838", lineHeight: 1.6, borderLeft: "1px solid #181818", paddingLeft: 10, marginTop: 8, fontStyle: "italic" }}>
                "{clickedFact.raw_quote.length > 160 ? clickedFact.raw_quote.slice(0, 160) + "…" : clickedFact.raw_quote}"
              </div>
            )}
          </div>
        )
      })()}

      {/* Source legend */}
      {!clickedFact && factCount > 0 && (
        <div style={{ padding: "9px 18px", borderTop: "1px solid #090909", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {[...new Set(davidFacts.map(f => f.source))].map(src => {
            const col = SOURCE_COLORS[src] || "#888888"
            const count = davidFacts.filter(f => f.source === src).length
            return (
              <div key={src} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: col, opacity: 0.7 }} />
                <span style={{ ...mono, fontSize: 7, color: "#2a2a2a", letterSpacing: 1 }}>{SOURCE_ICONS[src]} {count}</span>
              </div>
            )
          })}
          <span style={{ ...mono, fontSize: 7, color: "#1a1a1a", marginLeft: "auto", letterSpacing: 1 }}>CLICK NODES</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #090909", padding: "5px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ ...mono, fontSize: 7, color: "#181818", letterSpacing: 1 }}>↳ ANATHEMA EXHAUST → DAVID STRUCTURE</div>
        {predictedTree && predictedTree.toUpperCase() !== "UNKNOWN" && (
          <div style={{ ...mono, fontSize: 7, color: treeColor + "55", letterSpacing: 2 }}>
            {predictedTree.toUpperCase()} · {treeConfidence}%
          </div>
        )}
      </div>
    </div>
  )
}
