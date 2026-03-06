"use client"

import { useEffect, useState } from "react"

// ── Tree colors — used only as secondary context, not the main event ──────────
const TREE_COLORS: Record<string, { border: string; label: string; bar: string; bg: string }> = {
  INTEGRITY: { border: "#f4621f", label: "#f4621f", bar: "#f4621f", bg: "rgba(244,98,31,0.06)"   },
  AMERILIFE: { border: "#4fc3f7", label: "#2a9fd6", bar: "#4fc3f7", bg: "rgba(79,195,247,0.06)"  },
  SMS:       { border: "#9c6faa", label: "#9c6faa", bar: "#ce93d8", bg: "rgba(156,111,170,0.06)" },
  OTHER:     { border: "#7a7570", label: "#7a7570", bar: "#7a7570", bg: "rgba(122,117,112,0.04)" },
  UNKNOWN:   { border: "#2e2b27", label: "#7a7570", bar: "#2e2b27", bg: "transparent"             },
}

const PAGE_SIZE = 12

type Fact = { fact: string; usability: string; source: string }
type Node = {
  id: string; name: string; city: string; state: string; tree: string
  confidence: number; upline: string | null; facts: number; highFacts: number
  factsList: Fact[]; hasFacebook: boolean; apifyEnriched: boolean; scannedAt: string
}
type SortKey = "intel" | "facts" | "recent"

function sortNodes(nodes: Node[], key: SortKey): Node[] {
  return [...nodes].sort((a, b) => {
    if (key === "intel") {
      if (a.apifyEnriched !== b.apifyEnriched) return a.apifyEnriched ? -1 : 1
      return b.highFacts - a.highFacts
    }
    if (key === "facts") return b.facts - a.facts
    return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
  })
}

// ── Agent card ────────────────────────────────────────────────────────────────

