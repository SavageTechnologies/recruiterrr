'use client'

import { useState, useEffect, useRef } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

// ─── AMERILIFE AFFILIATES ─────────────────────────────────────────────────
// Source: amerilife.com/our-solutions/affiliates/ — admin-managed only
const PARTNERS = [
  // ── Medical, Life & Health ──
  { id: 1,   name: "AAA Marketing Services",          city: "Clearwater",       state: "FL", coords: [-82.8,  27.97],  website: "aaamarketingservices.com",        segment: "Health" },
  { id: 2,   name: "Agent Boost Marketing",           city: "Clearwater",       state: "FL", coords: [-82.75, 27.95],  website: "agentboost.com",                 segment: "Health" },
  { id: 3,   name: "ABX",                             city: "Nashville",        state: "TN", coords: [-86.78, 36.17],  website: "thinkabx.com",                   segment: "Health" },
  { id: 4,   name: "American Federal",                city: "Omaha",            state: "NE", coords: [-95.93, 41.26],  website: "americanfederal.org",             segment: "Health" },
  { id: 5,   name: "AmeriLife Marketing Group",       city: "Clearwater",       state: "FL", coords: [-82.82, 27.98],  website: "amerilifemarketinggroup.com",     segment: "Health" },
  { id: 6,   name: "BGA Insurance",                   city: "Tampa",            state: "FL", coords: [-82.46, 27.95],  website: "bgainsurance.net",               segment: "Health" },
  { id: 7,   name: "Bobby Brock Insurance",           city: "Booneville",       state: "MS", coords: [-88.57, 34.66],  website: "bobbybrockinsurance.com",         segment: "Health" },
  { id: 8,   name: "Camas Prairie Insurance",         city: "Cottonwood",       state: "ID", coords: [-116.35, 46.05], website: "camasprairieinsurance.com",       segment: "Health" },
  { id: 9,   name: "Crowe & Associates",              city: "Milford",          state: "CT", coords: [-73.06, 41.22],  website: "croweandassociates.com",          segment: "Health" },
  { id: 10,  name: "Davies Agency",                   city: "Glastonbury",      state: "CT", coords: [-72.61, 41.71],  website: "daviesagency.net",               segment: "Health" },
  { id: 11,  name: "Diversified Health Services",     city: "Clearwater",       state: "FL", coords: [-82.78, 27.96],  website: "diversifiedhealth.services",      segment: "Health" },
  { id: 12,  name: "Elite Insurance Group",           city: "Alpharetta",       state: "GA", coords: [-84.29, 34.07],  website: "elite-insgroup.com",             segment: "Health" },
  { id: 13,  name: "Gordon Marketing",                city: "Noblesville",      state: "IN", coords: [-86.01, 40.05],  website: "gordonmarketing.com",            segment: "Health" },
  { id: 14,  name: "GLS Insurance",                   city: "St. Louis",        state: "MO", coords: [-90.19, 38.63],  website: "insurancegls.com",               segment: "Health" },
  { id: 15,  name: "GS National Insurance",           city: "Boca Raton",       state: "FL", coords: [-80.10, 26.36],  website: "gsnational.com",                 segment: "Health" },
  { id: 16,  name: "Health Insurance Store",          city: "Louisville",       state: "KY", coords: [-85.76, 38.25],  website: "getyourbestplan.com",            segment: "Health" },
  { id: 17,  name: "HealthOne",                       city: "Independence",     state: "MO", coords: [-94.42, 39.09],  website: "healthonecorp.com",              segment: "Health" },
  { id: 18,  name: "Health Resource Advisors",        city: "Ocala",            state: "FL", coords: [-82.14, 29.19],  website: "healthresourceadvisors.com",     segment: "Health" },
  { id: 19,  name: "HIPE Financial",                  city: "Austin",           state: "TX", coords: [-97.73, 30.26],  website: "hipe.financial",                 segment: "Health" },
  { id: 20,  name: "Insurance 360",                   city: "Scottsdale",       state: "AZ", coords: [-111.93, 33.49], website: "insurance360.net",               segment: "Health" },
  { id: 21,  name: "Insurance Specialist Group",      city: "Clearwater",       state: "FL", coords: [-82.84, 27.94],  website: "amerilife.com",                  segment: "Health" },
  { id: 22,  name: "IS Zelienople",                   city: "Zelienople",       state: "PA", coords: [-80.14, 40.79],  website: "zelieinsurance.com",             segment: "Health" },
  { id: 23,  name: "Insurance Services LLC",          city: "Sarasota",         state: "FL", coords: [-82.53, 27.34],  website: "myinsuranceteam.com",            segment: "Health" },
  { id: 24,  name: "JSA Online",                      city: "Jacksonville",     state: "FL", coords: [-81.66, 30.33],  website: "jsaonline.com",                  segment: "Health" },
  { id: 25,  name: "LG-3",                            city: "Memphis",          state: "TN", coords: [-90.05, 35.15],  website: "lg-3.org",                       segment: "Health" },
  { id: 26,  name: "Maximum Senior Benefits",         city: "Clearwater",       state: "FL", coords: [-82.77, 27.99],  website: "maximumseniorbenefits.com",      segment: "Health" },
  { id: 27,  name: "MCC Brokerage",                   city: "Chesterfield",     state: "MO", coords: [-90.58, 38.66],  website: "mccbrokerage.com",               segment: "Health" },
  { id: 28,  name: "Midwestern Marketing",            city: "Wichita",          state: "KS", coords: [-97.34, 37.69],  website: "midwesternmarketing.com",        segment: "Health" },
  { id: 29,  name: "Med-Care AZ",                     city: "Chandler",         state: "AZ", coords: [-111.84, 33.31], website: "med-careaz.com",                 segment: "Health" },
  { id: 30,  name: "NISH Direct",                     city: "Orlando",          state: "FL", coords: [-81.38, 28.54],  website: "nishd.com",                      segment: "Health" },
  { id: 31,  name: "One Health Benefits",             city: "Clearwater",       state: "FL", coords: [-82.74, 27.93],  website: "onehealthbenefits.com",          segment: "Health" },
  { id: 32,  name: "Open Access Insurance",           city: "Sunrise",          state: "FL", coords: [-80.26, 26.17],  website: "openaccessinsurance.com",        segment: "Health" },
  { id: 33,  name: "ORCA Life",                       city: "Fort Lauderdale",  state: "FL", coords: [-80.14, 26.12],  website: "orca.life",                      segment: "Health" },
  { id: 34,  name: "Parker Marketing",                city: "Little Rock",      state: "AR", coords: [-92.29, 34.75],  website: "pmiagents.com",                  segment: "Health" },
  { id: 35,  name: "Paul Proffitt",                   city: "Louisville",       state: "KY", coords: [-85.74, 38.27],  website: "askpaulforinfo.com",             segment: "Health" },
  { id: 36,  name: "PFS Insurance",                   city: "Clearwater",       state: "FL", coords: [-82.73, 27.97],  website: "pfsinsurance.com",               segment: "Health" },
  { id: 37,  name: "Plan Medicare",                   city: "Tampa",            state: "FL", coords: [-82.49, 27.98],  website: "planmedicare.com",               segment: "Health" },
  { id: 38,  name: "Platinum Choice Healthcare",      city: "Dallas",           state: "TX", coords: [-96.80, 32.78],  website: "platinumchoicehealthcare.com",   segment: "Health" },
  { id: 39,  name: "PSM Brokerage",                   city: "Overland Park",    state: "KS", coords: [-94.67, 38.98],  website: "psmbrokerage.com",               segment: "Health" },
  { id: 40,  name: "PIP",                             city: "Miami",            state: "FL", coords: [-80.19, 25.77],  website: "pip1.com",                       segment: "Health" },
  { id: 41,  name: "RB Insurance Group",              city: "Deerfield Beach",  state: "FL", coords: [-80.10, 26.32],  website: "rbi-group.com",                  segment: "Health" },
  { id: 42,  name: "Right Choice Community",          city: "Phoenix",          state: "AZ", coords: [-112.07, 33.45], website: "rightchoicecommunitycommitment.org", segment: "Health" },
  { id: 43,  name: "Senior Elite Services",           city: "Clearwater",       state: "FL", coords: [-82.80, 27.92],  website: "senioreliteservices.com",        segment: "Health" },
  { id: 44,  name: "Senior Healthcare Direct",        city: "Clearwater",       state: "FL", coords: [-82.76, 27.94],  website: "seniorhealthcaredirect.com",     segment: "Health" },
  { id: 45,  name: "Senior Health Insurance Direct",  city: "Clearwater",       state: "FL", coords: [-82.71, 27.96],  website: "seniorhealthinsurancedirect.com", segment: "Health" },
  { id: 46,  name: "Senior Market Advisors",          city: "Charlotte",        state: "NC", coords: [-80.84, 35.23],  website: "seniormarketadvisors.com",       segment: "Health" },
  { id: 47,  name: "SSI Insurance",                   city: "Clearwater",       state: "FL", coords: [-82.72, 27.91],  website: "ssiinsure.com",                  segment: "Health" },
  { id: 48,  name: "Sherman Insurance",               city: "Louisville",       state: "KY", coords: [-85.72, 38.26],  website: "shermanins.com",                 segment: "Health" },
  { id: 49,  name: "Southern Life Insurance",         city: "Mobile",           state: "AL", coords: [-88.04, 30.69],  website: "southernlifeins.com",            segment: "Health" },
  { id: 50,  name: "Stephens-Matthews",               city: "Baton Rouge",      state: "LA", coords: [-91.15, 30.45],  website: "stephens-matthews.com",          segment: "Health" },
  { id: 51,  name: "USABG",                           city: "Clearwater",       state: "FL", coords: [-82.79, 27.90],  website: "usabg.com",                      segment: "Health" },
  { id: 52,  name: "Willamette Valley Benefits",      city: "Salem",            state: "OR", coords: [-123.03, 44.94], website: "wvbenefits.com",                 segment: "Health" },
  { id: 53,  name: "Your Family Bank",                city: "Atlanta",          state: "GA", coords: [-84.39, 33.75],  website: "yourfamilybank.org",             segment: "Health" },

  // ── Wealth Management ──
  { id: 54,  name: "ASG Life",                        city: "Clearwater",       state: "FL", coords: [-82.83, 27.89],  website: "asglife.com",                    segment: "Wealth" },
  { id: 55,  name: "Allied Elite Financial",          city: "Phoenix",          state: "AZ", coords: [-112.10, 33.48], website: "alliedelitefinancial.com",        segment: "Wealth" },
  { id: 56,  name: "Brookstone Capital Management",   city: "Wheaton",          state: "IL", coords: [-88.11, 41.86],  website: "brookstonecm.com",               segment: "Wealth" },
  { id: 57,  name: "CFN",                             city: "Fort Lauderdale",  state: "FL", coords: [-80.15, 26.13],  website: "cfnsfl.com",                     segment: "Wealth" },
  { id: 58,  name: "Crump Life Insurance Services",   city: "Charlotte",        state: "NC", coords: [-80.86, 35.22],  website: "crump.com",                      segment: "Wealth" },
  { id: 59,  name: "Dallas Financial Wholesalers",    city: "Dallas",           state: "TX", coords: [-96.82, 32.80],  website: "ronrawlings.com",                segment: "Wealth" },
  { id: 60,  name: "FSIB",                            city: "Boca Raton",       state: "FL", coords: [-80.13, 26.37],  website: "fsib2000.com",                   segment: "Wealth" },
  { id: 61,  name: "Hoffman Financial Group",         city: "Minneapolis",      state: "MN", coords: [-93.27, 44.98],  website: "hoffmancorporation.com",         segment: "Wealth" },
  { id: 62,  name: "KME Insurance Brokerage",         city: "Clearwater",       state: "FL", coords: [-82.86, 27.88],  website: "kmeins.com",                     segment: "Wealth" },
  { id: 63,  name: "Levinson & Associates",           city: "Walnut Creek",     state: "CA", coords: [-122.06, 37.91], website: "carylevinson.com",               segment: "Wealth" },
  { id: 64,  name: "Meritage WIA",                    city: "Scottsdale",       state: "AZ", coords: [-111.90, 33.52], website: "meritagewia.com",                segment: "Wealth" },
  { id: 65,  name: "The Ohlson Group",                city: "Omaha",            state: "NE", coords: [-96.0,  41.28],  website: "ohlsongroup.com",                segment: "Wealth" },
  { id: 66,  name: "Peak Financial Freedom Group",    city: "Sacramento",       state: "CA", coords: [-121.50, 38.58], website: "peakfinancialfreedomgroup.com",   segment: "Wealth" },
  { id: 67,  name: "Pro Advantage Marketing",         city: "Kansas City",      state: "MO", coords: [-94.58, 39.10],  website: "proadvantagemkt.com",            segment: "Wealth" },
  { id: 68,  name: "Saybrus Partners",                city: "Hartford",         state: "CT", coords: [-72.68, 41.76],  website: "saybruspartners.com",            segment: "Wealth" },
  { id: 69,  name: "Southwest Annuities Marketing",   city: "Scottsdale",       state: "AZ", coords: [-111.88, 33.51], website: "southwestannuitiesmarketing.com", segment: "Wealth" },
  { id: 70,  name: "Sterling Bridge",                 city: "Phoenix",          state: "AZ", coords: [-112.05, 33.47], website: "sterlingbridge.com",             segment: "Wealth" },
  { id: 71,  name: "Succession Capital",              city: "Austin",           state: "TX", coords: [-97.71, 30.28],  website: "successioncapital.com",          segment: "Wealth" },
  { id: 72,  name: "TAG Partners",                    city: "Atlanta",          state: "GA", coords: [-84.42, 33.77],  website: "tagpartners.org",                segment: "Wealth" },
  { id: 73,  name: "The Annuity Store",               city: "Sioux Falls",      state: "SD", coords: [-96.73, 43.55],  website: "annuity1.com",                   segment: "Wealth" },
  { id: 74,  name: "USA Financial",                   city: "Grand Rapids",     state: "MI", coords: [-85.67, 42.96],  website: "usafinancial.com",               segment: "Wealth" },
  { id: 75,  name: "V2 Financial",                    city: "Denver",           state: "CO", coords: [-104.99, 39.74], website: "v2fm.com",                       segment: "Wealth" },
  { id: 76,  name: "MyLifeWerks",                     city: "St. Louis",        state: "MO", coords: [-90.22, 38.65],  website: "mylifewerksinsurance.com",       segment: "Wealth" },

  // ── Worksite ──
  { id: 77,  name: "Benefits Direct",                 city: "Clearwater",       state: "FL", coords: [-82.85, 27.87],  website: "amerilife.com",                  segment: "Worksite" },
  { id: 78,  name: "Flex Made Easy",                  city: "Tampa",            state: "FL", coords: [-82.52, 27.97],  website: "flexmadeeasy.com",               segment: "Worksite" },
]

