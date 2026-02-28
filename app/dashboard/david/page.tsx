"use client"

import { useEffect, useState } from "react"

const TREE_COLORS: Record<string, { border: string; label: string; bar: string; dim: string }> = {
  INTEGRITY:  { border: "#f4621f", label: "#f4621f", bar: "#f4621f", dim: "rgba(244,98,31,0.06)"  },
  AMERILIFE:  { border: "#4fc3f7", label: "#4fc3f7", bar: "#4fc3f7", dim: "rgba(79,195,247,0.06)" },
  SMS:        { border: "#ce93d8", label: "#ce93d8", bar: "#ce93d8", dim: "rgba(206,147,216,0.06)"},
  OTHER:      { border: "#888",    label: "#888",    bar: "#888",    dim: "rgba(136,136,136,0.04)" },
  UNKNOWN:    { border: "#2a2a2a", label: "#444",    bar: "#2a2a2a", dim: "transparent"            },
}

const mono = "'DM Mono', 'Courier New', monospace"
const bebas = "'Bebas Neue', sans-serif"

type Fact = { fact: string; usability: string; source: string }
type Node = {
  id: string; name: string; city: string; state: string; tree: string
  confidence: number; upline: string | null; facts: number; highFacts: number
  factsList: Fact[]; hasFacebook: boolean; apifyEnriched: boolean; scannedAt: string
}
type SortKey = "deep" | "facts" | "confidence" | "recent"

function sortNodes(nodes: Node[], key: SortKey): Node[] {
  return [...nodes].sort((a, b) => {
    if (key === "deep") {
      if (a.apifyEnriched !== b.apifyEnriched) return a.apifyEnriched ? -1 : 1
      return b.facts - a.facts
    }
    if (key === "facts")      return b.facts - a.facts
    if (key === "confidence") return b.confidence - a.confidence
    return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
  })
}

