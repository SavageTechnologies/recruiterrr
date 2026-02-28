"use client"

import { useState } from "react"

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

export default function DavidBrain({
  agentName = "Agent",
  recruitFlag = "WARM",
  recruitScore = 0,
  predictedTree = "UNKNOWN",
  treeConfidence = 0,
  davidFacts = [],
  isLoading = false,
}) {
  const [expanded, setExpanded] = useState(null)

  const mono = { fontFamily: "'DM Mono', 'Courier New', monospace" }
  const treeColor = TREE_COLORS[predictedTree?.toUpperCase()] || TREE_COLORS.UNKNOWN
  const flagColor = recruitFlag === "HOT" ? "#00e676" : recruitFlag === "WARM" ? "#ffb300" : "#555555"
  const factCount = davidFacts?.length || 0
  const highFacts = davidFacts?.filter(f => f.usability === "HIGH") || []
  const medFacts  = davidFacts?.filter(f => f.usability === "MED")  || []
  const lowFacts  = davidFacts?.filter(f => f.usability === "LOW")  || []
  const sorted = [...highFacts, ...medFacts, ...lowFacts]

  return (
    <div style={{ background: "#040404", border: "1px solid #141414", width: "100%" }}>
      <style>{`
        @keyframes factSlide { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dp { 0%,100%{opacity:.1;transform:scale(.8)} 50%{opacity:1;transform:scale(1.4)} }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        padding: "12px 18px",
        borderBottom: "1px solid #0e0e0e",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: treeColor, boxShadow: `0 0 5px ${treeColor}` }} />
          <span style={{ ...mono, fontSize: 8, color: "#2a2a2a", letterSpacing: 3, textTransform: "uppercase" }}>◈ DAVID PROFILE</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {factCount > 0 && (
            <span style={{ ...mono, fontSize: 8, color: "#2a2a2a", letterSpacing: 2 }}>
              {factCount} FACTS
              {highFacts.length > 0 && (
                <span style={{ color: "#00e67677" }}> · {highFacts.length} HIGH</span>
              )}
            </span>
          )}
          <span style={{ ...mono, fontSize: 8, color: flagColor, letterSpacing: 2, borderLeft: `1px solid ${flagColor}33`, paddingLeft: 8 }}>
            {recruitFlag}
          </span>
        </div>
      </div>

      {/* ── LOADING ── */}
      {isLoading && (
        <div style={{ padding: "28px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#f4621f", animation: `dp 1.2s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </div>
          <span style={{ ...mono, fontSize: 8, color: "#333", letterSpacing: 2 }}>EXTRACTING DAVID FACTS</span>
        </div>
      )}

      {/* ── EMPTY ── */}
      {!isLoading && factCount === 0 && (
        <div style={{ padding: "28px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "#141414", letterSpacing: 4 }}>DAVID</div>
          <span style={{ ...mono, fontSize: 8, color: "#1a1a1a", letterSpacing: 2 }}>RUN ANATHEMA TO SEED THIS PROFILE</span>
        </div>
      )}

      {/* ── FACT LIST ── */}
      {!isLoading && sorted.map((fact, i) => {
        const col = SOURCE_COLORS[fact.source] || "#888888"
        const usabilityColor = fact.usability === "HIGH" ? "#00e676" : fact.usability === "MED" ? "#ffb300" : "#444444"
        const isOpen = expanded === i

        return (
          <div
            key={i}
            style={{
              borderBottom: "1px solid #0a0a0a",
              animation: `factSlide 0.25s ease ${i * 0.04}s both`,
            }}
          >
            {/* Row */}
            <div
              onClick={() => setExpanded(isOpen ? null : i)}
              style={{
                padding: "10px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
                background: isOpen ? "#080808" : "transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "#060606" }}
              onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent" }}
            >
              {/* Source badge */}
              <div style={{
                flexShrink: 0,
                marginTop: 1,
                ...mono, fontSize: 7,
                color: col,
                border: `1px solid ${col}33`,
                padding: "2px 5px",
                letterSpacing: 1,
                minWidth: 22,
                textAlign: "center",
              }}>
                {SOURCE_ICONS[fact.source] || "??"}
              </div>

              {/* Fact text */}
              <div style={{ flex: 1, fontSize: 12, color: isOpen ? "#ddd" : "#777", lineHeight: 1.55, transition: "color 0.1s" }}>
                {fact.fact}
              </div>

              {/* Signal dot + chevron */}
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: usabilityColor, opacity: fact.usability === "LOW" ? 0.3 : 0.7 }} />
                <span style={{ ...mono, fontSize: 8, color: "#222", transition: "transform 0.15s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
              </div>
            </div>

            {/* Expanded raw quote */}
            {isOpen && fact.raw_quote && (
              <div style={{
                padding: "0 18px 12px 50px",
                animation: "factSlide 0.15s ease both",
              }}>
                <div style={{
                  ...mono, fontSize: 9,
                  color: "#383838",
                  lineHeight: 1.6,
                  borderLeft: `1px solid ${col}33`,
                  paddingLeft: 10,
                  fontStyle: "italic",
                }}>
                  "{fact.raw_quote.length > 200 ? fact.raw_quote.slice(0, 200) + "…" : fact.raw_quote}"
                </div>
                <div style={{ ...mono, fontSize: 7, color: "#1e1e1e", marginTop: 6, letterSpacing: 1 }}>
                  SOURCE: {fact.source} · {fact.usability} SIGNAL
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* ── FOOTER ── */}
      {factCount > 0 && (
        <div style={{
          padding: "7px 18px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ ...mono, fontSize: 7, color: "#181818", letterSpacing: 1 }}>↳ ANATHEMA EXHAUST → DAVID STRUCTURE</div>
          {predictedTree && predictedTree.toUpperCase() !== "UNKNOWN" && (
            <div style={{ ...mono, fontSize: 7, color: treeColor + "55", letterSpacing: 2 }}>
              {predictedTree.toUpperCase()} · {treeConfidence}%
            </div>
          )}
        </div>
      )}
    </div>
  )
}
