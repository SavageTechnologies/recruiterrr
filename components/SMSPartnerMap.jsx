'use client'

import { useState } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

// ─── SENIOR MARKET SALES AFFILIATES ──────────────────────────────────────────
// Source: seniormarketsales.com — admin-managed only
const PARTNERS = [
  // ── Medicare / Senior Health ──
  { id: 1,  name: "Senior Market Sales",           city: "Omaha",           state: "NE", coords: [-95.93, 41.26], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 2,  name: "Integrity IMO",                 city: "Omaha",           state: "NE", coords: [-95.95, 41.28], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 3,  name: "American Senior Benefits",      city: "Omaha",           state: "NE", coords: [-95.91, 41.24], website: "americanseniorbenefits.com",     segment: "Medicare" },
  { id: 4,  name: "SMS of Iowa",                   city: "Des Moines",      state: "IA", coords: [-93.62, 41.60], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 5,  name: "SMS of Missouri",               city: "Kansas City",     state: "MO", coords: [-94.58, 39.10], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 6,  name: "SMS of Illinois",               city: "Chicago",         state: "IL", coords: [-87.63, 41.88], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 7,  name: "SMS of Texas",                  city: "Dallas",          state: "TX", coords: [-96.80, 32.78], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 8,  name: "SMS of Florida",                city: "Tampa",           state: "FL", coords: [-82.46, 27.95], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 9,  name: "SMS of Ohio",                   city: "Columbus",        state: "OH", coords: [-82.99, 39.96], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 10, name: "SMS of Pennsylvania",           city: "Philadelphia",    state: "PA", coords: [-75.16, 39.95], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 11, name: "SMS of Michigan",               city: "Detroit",         state: "MI", coords: [-83.05, 42.33], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 12, name: "SMS of Georgia",                city: "Atlanta",         state: "GA", coords: [-84.39, 33.75], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 13, name: "SMS of North Carolina",         city: "Charlotte",       state: "NC", coords: [-80.84, 35.23], website: "seniormarketsales.com",          segment: "Medicare" },
  { id: 14, name: "SMS of Arizona",                city: "Phoenix",         state: "AZ", coords: [-112.07, 33.45], website: "seniormarketsales.com",         segment: "Medicare" },
  { id: 15, name: "SMS of Colorado",               city: "Denver",          state: "CO", coords: [-104.99, 39.74], website: "seniormarketsales.com",         segment: "Medicare" },

  // ── Life / Final Expense ──
  { id: 16, name: "SMS Life Division",             city: "Omaha",           state: "NE", coords: [-95.97, 41.27], website: "seniormarketsales.com",          segment: "Life" },
  { id: 17, name: "Mutual of Omaha Brokerage",     city: "Omaha",           state: "NE", coords: [-96.00, 41.25], website: "mutualofomaha.com",              segment: "Life" },
  { id: 18, name: "Medico Insurance",              city: "Omaha",           state: "NE", coords: [-95.89, 41.23], website: "medicoinsurance.com",            segment: "Life" },
  { id: 19, name: "GPM Life",                      city: "Chicago",         state: "IL", coords: [-87.65, 41.86], website: "gpmlife.com",                    segment: "Life" },
  { id: 20, name: "SMS Final Expense Division",    city: "Omaha",           state: "NE", coords: [-95.85, 41.22], website: "seniormarketsales.com",          segment: "Life" },
  { id: 21, name: "National Western Life",         city: "Denver",          state: "CO", coords: [-105.01, 39.76], website: "nationalwesternlife.com",       segment: "Life" },
  { id: 22, name: "Guarantee Trust Life",          city: "Glenview",        state: "IL", coords: [-87.83, 42.07], website: "gtlic.com",                      segment: "Life" },
  { id: 23, name: "American Home Life",            city: "Topeka",          state: "KS", coords: [-95.69, 39.05], website: "americanhomelife.com",           segment: "Life" },
  { id: 24, name: "Columbian Mutual Life",         city: "Binghamton",      state: "NY", coords: [-75.91, 42.10], website: "columbianmutual.com",            segment: "Life" },

  // ── Annuity / Wealth ──
  { id: 25, name: "SMS Annuity Division",          city: "Omaha",           state: "NE", coords: [-95.83, 41.21], website: "seniormarketsales.com",          segment: "Annuity" },
  { id: 26, name: "Midland National",              city: "Sioux Falls",     state: "SD", coords: [-96.73, 43.55], website: "midlandnational.com",            segment: "Annuity" },
  { id: 27, name: "North American Company",        city: "Sioux Falls",     state: "SD", coords: [-96.70, 43.53], website: "northamericancompany.com",       segment: "Annuity" },
  { id: 28, name: "American Equity",               city: "West Des Moines", state: "IA", coords: [-93.71, 41.58], website: "american-equity.com",            segment: "Annuity" },
  { id: 29, name: "Athene Annuity",                city: "West Des Moines", state: "IA", coords: [-93.73, 41.56], website: "athene.com",                     segment: "Annuity" },
  { id: 30, name: "Pacific Life",                  city: "Newport Beach",   state: "CA", coords: [-117.87, 33.62], website: "pacificlife.com",               segment: "Annuity" },
  { id: 31, name: "Nationwide Annuity",            city: "Columbus",        state: "OH", coords: [-83.01, 39.98], website: "nationwide.com",                 segment: "Annuity" },
  { id: 32, name: "SMS Wealth Brokerage",          city: "Omaha",           state: "NE", coords: [-95.81, 41.20], website: "seniormarketsales.com",          segment: "Annuity" },
]