function AgentCard({ node, onClick, selected }: { node: Node; onClick: () => void; selected: boolean }) {
  const col = TREE_COLORS[node.tree] || TREE_COLORS.UNKNOWN
  const highFacts = node.factsList.filter(f => f.usability === "HIGH")

  return (
    <div onClick={onClick} style={{
      background: selected ? "#0e0e0e" : "#080808",
      border: `1px solid ${selected ? col.border + "66" : "#111"}`,
      borderLeft: `3px solid ${col.border}`,
      padding: "18px 16px",
      cursor: "pointer",
      transition: "border-color 0.15s, background 0.15s",
      display: "flex", flexDirection: "column", gap: 10,
    }}>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: bebas, fontSize: 17, color: "#d0d0d0", letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.name}
          </div>
          <div style={{ fontFamily: mono, fontSize: 8, color: "#3a3a3a", letterSpacing: 2 }}>
            {node.city}, {node.state}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
          {node.apifyEnriched && (
            <span style={{ fontFamily: mono, fontSize: 7, color: "#00e676", border: "1px solid rgba(0,230,118,0.2)", padding: "1px 5px", letterSpacing: 1 }}>DEEP</span>
          )}
          {node.facts > 0 && (
            <span style={{ fontFamily: mono, fontSize: 7, color: "#444", letterSpacing: 1 }}>
              {node.facts} facts{node.highFacts > 0 ? ` · ${node.highFacts}↑` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Tree + confidence bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: mono, fontSize: 7, color: col.label, letterSpacing: 2 }}>{node.tree}</span>
          {node.confidence > 0 && <span style={{ fontFamily: mono, fontSize: 7, color: "#2a2a2a" }}>{node.confidence}%</span>}
        </div>
        <div style={{ height: 1, background: "#0e0e0e" }}>
          {node.confidence > 0 && <div style={{ height: "100%", width: `${node.confidence}%`, background: col.bar }} />}
        </div>
      </div>

      {/* Upline */}
      {node.upline && (
        <div style={{ fontFamily: mono, fontSize: 8, color: "#4a4a4a", letterSpacing: 0.5, borderLeft: "2px solid #1a1a1a", paddingLeft: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.upline}
        </div>
      )}

      {/* Top high fact preview */}
      {highFacts[0] && (
        <div style={{ fontFamily: mono, fontSize: 9, color: "#888", lineHeight: 1.5, borderLeft: "2px solid rgba(0,230,118,0.2)", paddingLeft: 8 }}>
          {highFacts[0].fact.length > 80 ? highFacts[0].fact.slice(0, 80) + "…" : highFacts[0].fact}
        </div>
      )}

      {/* No facts */}
      {node.facts === 0 && (
        <div style={{ fontFamily: mono, fontSize: 7, color: "#222", letterSpacing: 1 }}>NO FACTS YET</div>
      )}
    </div>
  )
}

function DetailPanel({ node, onClose }: { node: Node; onClose: () => void }) {
  const col = TREE_COLORS[node.tree] || TREE_COLORS.UNKNOWN
  const highFacts = node.factsList.filter(f => f.usability === "HIGH")
  const medFacts  = node.factsList.filter(f => f.usability === "MED")
  const lowFacts  = node.factsList.filter(f => f.usability === "LOW")

  const copyBrief = () => {
    const lines = node.factsList.map(f => `· ${f.fact}`).join("\n")
    const text = `${node.name} · ${node.city}, ${node.state}\nTree: ${node.tree}${node.confidence ? ` (${node.confidence}%)` : ""}${node.upline ? `\nUpline: ${node.upline}` : ""}\n\n${lines}`
    navigator.clipboard?.writeText(text)
  }

  return (
    <div style={{ background: "#060606", borderLeft: "1px solid #111", width: 340, flexShrink: 0, overflowY: "auto", height: "100%" }}>
      <div style={{ padding: "24px 22px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <div style={{ fontFamily: mono, fontSize: 8, color: col.label, letterSpacing: 3, marginBottom: 5 }}>{node.tree}</div>
            <div style={{ fontFamily: bebas, fontSize: 24, color: "#d8d8d8", letterSpacing: 2, lineHeight: 1.1, marginBottom: 4 }}>{node.name}</div>
            <div style={{ fontFamily: mono, fontSize: 8, color: "#3a3a3a", letterSpacing: 2 }}>{node.city}, {node.state}</div>
          </div>
          <button onClick={onClose} style={{ fontFamily: mono, fontSize: 9, color: "#2a2a2a", background: "none", border: "none", cursor: "pointer", flexShrink: 0, paddingTop: 2 }}>
            × CLOSE
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 18 }}>
          {node.apifyEnriched && <span style={{ fontFamily: mono, fontSize: 7, color: "#00e676", border: "1px solid rgba(0,230,118,0.2)", padding: "2px 7px", letterSpacing: 1 }}>DEEP SCAN</span>}
          {node.hasFacebook   && <span style={{ fontFamily: mono, fontSize: 7, color: "#4fc3f7", border: "1px solid rgba(79,195,247,0.2)", padding: "2px 7px", letterSpacing: 1 }}>FACEBOOK</span>}
        </div>

        {/* Confidence */}
        {node.confidence > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontFamily: mono, fontSize: 7, color: "#2a2a2a", letterSpacing: 3 }}>TREE CONFIDENCE</span>
              <span style={{ fontFamily: mono, fontSize: 8, color: col.label }}>{node.confidence}%</span>
            </div>
            <div style={{ height: 2, background: "#0e0e0e" }}>
              <div style={{ height: "100%", width: `${node.confidence}%`, background: col.bar }} />
            </div>
          </div>
        )}

        {/* Upline */}
        {node.upline && (
          <div style={{ marginBottom: 18, padding: "11px 13px", background: col.dim, borderLeft: `3px solid ${col.border}` }}>
            <div style={{ fontFamily: mono, fontSize: 7, color: "#2a2a2a", letterSpacing: 3, marginBottom: 4 }}>PREDICTED UPLINE</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: col.label }}>{node.upline}</div>
          </div>
        )}

        {/* Facts */}
        {node.factsList.length === 0 ? (
          <div style={{ fontFamily: mono, fontSize: 9, color: "#222", letterSpacing: 1, padding: "16px 0" }}>NO FACTS COLLECTED YET</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {highFacts.length > 0 && (
              <div>
                <div style={{ fontFamily: mono, fontSize: 7, color: "#2a2a2a", letterSpacing: 3, marginBottom: 7 }}>HIGH VALUE</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {highFacts.map((f, i) => (
                    <div key={i} style={{ padding: "10px 11px", background: "rgba(0,230,118,0.03)", borderLeft: "2px solid rgba(0,230,118,0.3)" }}>
                      <div style={{ fontFamily: mono, fontSize: 10, color: "#bbb", lineHeight: 1.6 }}>{f.fact}</div>
                      {f.source && <div style={{ fontFamily: mono, fontSize: 7, color: "#222", letterSpacing: 1, marginTop: 3 }}>{f.source}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {medFacts.length > 0 && (
              <div>
                <div style={{ fontFamily: mono, fontSize: 7, color: "#222", letterSpacing: 3, marginBottom: 7 }}>CONTEXT</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {medFacts.map((f, i) => (
                    <div key={i} style={{ padding: "9px 11px", background: "#090909", borderLeft: "2px solid #181818" }}>
                      <div style={{ fontFamily: mono, fontSize: 10, color: "#666", lineHeight: 1.6 }}>{f.fact}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lowFacts.length > 0 && (
              <div>
                <div style={{ fontFamily: mono, fontSize: 7, color: "#1a1a1a", letterSpacing: 3, marginBottom: 7 }}>LOGGED</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {lowFacts.map((f, i) => (
                    <div key={i} style={{ padding: "7px 11px", borderLeft: "2px solid #111" }}>
                      <div style={{ fontFamily: mono, fontSize: 9, color: "#3a3a3a", lineHeight: 1.6 }}>{f.fact}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {node.factsList.length > 0 && (
          <button onClick={copyBrief} style={{ marginTop: 22, width: "100%", fontFamily: mono, fontSize: 9, letterSpacing: 2, padding: "11px 14px", background: "transparent", border: "1px solid #1a1a1a", color: "#555", cursor: "pointer", textAlign: "left" }}>
            COPY OUTREACH BRIEF
          </button>
        )}
      </div>
    </div>
  )
}

export default function DavidPage() {
  const [nodes, setNodes]       = useState<Node[]>([])
  const [loading, setLoading]   = useState(true)
  const [sort, setSort]         = useState<SortKey>("deep")
  const [filter, setFilter]     = useState("ALL")
  const [search, setSearch]     = useState("")
  const [selected, setSelected] = useState<Node | null>(null)

  useEffect(() => {
    fetch("/api/david/network")
      .then(r => r.json())
      .then(d => { setNodes(d.nodes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const trees = ["ALL", ...Array.from(new Set(nodes.map(n => n.tree))).sort()]

  const filtered = sortNodes(
    nodes.filter(n => {
      if (filter !== "ALL" && n.tree !== filter) return false
      if (search && !n.name.toLowerCase().includes(search.toLowerCase()) && !n.city.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }),
    sort
  )

  const totalFacts    = nodes.reduce((s, n) => s + n.facts, 0)
  const enrichedCount = nodes.filter(n => n.apifyEnriched).length
  const highCount     = nodes.reduce((s, n) => s + n.highFacts, 0)

  return (
    <div style={{ display: "flex", height: "calc(100vh - 57px)", background: "#050505", overflow: "hidden" }}>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ padding: "20px 32px 16px", borderBottom: "1px solid #0e0e0e", flexShrink: 0 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: "#2a2a2a", letterSpacing: 4, marginBottom: 6 }}>DAVID · CONTACT INTELLIGENCE</div>
            <div style={{ display: "flex", gap: 24 }}>
              <span style={{ fontFamily: mono, fontSize: 9, color: "#555" }}>{nodes.length} specimens</span>
              <span style={{ fontFamily: mono, fontSize: 9, color: "#555" }}>{totalFacts} facts</span>
              <span style={{ fontFamily: mono, fontSize: 9, color: "#555" }}>{highCount} high value</span>
              {enrichedCount > 0 && <span style={{ fontFamily: mono, fontSize: 9, color: "rgba(0,230,118,0.45)" }}>{enrichedCount} deep enriched</span>}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="search agents..."
              style={{ fontFamily: mono, fontSize: 9, background: "#0a0a0a", border: "1px solid #1a1a1a", color: "#777", padding: "6px 12px", letterSpacing: 1, outline: "none", width: 180 }} />

            <div style={{ display: "flex", gap: 2 }}>
              {trees.map(t => (
                <button key={t} onClick={() => setFilter(t)} style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1, padding: "5px 9px", background: filter === t ? "#141414" : "transparent", border: `1px solid ${filter === t ? "#2a2a2a" : "#111"}`, color: filter === t ? "#777" : "#2a2a2a", cursor: "pointer" }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
              {([ ["deep","DEEP FIRST"], ["facts","MOST FACTS"], ["confidence","CONFIDENCE"], ["recent","RECENT"] ] as [SortKey, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setSort(key)} style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1, padding: "5px 9px", background: sort === key ? "#141414" : "transparent", border: `1px solid ${sort === key ? "#2a2a2a" : "#111"}`, color: sort === key ? "#777" : "#2a2a2a", cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px 40px" }}>
          {loading ? (
            <div style={{ fontFamily: mono, fontSize: 9, color: "#1a1a1a", letterSpacing: 4, padding: "60px 0", textAlign: "center" }}>LOADING...</div>
          ) : filtered.length === 0 ? (
            <div style={{ fontFamily: mono, fontSize: 9, color: "#1a1a1a", letterSpacing: 3, padding: "60px 0", textAlign: "center" }}>
              {nodes.length === 0 ? "NO SPECIMENS YET — RUN ANATHEMA SCANS TO POPULATE" : "NO RESULTS"}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              {filtered.map(n => (
                <AgentCard key={n.id} node={n} selected={selected?.id === n.id} onClick={() => setSelected(selected?.id === n.id ? null : n)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && <DetailPanel node={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
