"use client"

import { useEffect, useRef, useState, useCallback } from "react"

const DEMO_AGENTS = [
  { id: 1,  name: "ABC Medicare Help",          tree: "OTHER",     city: "OKC",    state: "OK", facts: 8,  highFacts: 3, confidence: 72, upline: "Complete Business Solutions", hasFacebook: true,  apifyEnriched: true  },
  { id: 2,  name: "Oklahoma Medicare",           tree: "INTEGRITY", city: "Edmond", state: "OK", facts: 5,  highFacts: 2, confidence: 88, upline: "Integrity Marketing Group",  hasFacebook: false, apifyEnriched: false },
  { id: 3,  name: "Derby Insurance Solutions",   tree: "INTEGRITY", city: "OKC",    state: "OK", facts: 11, highFacts: 5, confidence: 91, upline: "Integrity Marketing Group",  hasFacebook: true,  apifyEnriched: true  },
  { id: 4,  name: "Wiebe Insurance Advisors",    tree: "UNKNOWN",   city: "OKC",    state: "OK", facts: 3,  highFacts: 0, confidence: 0,  upline: null,                         hasFacebook: false, apifyEnriched: false },
  { id: 5,  name: "Safe Insurance Solutions",    tree: "AMERILIFE", city: "OKC",    state: "OK", facts: 7,  highFacts: 2, confidence: 65, upline: "AmeriLife",                  hasFacebook: true,  apifyEnriched: true  },
  { id: 6,  name: "Brett Casey Insurance",       tree: "INTEGRITY", city: "OKC",    state: "OK", facts: 9,  highFacts: 4, confidence: 79, upline: "Neat Management Group",      hasFacebook: false, apifyEnriched: false },
  { id: 7,  name: "Medicare Help Tulsa",         tree: "SMS",       city: "Tulsa",  state: "OK", facts: 4,  highFacts: 1, confidence: 58, upline: "Senior Market Sales",        hasFacebook: true,  apifyEnriched: false },
  { id: 8,  name: "OK Medicare Help",            tree: "INTEGRITY", city: "OKC",    state: "OK", facts: 12, highFacts: 6, confidence: 95, upline: "Integrity Marketing Group",  hasFacebook: true,  apifyEnriched: true  },
  { id: 9,  name: "316 Health Insurance",        tree: "UNKNOWN",   city: "Tulsa",  state: "OK", facts: 6,  highFacts: 1, confidence: 0,  upline: null,                         hasFacebook: false, apifyEnriched: false },
  { id: 10, name: "Affordable Life & Health",    tree: "AMERILIFE", city: "Tulsa",  state: "OK", facts: 5,  highFacts: 2, confidence: 61, upline: "AmeriLife",                  hasFacebook: false, apifyEnriched: false },
  { id: 11, name: "Better Coverage Consultants", tree: "UNKNOWN",   city: "OKC",    state: "OK", facts: 2,  highFacts: 0, confidence: 0,  upline: null,                         hasFacebook: false, apifyEnriched: false },
  { id: 12, name: "CommunityCare",               tree: "SMS",       city: "Tulsa",  state: "OK", facts: 6,  highFacts: 2, confidence: 74, upline: "Senior Market Sales",        hasFacebook: true,  apifyEnriched: true  },
  { id: 13, name: "OKC Insurance Brokers",       tree: "OTHER",     city: "OKC",    state: "OK", facts: 4,  highFacts: 1, confidence: 45, upline: "Higginbotham",               hasFacebook: false, apifyEnriched: false },
  { id: 14, name: "Navigating Medicare",         tree: "INTEGRITY", city: "OKC",    state: "OK", facts: 7,  highFacts: 3, confidence: 83, upline: "Neat Management Group",      hasFacebook: false, apifyEnriched: false },
  { id: 15, name: "Legacy Medicare Plans",       tree: "INTEGRITY", city: "Tulsa",  state: "OK", facts: 9,  highFacts: 4, confidence: 87, upline: "Integrity Marketing Group",  hasFacebook: true,  apifyEnriched: true  },
]