const SEGMENT_COLORS = {
  Medicare: "#ff5500",
  Life:     "#00e676",
  Annuity:  "#00b4d8",
}

const FIPS = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL',
  '13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME',
  '24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH',
  '34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI',
  '45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY'
}

const C = {
  black: "#1a1814", dark: "#1f1d19", card: "#252320",
  border: "#2e2b27", borderLight: "#3a3732",
  orange: "#ff5500", white: "#f0ede8", muted: "#7a7570",
}

const STATE_COUNTS = PARTNERS.reduce((acc, p) => {
  acc[p.state] = (acc[p.state] || 0) + 1
  return acc
}, {})

function getStateColor(abbr) {
  const n = STATE_COUNTS[abbr] || 0
  if (n === 0) return "#1e1b18"
  if (n >= 6)  return "rgba(255,85,0,0.35)"
  if (n >= 3)  return "rgba(255,85,0,0.22)"
  if (n >= 2)  return "rgba(255,85,0,0.14)"
  return "rgba(255,85,0,0.08)"
}

export default function SMSPartnerMap() {
  const [active, setActive]   = useState(null)
  const [filter, setFilter]   = useState("")
  const [segment, setSegment] = useState("All")
  const [tooltip, setTooltip] = useState(null)
  const [zoom, setZoom]       = useState(1)
  const [center, setCenter]   = useState([-96, 38])

  const segments = ["All", "Medicare", "Life", "Annuity"]

  const filtered = PARTNERS.filter(p => {
    const matchSeg = segment === "All" || p.segment === segment
    const matchStr = !filter.trim() ||
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.city.toLowerCase().includes(filter.toLowerCase()) ||
      p.state.toLowerCase().includes(filter.toLowerCase())
    return matchSeg && matchStr
  })

  const topStates = Object.entries(STATE_COUNTS).sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <div style={{ background: C.black, minHeight: "100vh", color: C.white, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: ${C.black}; }
        ::-webkit-scrollbar-thumb { background: ${C.borderLight}; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .dot { cursor: pointer; transition: r 0.1s; }
        .dot:hover { filter: brightness(1.5); }
        .card-in { animation: fadeIn 0.15s ease forwards; }
        .seg-btn { cursor: pointer; transition: all 0.12s; border: none; }
        .seg-btn:hover { opacity: 1 !important; }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.orange, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
            LIVE NETWORK · ADMIN MANAGED
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 3, lineHeight: 1 }}>
            SENIOR MARKET SALES<span style={{ color: C.orange }}>.</span> NETWORK
          </h1>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { v: PARTNERS.length,                                   l: "Total Partners" },
            { v: PARTNERS.filter(p => p.segment === "Medicare").length, l: "Medicare" },
            { v: PARTNERS.filter(p => p.segment === "Life").length,     l: "Life" },
            { v: PARTNERS.filter(p => p.segment === "Annuity").length,  l: "Annuity" },
            { v: Object.keys(STATE_COUNTS).length,                  l: "States" },
          ].map(s => (
            <div key={s.l} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.orange, letterSpacing: 1 }}>{s.v}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 130px)" }}>

        {/* MAP */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <ComposableMap projection="geoAlbersUsa" style={{ width: "100%", height: "100%" }}>
            <ZoomableGroup center={center} zoom={zoom} onMoveEnd={({ zoom: z, coordinates }) => { setZoom(z); setCenter(coordinates) }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const fips = geo.id?.toString().padStart(2, "0")
                    const abbr = FIPS[fips] || ""
                    const n = STATE_COUNTS[abbr] || 0
                    return (
                      <Geography key={geo.rsmKey} geography={geo}
                        fill={getStateColor(abbr)}
                        stroke={n > 0 ? "rgba(255,85,0,0.3)" : C.border}
                        strokeWidth={n > 0 ? 0.8 : 0.4}
                        style={{ default: { outline: "none" }, hover: { outline: "none", fill: n > 0 ? "rgba(255,85,0,0.45)" : "#252320" }, pressed: { outline: "none" } }}
                      >
                        <title>{abbr}{n > 0 ? ` — ${n} partner${n > 1 ? "s" : ""}` : ""}</title>
                      </Geography>
                    )
                  })
                }
              </Geographies>

              {PARTNERS.map(p => {
                const isActive  = active?.id === p.id
                const isVisible = filtered.find(f => f.id === p.id)
                if (!isVisible) return null
                const color = SEGMENT_COLORS[p.segment]
                return (
                  <Marker key={p.id} coordinates={p.coords}>
                    <circle
                      className="dot"
                      r={isActive ? 6 / zoom : 4 / zoom}
                      fill={color}
                      stroke={isActive ? C.white : "rgba(0,0,0,0.4)"}
                      strokeWidth={isActive ? 1.5 / zoom : 0.6 / zoom}
                      opacity={isActive ? 1 : 0.8}
                      onClick={() => setActive(isActive ? null : p)}
                      onMouseEnter={() => setTooltip(p)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {isActive && (
                      <circle r={12 / zoom} fill="none" stroke={color} strokeWidth={1 / zoom} opacity={0.4} style={{ pointerEvents: "none" }} />
                    )}
                  </Marker>
                )
              })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Legend */}
          <div style={{ position: "absolute", bottom: 20, left: 20, background: C.card, border: `1px solid ${C.border}`, padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {Object.entries(SEGMENT_COLORS).map(([seg, color]) => (
                <div key={seg} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>{seg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && tooltip.id !== active?.id && (
            <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: C.card, border: `1px solid ${SEGMENT_COLORS[tooltip.segment]}`, padding: "8px 14px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.white, letterSpacing: 0.5, pointerEvents: "none", whiteSpace: "nowrap" }}>
              {tooltip.name} · {tooltip.city}, {tooltip.state}
            </div>
          )}

          {/* Zoom controls */}
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 2 }}>
            {[{ label: "+", delta: 0.5 }, { label: "−", delta: -0.5 }, { label: "⌂", reset: true }].map(btn => (
              <button key={btn.label} className="seg-btn"
                onClick={() => btn.reset ? (setZoom(1), setCenter([-96, 38])) : setZoom(z => Math.min(8, Math.max(1, z + btn.delta)))}
                style={{ width: 32, height: 32, background: C.card, border: `1px solid ${C.borderLight}`, color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ width: 300, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {active ? (
            <div className="card-in" style={{ padding: "20px", borderBottom: `1px solid ${C.border}`, background: C.dark }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: SEGMENT_COLORS[active.segment] }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{active.segment} · #{active.id}</span>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 1.5, marginBottom: 10, lineHeight: 1.1 }}>{active.name}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.muted, marginBottom: 4 }}>{active.city}, {active.state}</div>
              <a href={`https://${active.website}`} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.orange, textDecoration: "underline", textDecorationColor: "rgba(255,85,0,0.3)" }}>
                {active.website}
              </a>
              <button onClick={() => setActive(null)}
                style={{ marginTop: 12, width: "100%", padding: "6px", background: "transparent", border: `1px solid ${C.borderLight}`, color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 9, cursor: "pointer", letterSpacing: 1 }}>
                CLEAR
              </button>
            </div>
          ) : (
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Top States</div>
              {topStates.map(([st, n]) => (
                <div key={st} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.white }}>{st}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: n * 8, height: 4, background: C.orange, opacity: 0.7 }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.orange, minWidth: 16, textAlign: "right" }}>{n}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Segment filter */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 4, flexWrap: "wrap" }}>
            {segments.map(s => (
              <button key={s} className="seg-btn"
                onClick={() => setSegment(s)}
                style={{
                  padding: "4px 10px", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1,
                  textTransform: "uppercase", background: segment === s ? C.orange : C.card,
                  color: segment === s ? C.black : C.muted,
                  border: `1px solid ${segment === s ? C.orange : C.borderLight}`,
                  opacity: segment === s ? 1 : 0.7,
                }}>
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search partners..."
              style={{ width: "100%", background: C.card, border: `1px solid ${C.borderLight}`, color: C.white, padding: "8px 12px", fontFamily: "'DM Mono', monospace", fontSize: 11, outline: "none", letterSpacing: 0.5 }} />
            {filter && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, marginTop: 4, letterSpacing: 1 }}>
                {filtered.length} of {PARTNERS.length} partners
              </div>
            )}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.map(p => (
              <div key={p.id}
                onClick={() => setActive(active?.id === p.id ? null : p)}
                style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: active?.id === p.id ? C.dark : "transparent", borderLeft: active?.id === p.id ? `3px solid ${SEGMENT_COLORS[p.segment]}` : "3px solid transparent", transition: "all 0.1s" }}
                onMouseEnter={e => { if (active?.id !== p.id) e.currentTarget.style.background = C.card }}
                onMouseLeave={e => { if (active?.id !== p.id) e.currentTarget.style.background = "transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, marginBottom: 2, opacity: active?.id === p.id ? 1 : 0.85 }}>{p.name}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>{p.city}, {p.state}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, marginLeft: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: SEGMENT_COLORS[p.segment], flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.borderLight }}>{p.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, fontFamily: "'DM Mono', monospace", fontSize: 8, color: C.muted, letterSpacing: 1 }}>
            ADMIN-MANAGED · SOURCE: SENIORMARKETSALES.COM
          </div>
        </div>
      </div>
    </div>
  )
}