function AgentCard({ node, onClick, selected }: { node: Node; onClick: () => void; selected: boolean }) {
  const col = TREE_COLORS[node.tree] || TREE_COLORS.UNKNOWN
  const topFact = node.factsList.find(f => f.usability === "HIGH")
  const hasContact = false // placeholder — contact enrichment coming

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? "var(--bg-hover)" : "var(--bg-card)",
        border: `1px solid ${selected ? "var(--border-strong)" : "var(--border)"}`,
        borderLeft: `2px solid ${selected ? "var(--orange)" : col.border}`,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        display: "flex", flexDirection: "column", gap: 9,
        borderRadius: "var(--radius)",
      }}
    >
      {/* Name + badges */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 17,
            color: "var(--text-1)", letterSpacing: 1.5, lineHeight: 1.1,
            marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {node.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'DM Sans', sans-serif" }}>
            {node.city}, {node.state}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {node.apifyEnriched && <span className="dash-badge dash-badge-green">DEEP</span>}
          {node.hasFacebook   && <span className="dash-badge">FB</span>}
        </div>
      </div>

      {/* Top HIGH fact — the point of this card */}
      {topFact ? (
        <div style={{
          fontSize: 12, color: "var(--text-1)", lineHeight: 1.6,
          fontFamily: "'DM Sans', sans-serif",
          borderLeft: "2px solid var(--sig-green-border)",
          background: "var(--sig-green-dim)",
          padding: "8px 10px", borderRadius: "0 var(--radius) var(--radius) 0",
        }}>
          {topFact.fact.length > 100 ? topFact.fact.slice(0, 100) + "…" : topFact.fact}
        </div>
      ) : (
        <div style={{
          fontSize: 11, color: "var(--text-4)", fontFamily: "'DM Sans', sans-serif",
          padding: "6px 0",
        }}>
          No personal intel yet
        </div>
      )}

      {/* Footer — fact count + tree tag + contact status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {node.facts > 0 && (
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'DM Sans', sans-serif" }}>
              {node.facts} facts{node.highFacts > 0 ? ` · ${node.highFacts} actionable` : ""}
            </span>
          )}
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            color: col.label, letterSpacing: 1, opacity: 0.7,
          }}>
            {node.tree}
          </span>
        </div>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1,
          color: hasContact ? "var(--sig-green)" : "var(--text-4)",
        }}>
          {hasContact ? "✓ CONTACT" : "NO CONTACT"}
        </span>
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ node, onClose }: { node: Node; onClose: () => void }) {
  const col = TREE_COLORS[node.tree] || TREE_COLORS.UNKNOWN
  const highFacts = node.factsList.filter(f => f.usability === "HIGH")
  const medFacts  = node.factsList.filter(f => f.usability === "MED")
  const lowFacts  = node.factsList.filter(f => f.usability === "LOW")
  const [copied, setCopied] = useState(false)

  const copyBrief = () => {
    const lines = node.factsList
      .filter(f => f.usability === "HIGH" || f.usability === "MED")
      .map(f => `· ${f.fact}`)
      .join("\n")
    const text = `${node.name} — ${node.city}, ${node.state}\n\nPersonal Intel:\n${lines}\n\nTree: ${node.tree}${node.confidence ? ` (${node.confidence}% confidence)` : ""}${node.upline ? `\nUpline: ${node.upline}` : ""}`
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: "var(--bg-card)", borderLeft: "1px solid var(--border)",
      width: 380, flexShrink: 0, overflowY: "auto", height: "100%",
    }}>
      <div style={{ padding: "24px 24px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <div className="page-eyebrow" style={{ marginBottom: 6 }}>Personal Intelligence</div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 28,
              color: "var(--text-1)", letterSpacing: 2, lineHeight: 1.1, marginBottom: 4,
            }}>
              {node.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "'DM Sans', sans-serif" }}>
              {node.city}, {node.state}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: 11, padding: "5px 10px", marginTop: 2 }}>
            Close
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20, marginTop: 14 }}>
          {node.apifyEnriched && <span className="dash-badge dash-badge-green">DEEP SCAN</span>}
          {node.hasFacebook   && <span className="dash-badge">FACEBOOK</span>}
          <span className="dash-badge" style={{ color: col.label, borderColor: col.border }}>{node.tree}</span>
        </div>

        {/* Contact status — roadmap placeholder */}
        <div style={{
          padding: "12px 14px", marginBottom: 20,
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>
              Contact Info
            </div>
            <div style={{ fontSize: 12, color: "var(--text-4)", fontFamily: "'DM Sans', sans-serif" }}>
              Not yet attached — coming in next release
            </div>
          </div>
          <span className="dash-badge">PENDING</span>
        </div>

        {/* Personal Intel — main section */}
        {node.factsList.length === 0 ? (
          <div style={{
            padding: "24px 0", textAlign: "center",
            fontSize: 12, color: "var(--text-4)",
            fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7,
          }}>
            No personal intel collected yet.<br />
            Run an Anathema scan to populate.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {highFacts.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Actionable Intel
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {highFacts.map((f, i) => (
                    <div key={i} style={{
                      padding: "10px 12px", background: "var(--sig-green-dim)",
                      borderLeft: "2px solid var(--sig-green-border)",
                      borderRadius: "0 var(--radius) var(--radius) 0",
                    }}>
                      <div style={{ fontSize: 12, color: "var(--text-1)", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                        {f.fact}
                      </div>
                      {f.source && (
                        <div style={{ fontSize: 10, color: "var(--text-4)", marginTop: 4, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}>
                          {f.source}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {medFacts.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Supporting Context
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {medFacts.map((f, i) => (
                    <div key={i} style={{
                      padding: "9px 12px", background: "var(--bg)",
                      borderLeft: "2px solid var(--border)",
                      borderRadius: "0 var(--radius) var(--radius) 0",
                    }}>
                      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                        {f.fact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lowFacts.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Logged
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {lowFacts.map((f, i) => (
                    <div key={i} style={{ padding: "7px 12px", borderLeft: "2px solid var(--border)" }}>
                      <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                        {f.fact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tree context — secondary, below facts */}
        {(node.confidence > 0 || node.upline) && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
              Tree Context
            </div>

            {node.confidence > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "'DM Sans', sans-serif" }}>{node.tree} affiliation</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: col.label }}>{node.confidence}%</span>
                </div>
                <div style={{ height: 3, background: "var(--border)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${node.confidence}%`, background: col.bar, borderRadius: 2 }} />
                </div>
              </div>
            )}

            {node.upline && (
              <div style={{
                padding: "10px 12px", background: col.bg,
                borderLeft: `2px solid ${col.border}`,
                borderRadius: "0 var(--radius) var(--radius) 0",
              }}>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>Predicted upline</div>
                <div style={{ fontSize: 12, color: col.label, fontFamily: "'DM Mono', monospace" }}>{node.upline}</div>
              </div>
            )}
          </div>
        )}

        {/* Primary CTA */}
        {node.factsList.length > 0 && (
          <button
            onClick={copyBrief}
            style={{
              marginTop: 24, width: "100%", padding: "12px 16px",
              background: copied ? "var(--sig-green-dim)" : "var(--orange)",
              border: copied ? "1px solid var(--sig-green-border)" : "none",
              borderRadius: "var(--radius)",
              color: copied ? "var(--sig-green)" : "white",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18, letterSpacing: 2,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {copied ? "✓ COPIED TO CLIPBOARD" : "COPY OUTREACH BRIEF"}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DavidPage() {
  const [nodes, setNodes]       = useState<Node[]>([])
  const [loading, setLoading]   = useState(true)
  const [sort, setSort]         = useState<SortKey>("intel")
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

  const totalPages    = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalFacts    = nodes.reduce((s, n) => s + n.facts, 0)
  const highCount     = nodes.reduce((s, n) => s + n.highFacts, 0)
  const enrichedCount = nodes.filter(n => n.apifyEnriched).length

  return (
    <div style={{ display: "flex", height: "calc(100vh - 57px)", background: "var(--bg)", overflow: "hidden" }}>
      <style>{`
        @keyframes betaSweep { 0% { transform: translateX(-100%); } 60%,100% { transform: translateX(100%); } }
      `}</style>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{ padding: "20px 32px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <div className="page-eyebrow">Personal Intelligence</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 6 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 2, color: "var(--text-1)", lineHeight: 0.9 }}>
                DAVID<span style={{ color: "var(--sig-purple, #7c5cbf)" }}>.</span>
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, letterSpacing: 3,
                color: "var(--sig-purple, #7c5cbf)",
                border: "1px solid rgba(124,92,191,0.45)",
                background: "rgba(124,92,191,0.07)",
                padding: "5px 10px", marginBottom: 6,
                position: "relative", overflow: "hidden", whiteSpace: "nowrap",
              }}>
                <span style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(124,92,191,0.14), transparent)",
                  animation: "betaSweep 3s ease-in-out infinite",
                }} />
                BETA
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "'DM Sans', sans-serif", maxWidth: 560, lineHeight: 1.6 }}>
              Personal intelligence built from Anathema scans. Each record is a dossier — facts you use to personalize outreach. Contact info and agentic automation coming soon.
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 20, marginBottom: 14, alignItems: "center" }}>
            {[
              { val: nodes.length, label: "agents", color: "var(--text-1)" },
              { val: totalFacts,   label: "facts collected", color: "var(--text-1)" },
              { val: highCount,    label: "actionable", color: "var(--sig-green)" },
              ...(enrichedCount > 0 ? [{ val: enrichedCount, label: "deep enriched", color: "var(--sig-green)" }] : []),
            ].map((s, i, arr) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: s.color, lineHeight: 1 }}>{s.val}</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</span>
                </div>
                {i < arr.length - 1 && <div style={{ width: 1, height: 16, background: "var(--border)" }} />}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or city..."
              className="dash-input"
              style={{ width: 220 }}
            />
            <div className="dash-filter-bar">
              {trees.map(t => (
                <button key={t} onClick={() => setFilter(t)} className={`dash-filter-btn${filter === t ? " active" : ""}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="dash-filter-bar" style={{ marginLeft: "auto" }}>
              {([ ["intel","Best Intel"], ["facts","Most Facts"], ["recent","Recent"] ] as [SortKey, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setSort(key)} className={`dash-filter-btn${sort === key ? " active-orange" : ""}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px 16px" }}>
          {loading ? (
            <div className="dash-empty-state">Loading intelligence...</div>
          ) : filtered.length === 0 ? (
            <div className="dash-empty-state">
              {nodes.length === 0 ? "No records yet — run Anathema scans to start building dossiers" : "No agents match your search"}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 20 }}>
                {paginated.map(n => (
                  <AgentCard key={n.id} node={n} selected={selected?.id === n.id} onClick={() => setSelected(selected?.id === n.id ? null : n)} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="dash-pagination">
                  <button className="dash-pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                  <span className="dash-pagination-count">{page} / {totalPages} · {filtered.length} agents</span>
                  <button className="dash-pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && <DetailPanel node={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