const TREE_COLORS = {
  INTEGRITY:  { primary: "#f4621f", glow: "rgba(244,98,31,0.6)",   dim: "rgba(244,98,31,0.15)"  },
  AMERILIFE:  { primary: "#4fc3f7", glow: "rgba(79,195,247,0.6)",  dim: "rgba(79,195,247,0.15)" },
  SMS:        { primary: "#ce93d8", glow: "rgba(206,147,216,0.6)", dim: "rgba(206,147,216,0.15)"},
  OTHER:      { primary: "#00e676", glow: "rgba(0,230,118,0.6)",   dim: "rgba(0,230,118,0.15)"  },
  UNKNOWN:    { primary: "#444444", glow: "rgba(68,68,68,0.4)",    dim: "rgba(68,68,68,0.08)"   },
}

const mono = { fontFamily: "'DM Mono', 'Courier New', monospace" }

function computeLayout(agents, width, height) {
  const cx = width / 2, cy = height / 2
  const clusters = {}
  agents.forEach(a => {
    const key = a.upline || "__unknown__"
    if (!clusters[key]) clusters[key] = []
    clusters[key].push(a)
  })
  const clusterKeys = Object.keys(clusters)
  const nodes = []
  clusterKeys.forEach((key, ci) => {
    const members = clusters[key]
    const isUnknown = key === "__unknown__"
    const clusterAngle = (ci / clusterKeys.length) * Math.PI * 2 - Math.PI / 2
    const clusterR = isUnknown ? Math.min(width, height) * 0.38 : Math.min(width, height) * 0.26
    const clusterCx = cx + Math.cos(clusterAngle) * clusterR
    const clusterCy = cy + Math.sin(clusterAngle) * clusterR
    members.forEach((agent, mi) => {
      const angle = (mi / members.length) * Math.PI * 2
      const r = members.length === 1 ? 0 : 30 + members.length * 4
      nodes.push({ ...agent, x: clusterCx + Math.cos(angle) * r, y: clusterCy + Math.sin(angle) * r, clusterKey: key, clusterCx, clusterCy })
    })
  })
  return { nodes, clusters, clusterKeys }
}