const SEGMENT_COLORS = {
  Health:   "#ff5500",
  Wealth:   "#00b4d8",
  Worksite: "#00e676",
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
  if (n >= 10) return "rgba(255,85,0,0.35)"
  if (n >= 6)  return "rgba(255,85,0,0.22)"
  if (n >= 3)  return "rgba(255,85,0,0.14)"
  return "rgba(255,85,0,0.08)"
}

export default function AmeriLifePartnerMap() {
  const [active, setActive]     = useState(null)
  const [filter, setFilter]     = useState("")
  const [segment, setSegment]   = useState("All")
  const [tooltip, setTooltip]   = useState(null)
  const [zoom, setZoom]         = useState(1)
  const [center, setCenter]     = useState([-96, 38])

  const segments = ["All", "Health", "Wealth", "Worksite"]

  const filtered = PARTNERS.filter(p => {
    const matchSeg = segment === "All" || p.segment === segment
    const matchStr = !filter.trim() ||
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.city.toLowerCase().includes(filter.toLowerCase()) ||
      p.state.toLowerCase().includes(filter.toLowerCase())
    return matchSeg && matchStr
  })

  const topStates = Object.entries(STATE_COUNTS).sort((a,b) => b[1]-a[1]).slice(0,8)

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
            ● LIVE NETWORK · ADMIN MANAGED
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 3, lineHeight: 1 }}>
            AMERILIFE<span style={{ color: C.orange }}>.</span> AFFILIATE NETWORK
          </h1>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { v: PARTNERS.length,                            l: "Total Affiliates" },
            { v: PARTNERS.filter(p=>p.segment==="Health").length,   l: "Health" },
            { v: PARTNERS.filter(p=>p.segment==="Wealth").length,   l: "Wealth" },
            { v: Object.keys(STATE_COUNTS).length,           l: "States" },
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
                        style={{ default:{outline:"none"}, hover:{outline:"none",fill:n>0?"rgba(255,85,0,0.45)":"#252320"}, pressed:{outline:"none"} }}
                      >
                        <title>{abbr}{n > 0 ? ` — ${n} affiliate${n>1?"s":""}` : ""}</title>
                      </Geography>
                    )
                  })
                }
              </Geographies>

              {PARTNERS.map(p => {
                const isActive   = active?.id === p.id
                const isVisible  = filtered.find(f => f.id === p.id)
                if (!isVisible) return null
                const color = SEGMENT_COLORS[p.segment]
                return (
                  <Marker key={p.id} coordinates={p.coords}>
                    <circle
                      className="dot"
                      r={isActive ? 6/zoom : 4/zoom}
                      fill={isActive ? color : color}
                      stroke={isActive ? C.white : "rgba(0,0,0,0.4)"}
                      strokeWidth={isActive ? 1.5/zoom : 0.6/zoom}
                      opacity={isActive ? 1 : 0.8}
                      onClick={() => setActive(isActive ? null : p)}
                      onMouseEnter={() => setTooltip(p)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {isActive && (
                      <circle r={12/zoom} fill="none" stroke={color} strokeWidth={1/zoom} opacity={0.4} style={{pointerEvents:"none"}} />
                    )}
                  </Marker>
                )
              })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Legend */}
          <div style={{ position:"absolute", bottom:20, left:20, background:C.card, border:`1px solid ${C.border}`, padding:"12px 16px" }}>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {Object.entries(SEGMENT_COLORS).map(([seg, color]) => (
                <div key={seg} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:color }} />
                  <span style={{ fontFamily:"'DM Mono', monospace", fontSize:9, color:C.muted, letterSpacing:0.5 }}>{seg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && tooltip.id !== active?.id && (
            <div style={{ position:"absolute", top:16, left:"50%", transform:"translateX(-50%)", background:C.card, border:`1px solid ${SEGMENT_COLORS[tooltip.segment]}`, padding:"8px 14px", fontFamily:"'DM Mono', monospace", fontSize:10, color:C.white, letterSpacing:0.5, pointerEvents:"none", whiteSpace:"nowrap" }}>
              {tooltip.name} · {tooltip.city}, {tooltip.state}
            </div>
          )}

          {/* Zoom */}
          <div style={{ position:"absolute", top:16, right:16, display:"flex", flexDirection:"column", gap:2 }}>
            {[{label:"+",delta:0.5},{label:"−",delta:-0.5},{label:"⌂",reset:true}].map(btn => (
              <button key={btn.label} className="seg-btn"
                onClick={() => btn.reset ? (setZoom(1),setCenter([-96,38])) : setZoom(z => Math.min(8,Math.max(1,z+btn.delta)))}
                style={{ width:32, height:32, background:C.card, border:`1px solid ${C.borderLight}`, color:C.muted, fontFamily:"'DM Mono', monospace", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ width:300, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Detail or stats */}
          {active ? (
            <div className="card-in" style={{ padding:"20px", borderBottom:`1px solid ${C.border}`, background:C.dark }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:SEGMENT_COLORS[active.segment] }} />
                <span style={{ fontFamily:"'DM Mono', monospace", fontSize:9, color:C.muted, letterSpacing:2, textTransform:"uppercase" }}>{active.segment} · #{active.id}</span>
              </div>
              <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:22, letterSpacing:1.5, marginBottom:10, lineHeight:1.1 }}>{active.name}</div>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:C.muted, marginBottom:4 }}>📍 {active.city}, {active.state}</div>
              <a href={`https://${active.website}`} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:"'DM Mono', monospace", fontSize:10, color:C.orange, textDecoration:"underline", textDecorationColor:"rgba(255,85,0,0.3)" }}>
                {active.website}
              </a>
              <button onClick={() => setActive(null)}
                style={{ marginTop:12, width:"100%", padding:"6px", background:"transparent", border:`1px solid ${C.borderLight}`, color:C.muted, fontFamily:"'DM Mono', monospace", fontSize:9, cursor:"pointer", letterSpacing:1 }}>
                CLEAR
              </button>
            </div>
          ) : (
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:9, color:C.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Top States</div>
              {topStates.map(([st,n]) => (
                <div key={st} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontFamily:"'DM Mono', monospace", fontSize:11, color:C.white }}>{st}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:n*8, height:4, background:C.orange, opacity:0.7 }} />
                    <span style={{ fontFamily:"'DM Mono', monospace", fontSize:10, color:C.orange, minWidth:16, textAlign:"right" }}>{n}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Segment filter */}
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:4, flexWrap:"wrap" }}>
            {segments.map(s => (
              <button key={s} className="seg-btn"
                onClick={() => setSegment(s)}
                style={{
                  padding:"4px 10px", fontFamily:"'DM Mono', monospace", fontSize:9, letterSpacing:1,
                  textTransform:"uppercase", background: segment===s ? C.orange : C.card,
                  color: segment===s ? C.black : C.muted,
                  border: `1px solid ${segment===s ? C.orange : C.borderLight}`,
                  opacity: segment===s ? 1 : 0.7,
                }}>
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}` }}>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search affiliates..."
              style={{ width:"100%", background:C.card, border:`1px solid ${C.borderLight}`, color:C.white, padding:"8px 12px", fontFamily:"'DM Mono', monospace", fontSize:11, outline:"none", letterSpacing:0.5 }} />
            {filter && (
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:9, color:C.muted, marginTop:4, letterSpacing:1 }}>
                {filtered.length} of {PARTNERS.length} affiliates
              </div>
            )}
          </div>

          {/* List */}
          <div style={{ flex:1, overflowY:"auto" }}>
            {filtered.map(p => (
              <div key={p.id}
                onClick={() => setActive(active?.id===p.id ? null : p)}
                style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", background:active?.id===p.id ? C.dark : "transparent", borderLeft:active?.id===p.id ? `3px solid ${SEGMENT_COLORS[p.segment]}` : "3px solid transparent", transition:"all 0.1s" }}
                onMouseEnter={e => { if(active?.id!==p.id) e.currentTarget.style.background=C.card }}
                onMouseLeave={e => { if(active?.id!==p.id) e.currentTarget.style.background="transparent" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500, lineHeight:1.3, marginBottom:2, opacity:active?.id===p.id?1:0.85 }}>{p.name}</div>
                    <div style={{ fontFamily:"'DM Mono', monospace", fontSize:9, color:C.muted, letterSpacing:0.5 }}>{p.city}, {p.state}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2, marginLeft:8 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:SEGMENT_COLORS[p.segment], flexShrink:0 }} />
                    <span style={{ fontFamily:"'DM Mono', monospace", fontSize:9, color:C.borderLight }}>{p.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding:"10px 16px", borderTop:`1px solid ${C.border}`, fontFamily:"'DM Mono', monospace", fontSize:8, color:C.muted, letterSpacing:1 }}>
            ADMIN-MANAGED · SOURCE: AMERILIFE.COM/AFFILIATES
          </div>
        </div>
      </div>
    </div>
  )
}
