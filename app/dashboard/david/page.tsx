"use client"

import { useEffect, useState } from "react"

const TREE_COLORS: Record<string, { border: string; label: string; bar: string; bg: string }> = {
  INTEGRITY:  { border: "#f4621f", label: "#f4621f", bar: "#f4621f", bg: "rgba(244,98,31,0.06)"  },
  AMERILIFE:  { border: "#4fc3f7", label: "#2a9fd6", bar: "#4fc3f7", bg: "rgba(79,195,247,0.06)" },
  SMS:        { border: "#9c6faa", label: "#9c6faa", bar: "#ce93d8", bg: "rgba(156,111,170,0.06)"},
  OTHER:      { border: "#7a7570", label: "#7a7570", bar: "#7a7570", bg: "rgba(122,117,112,0.04)" },
  UNKNOWN:    { border: "#2e2b27", label: "#7a7570", bar: "#2e2b27", bg: "transparent"            },
}

const mono = "'DM Mono', 'Courier New', monospace"
const bebas = "'Bebas Neue', sans-serif"
const PAGE_SIZE = 10

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
  const topFact = node.factsList.find(f => f.usability === "HIGH")

  return (
    <div onClick={onClick} style={{
      background: selected ? "#1e1c1a" : "var(--card)",
      border: `1px solid ${selected ? col.border : "var(--border)"}`,
      borderLeft: `3px solid ${col.border}`,
      padding: "16px 18px",
      cursor: "pointer",
      transition: "border-color 0.15s, background 0.15s",
      display: "flex", flexDirection: "column", gap: 10,
    }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: bebas, fontSize: 18, color: "var(--white)", letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.name}
          </div>
          <div style={{ fontFamily: mono, fontSize: 8, color: "var(--muted)", letterSpacing: 2 }}>
            {node.city}, {node.state}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
          {node.apifyEnriched && (
            <span style={{ fontFamily: mono, fontSize: 7, color: "var(--green)", border: "1px solid rgba(0,200,100,0.25)", padding: "1px 5px", letterSpacing: 1 }}>DEEP</span>
          )}
          {node.facts > 0 && (
            <span style={{ fontFamily: mono, fontSize: 7, color: "var(--muted)", letterSpacing: 1 }}>
              {node.facts} facts{node.highFacts > 0 ? ` · ${node.highFacts}↑` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Tree + confidence bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontFamily: mono, fontSize: 8, color: col.label, letterSpacing: 2 }}>{node.tree}</span>
          {node.confidence > 0 && <span style={{ fontFamily: mono, fontSize: 8, color: "var(--muted)" }}>{node.confidence}%</span>}
        </div>
        <div style={{ height: 2, background: "var(--border)" }}>
          {node.confidence > 0 && <div style={{ height: "100%", width: `${node.confidence}%`, background: col.bar }} />}
        </div>
      </div>

      {/* Upline */}
      {node.upline && (
        <div style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", letterSpacing: 0.5, borderLeft: "2px solid var(--border)", paddingLeft: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.upline}
        </div>
      )}

      {/* Top fact preview */}
      {topFact ? (
        <div style={{ fontFamily: mono, fontSize: 9, color: "var(--white)", lineHeight: 1.5, borderLeft: "2px solid rgba(0,200,100,0.3)", paddingLeft: 8, opacity: 0.8 }}>
          {topFact.fact.length > 90 ? topFact.fact.slice(0, 90) + "…" : topFact.fact}
        </div>
      ) : node.facts === 0 ? (
        <div style={{ fontFamily: mono, fontSize: 7, color: "var(--muted)", letterSpacing: 1, opacity: 0.5 }}>NO FACTS YET</div>
      ) : null}
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
    <div style={{ background: "var(--card)", borderLeft: "1px solid var(--border)", width: 360, flexShrink: 0, overflowY: "auto", height: "100%" }}>
      <div style={{ padding: "24px 24px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <div style={{ fontFamily: mono, fontSize: 8, color: col.label, letterSpacing: 3, marginBottom: 6, textTransform: "uppercase" }}>{node.tree}</div>
            <div style={{ fontFamily: bebas, fontSize: 26, color: "var(--white)", letterSpacing: 2, lineHeight: 1.1, marginBottom: 5 }}>{node.name}</div>
            <div style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", letterSpacing: 2 }}>{node.city}, {node.state}</div>
          </div>
          <button onClick={onClose} style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", flexShrink: 0, paddingTop: 2 }}>
            × CLOSE
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {node.apifyEnriched && <span style={{ fontFamily: mono, fontSize: 7, color: "var(--green)", border: "1px solid rgba(0,200,100,0.25)", padding: "2px 8px", letterSpacing: 1 }}>DEEP SCAN</span>}
          {node.hasFacebook   && <span style={{ fontFamily: mono, fontSize: 7, color: "var(--muted)", border: "1px solid var(--border)", padding: "2px 8px", letterSpacing: 1 }}>FACEBOOK</span>}
        </div>

        {/* Confidence bar */}
        {node.confidence > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: mono, fontSize: 7, color: "var(--muted)", letterSpacing: 3 }}>TREE CONFIDENCE</span>
              <span style={{ fontFamily: mono, fontSize: 8, color: col.label }}>{node.confidence}%</span>
            </div>
            <div style={{ height: 2, background: "var(--border)" }}>
              <div style={{ height: "100%", width: `${node.confidence}%`, background: col.bar }} />
            </div>
          </div>
        )}

        {/* Upline */}
        {node.upline && (
          <div style={{ marginBottom: 20, padding: "12px 14px", background: col.bg, borderLeft: `3px solid ${col.border}` }}>
            <div style={{ fontFamily: mono, fontSize: 7, color: "var(--muted)", letterSpacing: 3, marginBottom: 5 }}>PREDICTED UPLINE</div>
            <div style={{ fontFamily: mono, fontSize: 12, color: col.label }}>{node.upline}</div>
          </div>
        )}

        {/* Facts */}
        {node.factsList.length === 0 ? (
          <div style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", letterSpacing: 1, padding: "16px 0", opacity: 0.5 }}>NO FACTS COLLECTED YET</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {highFacts.length > 0 && (
              <div>
                <div style={{ fontFamily: mono, fontSize: 7, color: "var(--muted)", letterSpacing: 3, marginBottom: 8 }}>HIGH VALUE</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {highFacts.map((f, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "rgba(0,200,100,0.05)", borderLeft: "2px solid rgba(0,200,100,0.35)" }}>
                      <div style={{ fontFamily: mono, fontSize: 10, color: "var(--white)", lineHeight: 1.6 }}>{f.fact}</div>
                      {f.source && <div style={{ fontFamily: mono, fontSize: 7, color: "var(--muted)", letterSpacing: 1, marginTop: 3, opacity: 0.5 }}>{f.source}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {medFacts.length > 0 && (
              <div>
                <div style={{ fontFamily: mono, fontSize: 7, color: "var(--muted)", letterSpacing: 3, marginBottom: 8, opacity: 0.7 }}>CONTEXT</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {medFacts.map((f, i) => (
                    <div key={i} style={{ padding: "9px 12px", background: "var(--black)", borderLeft: "2px solid var(--border)" }}>
                      <div style={{ fontFamily: mono, fontSize: 10, color: "var(--white)", lineHeight: 1.6, opacity: 0.7 }}>{f.fact}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lowFacts.length > 0 && (
              <div>
                <div style={{ fontFamily: mono, fontSize: 7, color: "var(--muted)", letterSpacing: 3, marginBottom: 8, opacity: 0.4 }}>LOGGED</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {lowFacts.map((f, i) => (
                    <div key={i} style={{ padding: "8px 12px", borderLeft: "2px solid var(--border)" }}>
                      <div style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", lineHeight: 1.6, opacity: 0.6 }}>{f.fact}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {node.factsList.length > 0 && (
          <button onClick={copyBrief} style={{ marginTop: 24, width: "100%", fontFamily: mono, fontSize: 9, letterSpacing: 2, padding: "12px 16px", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", textAlign: "left" }}>
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
  const [page, setPage]         = useState(1)

  useEffect(() => {
    fetch("/api/david/network")
      .then(r => r.json())
      .then(d => { setNodes(d.nodes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [sort, filter, search])

  const trees = ["ALL", ...Array.from(new Set(nodes.map(n => n.tree))).sort()]

  const filtered = sortNodes(
    nodes.filter(n => {
      if (filter !== "ALL" && n.tree !== filter) return false
      if (search && !n.name.toLowerCase().includes(search.toLowerCase()) && !n.city.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }),
    sort
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalFacts    = nodes.reduce((s, n) => s + n.facts, 0)
  const enrichedCount = nodes.filter(n => n.apifyEnriched).length
  const highCount     = nodes.reduce((s, n) => s + n.highFacts, 0)

  return (
    <div style={{ display: "flex", height: "calc(100vh - 57px)", background: "var(--black)", overflow: "hidden" }}>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ padding: "20px 32px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", letterSpacing: 4, marginBottom: 6, textTransform: "uppercase" }}>David · Contact Intelligence</div>
            <div style={{ display: "flex", gap: 24 }}>
              <span style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)" }}>{nodes.length} specimens</span>
              <span style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)" }}>{totalFacts} facts</span>
              <span style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)" }}>{highCount} high value</span>
              {enrichedCount > 0 && <span style={{ fontFamily: mono, fontSize: 9, color: "var(--green)", opacity: 0.7 }}>{enrichedCount} deep enriched</span>}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="search agents..."
              style={{ fontFamily: mono, fontSize: 9, background: "var(--card)", border: "1px solid var(--border)", color: "var(--white)", padding: "6px 12px", letterSpacing: 1, outline: "none", width: 200 }} />

            <div style={{ display: "flex", gap: 2 }}>
              {trees.map(t => (
                <button key={t} onClick={() => setFilter(t)} style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1, padding: "5px 10px", background: filter === t ? "var(--card)" : "transparent", border: `1px solid ${filter === t ? "var(--border-light)" : "var(--border)"}`, color: filter === t ? "var(--white)" : "var(--muted)", cursor: "pointer" }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
              {([ ["deep","DEEP FIRST"], ["facts","MOST FACTS"], ["confidence","CONFIDENCE"], ["recent","RECENT"] ] as [SortKey, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setSort(key)} style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1, padding: "5px 10px", background: sort === key ? "var(--card)" : "transparent", border: `1px solid ${sort === key ? "var(--border-light)" : "var(--border)"}`, color: sort === key ? "var(--white)" : "var(--muted)", cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid + pagination */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 16px" }}>
          {loading ? (
            <div style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", letterSpacing: 4, padding: "60px 0", textAlign: "center" }}>LOADING...</div>
          ) : filtered.length === 0 ? (
            <div style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", letterSpacing: 3, padding: "60px 0", textAlign: "center", opacity: 0.4 }}>
              {nodes.length === 0 ? "NO SPECIMENS YET — RUN ANATHEMA SCANS TO POPULATE" : "NO RESULTS"}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, marginBottom: 20 }}>
                {paginated.map(n => (
                  <AgentCard key={n.id} node={n} selected={selected?.id === n.id} onClick={() => setSelected(selected?.id === n.id ? null : n)} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 24 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: "6px 14px", background: "transparent", border: "1px solid var(--border)", color: page === 1 ? "var(--border)" : "var(--muted)", cursor: page === 1 ? "default" : "pointer" }}>
                    ← PREV
                  </button>
                  <div style={{ fontFamily: mono, fontSize: 8, color: "var(--muted)", letterSpacing: 2 }}>
                    {page} / {totalPages} · {filtered.length} agents
                  </div>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, padding: "6px 14px", background: "transparent", border: "1px solid var(--border)", color: page === totalPages ? "var(--border)" : "var(--muted)", cursor: page === totalPages ? "default" : "pointer" }}>
                    NEXT →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && <DetailPanel node={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