export default function DavidNetwork() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const layoutRef = useRef(null)
  const [agents, setAgents] = useState(null)
  const [isDemo, setIsDemo] = useState(false)
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [dims, setDims] = useState({ w: 800, h: 600 })

  useEffect(() => {
    fetch('/api/david/network')
      .then(r => r.json())
      .then(d => {
        if (d.nodes?.length > 0) { setAgents(d.nodes); setIsDemo(false) }
        else { setAgents(DEMO_AGENTS); setIsDemo(true) }
      })
      .catch(() => { setAgents(DEMO_AGENTS); setIsDemo(true) })
  }, [])

  useEffect(() => {
    const update = () => {
      const el = canvasRef.current?.parentElement
      if (el) setDims({ w: el.offsetWidth, h: el.offsetHeight })
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  useEffect(() => {
    if (agents) layoutRef.current = computeLayout(agents, dims.w, dims.h)
  }, [agents, dims])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !agents) return
    const ctx = canvas.getContext("2d")
    let t0 = null

    const draw = (ts) => {
      if (!t0) t0 = ts
      const time = (ts - t0) * 0.001
      const layout = layoutRef.current
      if (!layout) { animRef.current = requestAnimationFrame(draw); return }
      const { nodes } = layout
      const { w, h } = dims
      const cx = w / 2, cy = h / 2

      ctx.clearRect(0, 0, w, h)

      const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w,h)*0.45)
      sg.addColorStop(0, "rgba(15,25,15,0.9)"); sg.addColorStop(0.5, "rgba(5,10,5,0.4)"); sg.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, Math.min(w,h)*0.45, 0, Math.PI*2); ctx.fill()

      nodes.forEach(n => {
        if (n.clusterKey === "__unknown__") return
        const col = TREE_COLORS[n.tree] || TREE_COLORS.UNKNOWN
        const pulse = 0.25 + 0.12 * Math.sin(time * 1.2 + n.id)
        ctx.beginPath(); ctx.moveTo(n.clusterCx, n.clusterCy); ctx.lineTo(n.x, n.y)
        ctx.strokeStyle = col.primary + Math.round(pulse * 255).toString(16).padStart(2,"0")
        ctx.lineWidth = 0.5; ctx.stroke()
      })

      ctx.setLineDash([3, 7])
      nodes.forEach((a, i) => {
        nodes.slice(i+1).forEach(b => {
          if (a.tree !== b.tree || a.tree === "UNKNOWN" || a.clusterKey === b.clusterKey) return
          const dist = Math.hypot(a.x-b.x, a.y-b.y)
          if (dist > 300) return
          const col = TREE_COLORS[a.tree]
          const alpha = 0.05 * (1 - dist/300) * (0.7 + 0.3*Math.sin(time*0.7+a.id+b.id))
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = col.primary + Math.round(alpha*255).toString(16).padStart(2,"0")
          ctx.lineWidth = 0.4; ctx.stroke()
        })
      })
      ctx.setLineDash([])

      const seen = new Set()
      nodes.forEach(n => {
        if (n.clusterKey === "__unknown__" || seen.has(n.clusterKey)) return
        seen.add(n.clusterKey)
        const col = TREE_COLORS[n.tree] || TREE_COLORS.UNKNOWN
        const p = 0.5 + 0.5 * Math.sin(time * 0.6 + n.clusterKey.length)
        ctx.beginPath(); ctx.arc(n.clusterCx, n.clusterCy, 3.5, 0, Math.PI*2)
        ctx.fillStyle = col.primary; ctx.globalAlpha = 0.5*p; ctx.fill(); ctx.globalAlpha = 1
        ctx.beginPath(); ctx.arc(n.clusterCx, n.clusterCy, 7+3*p, 0, Math.PI*2)
        ctx.strokeStyle = col.primary; ctx.globalAlpha = 0.12*p; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1
      })

      nodes.forEach(n => {
        const col = TREE_COLORS[n.tree] || TREE_COLORS.UNKNOWN
        const isSel = selected?.id === n.id
        const isHov = hovered?.id === n.id
        const r = 4 + Math.min(n.facts, 12) * 0.5
        const pulse = 0.7 + 0.3 * Math.sin(time * 1.5 + n.id * 0.7)

        if (isSel || isHov) {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r*4)
          g.addColorStop(0, col.glow); g.addColorStop(1, "transparent")
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, r*4, 0, Math.PI*2); ctx.fill()
        }

        ctx.beginPath(); ctx.arc(n.x, n.y, r+4+3*pulse, 0, Math.PI*2)
        ctx.strokeStyle = col.primary; ctx.globalAlpha = isSel ? 0.5 : 0.1*pulse
        ctx.lineWidth = isSel ? 1.5 : 0.5; ctx.stroke(); ctx.globalAlpha = 1

        const ng = ctx.createRadialGradient(n.x-r*0.3, n.y-r*0.3, 0, n.x, n.y, r)
        ng.addColorStop(0, isSel ? col.primary : col.primary+"cc")
        ng.addColorStop(1, isSel ? col.primary+"aa" : col.dim)
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2)
        ctx.fillStyle = ng; ctx.fill()
        ctx.strokeStyle = col.primary; ctx.globalAlpha = isSel ? 1 : 0.6
        ctx.lineWidth = isSel ? 1.5 : 0.8; ctx.stroke(); ctx.globalAlpha = 1

        if (n.apifyEnriched) {
          ctx.beginPath(); ctx.arc(n.x+r*0.75, n.y-r*0.75, 2.5, 0, Math.PI*2)
          ctx.fillStyle = "#00e676"; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1
        }
      })

      const orbR = Math.min(w,h)*0.044
      const op = 0.85 + 0.15*Math.sin(time*0.8)
      const og = ctx.createRadialGradient(cx,cy,0,cx,cy,orbR*op)
      og.addColorStop(0,"rgba(0,230,118,0.9)"); og.addColorStop(0.4,"rgba(0,230,118,0.3)"); og.addColorStop(1,"rgba(0,230,118,0)")
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx,cy,orbR*op*2,0,Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx,cy,orbR*op,0,Math.PI*2)
      ctx.fillStyle="rgba(0,230,118,0.12)"; ctx.fill()
      ctx.strokeStyle="rgba(0,230,118,0.5)"; ctx.lineWidth=0.8; ctx.stroke()
      ctx.fillStyle="rgba(0,230,118,0.7)"
      ctx.font=`${Math.round(orbR*0.42)}px 'DM Mono',monospace`
      ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("DAVID",cx,cy)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [dims, selected, hovered, agents])

  const getNodeAt = useCallback((mx, my) => {
    const layout = layoutRef.current
    if (!layout) return null
    return layout.nodes.find(n => Math.hypot(n.x-mx, n.y-my) < (4 + Math.min(n.facts,12)*0.5 + 8)) || null
  }, [])

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const node = getNodeAt(e.clientX-rect.left, e.clientY-rect.top)
    setHovered(node)
    canvasRef.current.style.cursor = node ? "pointer" : "default"
  }

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const node = getNodeAt(e.clientX-rect.left, e.clientY-rect.top)
    setSelected(node?.id === selected?.id ? null : node)
  }

  const col = selected ? (TREE_COLORS[selected.tree] || TREE_COLORS.UNKNOWN) : null
  const totalFacts = agents ? agents.reduce((s,a) => s+a.facts, 0) : 0
  const enrichedCount = agents ? agents.filter(a => a.apifyEnriched).length : 0

  return (
    <div style={{ display:"flex", height:"100%", width:"100%", background:"#020402", position:"relative", overflow:"hidden" }}>
      <div style={{ flex:1, position:"relative" }}>
        <canvas ref={canvasRef} width={dims.w} height={dims.h}
          onMouseMove={handleMouseMove} onClick={handleClick}
          style={{ display:"block", width:"100%", height:"100%" }} />

        {!agents && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ ...mono, fontSize:9, color:"#1a2a1a", letterSpacing:4 }}>LOADING NETWORK...</div>
          </div>
        )}

        {isDemo && agents && (
          <div style={{ position:"absolute", top:16, left:"50%", transform:"translateX(-50%)", ...mono, fontSize:8, color:"#1a3a1a", letterSpacing:3, border:"1px solid #1a2a1a", padding:"4px 12px", background:"#020802" }}>
            DEMO DATA · RUN ANATHEMA SCANS TO POPULATE
          </div>
        )}

        {agents && (
          <div style={{ position:"absolute", top:16, left:16, display:"flex", gap:20 }}>
            <div style={{ ...mono, fontSize:8, color:"#1a2a1a", letterSpacing:3 }}>◈ DAVID</div>
            <div style={{ ...mono, fontSize:8, color:"#1a2a1a", letterSpacing:2 }}>{agents.length} SPECIMENS</div>
            <div style={{ ...mono, fontSize:8, color:"#1a2a1a", letterSpacing:2 }}>{totalFacts} FACTS</div>
            <div style={{ ...mono, fontSize:8, color:"rgba(0,230,118,0.3)", letterSpacing:2 }}>{enrichedCount} DEEP ENRICHED</div>
          </div>
        )}

        {hovered && !selected && (
          <div style={{ position:"absolute", left:hovered.x+14, top:hovered.y-10, background:"#080808", border:`1px solid ${(TREE_COLORS[hovered.tree]||TREE_COLORS.UNKNOWN).primary}33`, padding:"8px 12px", pointerEvents:"none", zIndex:10 }}>
            <div style={{ ...mono, fontSize:10, color:"#fff", letterSpacing:1 }}>{hovered.name}</div>
            <div style={{ ...mono, fontSize:7, color:(TREE_COLORS[hovered.tree]||TREE_COLORS.UNKNOWN).primary, letterSpacing:1, marginTop:3 }}>
              {hovered.facts} FACTS{hovered.highFacts > 0 ? ` · ${hovered.highFacts} HIGH` : ""} · {hovered.city}
            </div>
            {hovered.upline && <div style={{ ...mono, fontSize:7, color:"#333", letterSpacing:1, marginTop:2 }}>{hovered.upline}</div>}
          </div>
        )}

        <div style={{ position:"absolute", bottom:20, left:20, display:"flex", flexDirection:"column", gap:5 }}>
          {Object.entries(TREE_COLORS).map(([tree, c]) => (
            <div key={tree} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:c.primary, boxShadow:`0 0 3px ${c.primary}` }} />
              <span style={{ ...mono, fontSize:7, color:"#222", letterSpacing:2 }}>{tree}</span>
            </div>
          ))}
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:"#00e676" }} />
            <span style={{ ...mono, fontSize:7, color:"#1a3a1a", letterSpacing:2 }}>DEEP ENRICHED</span>
          </div>
        </div>
      </div>

      <div style={{ width:selected?320:0, overflow:"hidden", transition:"width 0.2s ease", borderLeft:selected?"1px solid #0e0e0e":"none", background:"#030603", flexShrink:0 }}>
        {selected && col && (
          <div style={{ width:320, padding:"28px 24px", height:"100%", overflowY:"auto", boxSizing:"border-box" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:col.primary, boxShadow:`0 0 6px ${col.primary}` }} />
                  <span style={{ ...mono, fontSize:8, color:col.primary, letterSpacing:3 }}>{selected.tree}</span>
                  {selected.apifyEnriched && <span style={{ ...mono, fontSize:7, color:"#00e676", border:"1px solid #00e67622", padding:"1px 5px", letterSpacing:1 }}>DEEP</span>}
                </div>
                <button onClick={() => setSelected(null)} style={{ ...mono, fontSize:9, color:"#2a2a2a", background:"none", border:"none", cursor:"pointer", letterSpacing:2 }}>× CLOSE</button>
              </div>
              <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:24, color:"#fff", letterSpacing:2, lineHeight:1.1, marginBottom:4 }}>{selected.name}</div>
              <div style={{ ...mono, fontSize:8, color:"#333", letterSpacing:2 }}>{selected.city}, {selected.state}</div>
            </div>

            {selected.confidence > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ ...mono, fontSize:7, color:"#1a1a1a", letterSpacing:3, marginBottom:5 }}>TREE CONFIDENCE</div>
                <div style={{ height:2, background:"#0a0a0a", position:"relative", marginBottom:4 }}>
                  <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${selected.confidence}%`, background:col.primary }} />
                </div>
                <div style={{ ...mono, fontSize:8, color:col.primary }}>{selected.confidence}%</div>
              </div>
            )}

            {selected.upline && (
              <div style={{ marginBottom:20, padding:"12px 14px", border:`1px solid ${col.primary}22`, background:col.dim }}>
                <div style={{ ...mono, fontSize:7, color:"#2a2a2a", letterSpacing:3, marginBottom:5 }}>PREDICTED UPLINE</div>
                <div style={{ ...mono, fontSize:11, color:col.primary, letterSpacing:1 }}>{selected.upline}</div>
              </div>
            )}

            {/* Facts list */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ ...mono, fontSize:7, color:"#1a1a1a", letterSpacing:3 }}>DAVID PROFILE</div>
                <div style={{ display:"flex", gap:6 }}>
                  {selected.hasFacebook && <span style={{ ...mono, fontSize:7, color:"#4fc3f7", border:"1px solid #4fc3f718", padding:"1px 6px", letterSpacing:1 }}>FB</span>}
                  {selected.apifyEnriched && <span style={{ ...mono, fontSize:7, color:"#00e676", border:"1px solid #00e67618", padding:"1px 6px", letterSpacing:1 }}>DEEP</span>}
                </div>
              </div>
              {!selected.factsList?.length
                ? <div style={{ ...mono, fontSize:8, color:"#1a1a1a", letterSpacing:1, padding:"12px 0" }}>NO FACTS YET</div>
                : <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                    {selected.factsList.map((f, i) => (
                      <div key={i} style={{
                        padding:"8px 10px",
                        background: f.usability === "HIGH" ? "rgba(0,230,118,0.04)" : "#080808",
                        borderLeft: `2px solid ${f.usability === "HIGH" ? "rgba(0,230,118,0.4)" : "#111"}`,
                      }}>
                        <div style={{ ...mono, fontSize:9, color: f.usability === "HIGH" ? "#ccc" : "#444", lineHeight:1.5 }}>{f.fact}</div>
                        {f.source && <div style={{ ...mono, fontSize:7, color:"#1a1a1a", letterSpacing:1, marginTop:3 }}>{f.source}</div>}
                      </div>
                    ))}
                  </div>
              }
            </div>

            <button onClick={() => {
              const factLines = (selected.factsList || []).map(f => `· ${f.fact}`).join("\n")
              const brief = `${selected.name} · ${selected.city}, ${selected.state}\nTree: ${selected.tree}${selected.confidence ? ` (${selected.confidence}%)` : ""}\n${selected.upline ? `Upline: ${selected.upline}\n` : ""}\n${factLines}`
              navigator.clipboard?.writeText(brief)
            }} style={{ ...mono, fontSize:9, letterSpacing:2, padding:"10px 16px", width:"100%", background:"transparent", border:"1px solid #1a1a1a", color:"#2a2a2a", cursor:"pointer", textAlign:"left" }}>
              COPY OUTREACH BRIEF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
