'use client'

import { useState, useEffect, useRef } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

const FIPS = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL',
  '13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME',
  '24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH',
  '34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI',
  '45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY'
}

// City coordinates lookup — covers common US cities
const CITY_COORDS = {
  'wichita,ks': [-97.33, 37.69], 'kansas city,ks': [-94.63, 39.11], 'kansas city,mo': [-94.58, 39.1],
  'overland park,ks': [-94.67, 38.98], 'topeka,ks': [-95.68, 39.05], 'salina,ks': [-97.61, 38.84],
  'new york,ny': [-74.0, 40.71], 'los angeles,ca': [-118.24, 34.05], 'chicago,il': [-87.63, 41.88],
  'houston,tx': [-95.37, 29.76], 'phoenix,az': [-112.07, 33.45], 'philadelphia,pa': [-75.16, 39.95],
  'san antonio,tx': [-98.49, 29.42], 'san diego,ca': [-117.16, 32.72], 'dallas,tx': [-96.8, 32.78],
  'austin,tx': [-97.73, 30.26], 'jacksonville,fl': [-81.66, 30.33], 'san jose,ca': [-121.89, 37.34],
  'fort worth,tx': [-97.33, 32.75], 'columbus,oh': [-82.99, 39.96], 'charlotte,nc': [-80.84, 35.23],
  'indianapolis,in': [-86.16, 39.77], 'san francisco,ca': [-122.42, 37.77], 'seattle,wa': [-122.33, 47.61],
  'denver,co': [-104.99, 39.74], 'nashville,tn': [-86.78, 36.17], 'oklahoma city,ok': [-97.52, 35.47],
  'el paso,tx': [-106.49, 31.76], 'boston,ma': [-71.06, 42.36], 'portland,or': [-122.68, 45.52],
  'las vegas,nv': [-115.14, 36.17], 'memphis,tn': [-90.05, 35.15], 'louisville,ky': [-85.76, 38.25],
  'baltimore,md': [-76.61, 39.29], 'milwaukee,wi': [-87.91, 43.04], 'albuquerque,nm': [-106.65, 35.08],
  'tucson,az': [-110.97, 32.22], 'fresno,ca': [-119.79, 36.74], 'sacramento,ca': [-121.49, 38.58],
  'mesa,az': [-111.83, 33.42], 'omaha,ne': [-95.93, 41.26], 'cleveland,oh': [-81.69, 41.5],
  'raleigh,nc': [-78.64, 35.78], 'miami,fl': [-80.19, 25.77], 'virginia beach,va': [-75.98, 36.85],
  'atlanta,ga': [-84.39, 33.75], 'minneapolis,mn': [-93.27, 44.98], 'tampa,fl': [-82.46, 27.95],
  'tulsa,ok': [-95.99, 36.15], 'arlington,tx': [-97.11, 32.74], 'new orleans,la': [-90.07, 29.95],
  'wichita falls,tx': [-98.49, 33.91], 'st. louis,mo': [-90.19, 38.63], 'pittsburgh,pa': [-79.99, 40.44],
  'anchorage,ak': [-149.9, 61.22], 'cincinnati,oh': [-84.51, 39.1], 'orlando,fl': [-81.38, 28.54],
  'st. paul,mn': [-93.09, 44.94], 'corpus christi,tx': [-97.4, 27.8], 'riverside,ca': [-117.4, 33.95],
  'lexington,ky': [-84.5, 38.04], 'st. petersburg,fl': [-82.64, 27.77], 'stockton,ca': [-121.29, 37.96],
  'baton rouge,la': [-91.15, 30.45], 'jersey city,nj': [-74.08, 40.73], 'lincoln,ne': [-96.67, 40.81],
  'greensboro,nc': [-79.79, 36.07], 'plano,tx': [-96.7, 33.02], 'henderson,nv': [-115.03, 36.04],
  'buffalo,ny': [-78.88, 42.89], 'fort wayne,in': [-85.14, 41.13], 'madison,wi': [-89.4, 43.07],
  'norfolk,va': [-76.29, 36.89], 'laredo,tx': [-99.51, 27.51], 'lubbock,tx': [-101.85, 33.58],
  'winston-salem,nc': [-80.24, 36.1], 'garland,tx': [-96.64, 32.91], 'scottsdale,az': [-111.92, 33.49],
  'hialeah,fl': [-80.28, 25.86], 'reno,nv': [-119.81, 39.53], 'durham,nc': [-78.9, 35.99],
  'spokane,wa': [-117.43, 47.66], 'des moines,ia': [-93.62, 41.6], 'montgomery,al': [-86.3, 32.36],
  'bakersfield,ca': [-119.02, 35.37], 'boise,id': [-116.2, 43.62], 'richmond,va': [-77.46, 37.55],
  'fayetteville,nc': [-78.88, 35.05], 'fremont,ca': [-121.99, 37.55], 'glendale,az': [-112.19, 33.54],
  'little rock,ar': [-92.29, 34.75], 'birmingham,al': [-86.8, 33.52], 'shreveport,la': [-93.75, 32.52],
  'amarillo,tx': [-101.83, 35.22], 'salt lake city,ut': [-111.89, 40.76], 'huntsville,al': [-86.59, 34.73],
  'grand rapids,mi': [-85.67, 42.96], 'knoxville,tn': [-83.92, 35.96], 'worcester,ma': [-71.8, 42.26],
  'newport news,va': [-76.43, 36.98], 'hartford,ct': [-72.68, 41.76], 'providence,ri': [-71.41, 41.82],
  'mcallen,tx': [-98.23, 26.21], 'tallahassee,fl': [-84.28, 30.44], 'glendale,ca': [-118.26, 34.14],
  'sarasota,fl': [-82.5, 27.3], 'clearwater,fl': [-82.8, 27.97], 'columbia,sc': [-81.03, 34.0],
  'columbia,mo': [-92.33, 38.95], 'springfield,mo': [-93.29, 37.21], 'jackson,ms': [-90.18, 32.3],
  'chattanooga,tn': [-85.31, 35.04], 'mobile,al': [-88.04, 30.69], 'peoria,il': [-89.59, 40.69],
  'fargo,nd': [-96.79, 46.88], 'sioux falls,sd': [-96.73, 43.54], 'aurora,co': [-104.83, 39.73],
  'tempe,az': [-111.94, 33.43], 'chandler,az': [-111.84, 33.31], 'gilbert,az': [-111.79, 33.35],
}

function getCoordsForSpecimen(city, state) {
  const key = `${city.toLowerCase().trim()},${state.toLowerCase().trim()}`
  if (CITY_COORDS[key]) return CITY_COORDS[key]
  // Fallback to state center if city not found
  const STATE_CENTERS = {
    'AL':[-86.8,32.8],'AK':[-153,64],'AZ':[-111.7,34.3],'AR':[-92.4,34.9],'CA':[-119.5,37.3],
    'CO':[-105.5,39],'CT':[-72.7,41.6],'DE':[-75.5,39],'FL':[-81.5,27.8],'GA':[-83.4,32.7],
    'HI':[-157.8,21.3],'ID':[-114.5,44.4],'IL':[-89.2,40.1],'IN':[-86.3,39.9],'IA':[-93.5,42.1],
    'KS':[-98.4,38.5],'KY':[-84.9,37.5],'LA':[-91.8,31],'ME':[-69.4,45.4],'MD':[-76.8,39],
    'MA':[-71.8,42.3],'MI':[-84.7,44.3],'MN':[-94.3,46.4],'MS':[-89.7,32.7],'MO':[-92.3,38.3],
    'MT':[-110.4,47],'NE':[-99.9,41.5],'NV':[-117,38.5],'NH':[-71.6,43.7],'NJ':[-74.5,40],
    'NM':[-106.1,34.5],'NY':[-75.5,43],'NC':[-79.4,35.6],'ND':[-100.5,47.5],'OH':[-82.8,40.4],
    'OK':[-97.5,35.5],'OR':[-120.5,44],'PA':[-77.2,40.9],'RI':[-71.5,41.7],'SC':[-80.9,33.8],
    'SD':[-100,44.4],'TN':[-86.7,35.9],'TX':[-99.3,31.5],'UT':[-111.5,39.5],'VT':[-72.7,44],
    'VA':[-78.5,37.8],'WA':[-120.5,47.5],'WV':[-80.6,38.9],'WI':[-89.6,44.5],'WY':[-107.6,43]
  }
  return STATE_CENTERS[state.toUpperCase()] || [-96, 38]
}

// Tree color scheme — green theme but distinct per tree
const TREE_COLORS = {
  integrity: { primary: '#00e676', dim: 'rgba(0,230,118,0.15)', label: 'INTEGRITY' },
  amerilife: { primary: '#40c4ff', dim: 'rgba(64,196,255,0.15)', label: 'AMERILIFE' },
  sms:       { primary: '#ffd740', dim: 'rgba(255,215,64,0.15)', label: 'SMS' },
  other:     { primary: '#ff6d00', dim: 'rgba(255,109,0,0.15)', label: 'OTHER' },
  unknown:   { primary: '#444', dim: 'rgba(80,80,80,0.1)', label: 'UNCLASSIFIED' },
}

const C = {
  black: '#0a0a09', dark: '#0e0d0c', card: '#121110',
  border: 'rgba(0,230,118,0.12)', borderLight: 'rgba(0,230,118,0.25)',
  white: '#f0ede8', muted: '#5a5a55', green: '#00e676',
}

function getSpecimenColor(specimen) {
  const tree = specimen.confirmed_tree || specimen.predicted_tree || 'unknown'
  return TREE_COLORS[tree] || TREE_COLORS.unknown
}

function getStateInfectionLevel(specimens, stateAbbr) {
  const count = specimens.filter(s => s.state?.toUpperCase() === stateAbbr).length
  return count
}

function getStateColor(specimens, stateAbbr) {
  const n = getStateInfectionLevel(specimens, stateAbbr)
  if (n === 0) return '#0d0d0b'
  if (n >= 5) return 'rgba(0,230,118,0.18)'
  if (n >= 3) return 'rgba(0,230,118,0.11)'
  return 'rgba(0,230,118,0.06)'
}

export default function AnathemaInfectionMap() {
  const [specimens, setSpecimens] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)
  const [filter, setFilter] = useState('')
  const [treeFilter, setTreeFilter] = useState('all')
  const [tooltip, setTooltip] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState([-96, 38])
  const listRef = useRef(null)

  useEffect(() => {
    fetchSpecimens()
  }, [])

  async function fetchSpecimens() {
    setLoading(true)
    try {
      const res = await fetch('/api/specimens')
      const data = await res.json()
      // Attach coords to each specimen
      const withCoords = (data.specimens || []).map(s => ({
        ...s,
        coords: getCoordsForSpecimen(s.city || '', s.state || ''),
      }))
      setSpecimens(withCoords)
    } catch {}
    setLoading(false)
  }

  const filtered = specimens.filter(s => {
    const tree = s.confirmed_tree || s.predicted_tree || 'unknown'
    const treeMatch = treeFilter === 'all' || tree === treeFilter
    const textMatch = !filter.trim() ||
      s.agent_name?.toLowerCase().includes(filter.toLowerCase()) ||
      s.city?.toLowerCase().includes(filter.toLowerCase()) ||
      s.state?.toLowerCase().includes(filter.toLowerCase())
    return treeMatch && textMatch
  })

  // Stats
  const treeCounts = specimens.reduce((acc, s) => {
    const tree = s.confirmed_tree || s.predicted_tree || 'unknown'
    acc[tree] = (acc[tree] || 0) + 1
    return acc
  }, {})

  const statesHit = new Set(specimens.map(s => s.state?.toUpperCase()).filter(Boolean)).size

  return (
    <div style={{ background: C.black, minHeight: '100vh', color: C.white, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: ${C.black}; }
        ::-webkit-scrollbar-thumb { background: rgba(0,230,118,0.2); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .specimen-dot { cursor: pointer; transition: r 0.1s; }
        .specimen-dot:hover { filter: brightness(1.5); }
        .card-in { animation: fadeIn 0.15s ease forwards; }
        .tree-btn:hover { opacity: 0.85; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.green, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'pulse 2s ease infinite' }} />
            LIVE FIELD DATA · USER-LOGGED SPECIMENS
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 3, lineHeight: 1 }}>
            ANATHEMA<span style={{ color: C.green }}>.</span> INFECTION MAP
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { v: specimens.length, l: 'Specimens Logged' },
            { v: statesHit, l: 'States Infected' },
            { v: specimens.filter(s => s.confirmed_tree).length, l: 'Confirmed' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: C.green, letterSpacing: 1 }}>{s.v}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 1, textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAP + SIDEBAR ── */}
      <div style={{ display: 'flex', height: 'calc(100vh - 130px)' }}>

        {/* MAP */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "'DM Mono', monospace", fontSize: 12, color: C.muted, letterSpacing: 2 }}>
              <span style={{ marginRight: 10, animation: 'pulse 1s infinite' }}>◈</span>
              LOADING SPECIMEN DATABASE...
            </div>
          ) : (
            <ComposableMap projection="geoAlbersUsa" style={{ width: '100%', height: '100%' }}>
              <ZoomableGroup center={center} zoom={zoom} onMoveEnd={({ zoom: z, coordinates }) => { setZoom(z); setCenter(coordinates) }}>
                {/* States — tinted by infection density */}
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const fips = geo.id?.toString().padStart(2, '0')
                      const abbr = FIPS[fips] || ''
                      const n = getStateInfectionLevel(specimens, abbr)
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getStateColor(specimens, abbr)}
                          stroke={n > 0 ? 'rgba(0,230,118,0.2)' : 'rgba(0,230,118,0.06)'}
                          strokeWidth={n > 0 ? 0.7 : 0.3}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none', fill: n > 0 ? 'rgba(0,230,118,0.28)' : '#141412' },
                            pressed: { outline: 'none' },
                          }}
                        >
                          <title>{abbr}{n > 0 ? ` — ${n} specimen${n > 1 ? 's' : ''} logged` : ''}</title>
                        </Geography>
                      )
                    })
                  }
                </Geographies>

                {/* Specimen dots */}
                {filtered.map((s, i) => {
                  const isActive = active?.id === s.id
                  const col = getSpecimenColor(s)
                  return (
                    <Marker key={s.id} coordinates={s.coords}>
                      {/* Pulse ring for confirmed specimens */}
                      {s.confirmed_tree && (
                        <circle
                          r={10 / zoom}
                          fill="none"
                          stroke={col.primary}
                          strokeWidth={0.8 / zoom}
                          opacity={0.25}
                          style={{ pointerEvents: 'none' }}
                        />
                      )}
                      <circle
                        className="specimen-dot"
                        r={isActive ? 7 / zoom : s.confirmed_tree ? 5 / zoom : 3.5 / zoom}
                        fill={isActive ? col.primary : s.confirmed_tree ? col.primary : 'transparent'}
                        stroke={col.primary}
                        strokeWidth={isActive ? 1.5 / zoom : 1 / zoom}
                        opacity={isActive ? 1 : s.confirmed_tree ? 0.85 : 0.55}
                        onClick={() => setActive(isActive ? null : s)}
                        onMouseEnter={() => setTooltip(s)}
                        onMouseLeave={() => setTooltip(null)}
                      />
                      {isActive && (
                        <circle
                          r={14 / zoom}
                          fill="none"
                          stroke={col.primary}
                          strokeWidth={1 / zoom}
                          opacity={0.35}
                          style={{ pointerEvents: 'none' }}
                        />
                      )}
                    </Marker>
                  )
                })}
              </ZoomableGroup>
            </ComposableMap>
          )}

          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 20, left: 20, background: C.card, border: `1px solid ${C.border}`, padding: '12px 16px' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>STRAIN KEY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(TREE_COLORS).filter(([k]) => k !== 'unknown').map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: val.primary, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 1 }}>
                    {val.label}
                    {treeCounts[key] ? <span style={{ color: val.primary, marginLeft: 6 }}>{treeCounts[key]}</span> : null}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 4, paddingTop: 6, borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="4" fill="none" stroke={C.green} strokeWidth="1"/><circle cx="7" cy="7" r="2" fill={C.green} opacity="0.5"/></svg>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 1 }}>CONFIRMED</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="4" fill="none" stroke={C.green} strokeWidth="1" opacity="0.5"/></svg>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 1 }}>PREDICTED ONLY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && tooltip.id !== active?.id && (
            <div style={{
              position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
              background: C.card, border: `1px solid ${getSpecimenColor(tooltip).primary}`,
              padding: '8px 14px', fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: C.white, letterSpacing: 0.5, pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              <span style={{ color: getSpecimenColor(tooltip).primary, marginRight: 8 }}>◈</span>
              {tooltip.agent_name} · {tooltip.city}, {tooltip.state}
            </div>
          )}

          {/* Zoom controls */}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[{ label: '+', delta: 0.5 }, { label: '−', delta: -0.5 }, { label: '⌂', reset: true }].map(btn => (
              <button
                key={btn.label}
                onClick={() => btn.reset ? (setZoom(1), setCenter([-96, 38])) : setZoom(z => Math.min(8, Math.max(1, z + btn.delta)))}
                style={{
                  width: 32, height: 32, background: C.card, border: `1px solid ${C.border}`,
                  color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Empty state overlay */}
          {!loading && specimens.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
            }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: 'rgba(0,230,118,0.08)', letterSpacing: 3, marginBottom: 12 }}>NO SPECIMENS LOGGED</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(0,230,118,0.2)', letterSpacing: 2 }}>RUN AN ANATHEMA SCAN AND LOG AN OBSERVATION TO BEGIN MAPPING</div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 300, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Active specimen detail */}
          {active ? (
            <div className="card-in" style={{ padding: '20px', borderBottom: `1px solid ${C.border}`, background: C.dark, flexShrink: 0 }}>
              {(() => {
                const col = getSpecimenColor(active)
                const tree = active.confirmed_tree || active.predicted_tree || 'unknown'
                const isConfirmed = !!active.confirmed_tree
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: col.primary, letterSpacing: 2, textTransform: 'uppercase' }}>
                        {isConfirmed ? '● CONFIRMED' : '◌ PREDICTED'}
                      </div>
                      <button onClick={() => setActive(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1 }}>✕</button>
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1.5, marginBottom: 6, lineHeight: 1.1, color: C.white }}>
                      {active.agent_name}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, marginBottom: 12 }}>
                      📍 {active.city}, {active.state}
                    </div>

                    {/* Strain badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: `1px solid ${col.primary}`, background: col.dim, marginBottom: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.primary }} />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: col.primary, letterSpacing: 2 }}>
                        {col.label}
                      </span>
                      {active.predicted_confidence > 0 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted }}>
                          {active.predicted_confidence}%
                        </span>
                      )}
                    </div>

                    {active.confirmed_sub_imo && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, marginBottom: 6 }}>
                        ↳ {active.confirmed_sub_imo}
                      </div>
                    )}
                    {active.recruiter_notes && (
                      <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>
                        "{active.recruiter_notes}"
                      </div>
                    )}
                    {active.agent_website && (
                      <a href={active.agent_website} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: col.primary, letterSpacing: 0.5, textDecoration: 'none', opacity: 0.7 }}>
                        {active.agent_website} ↗
                      </a>
                    )}
                    <div style={{ marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>
                      LOGGED {new Date(active.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>INFECTION BY STRAIN</div>
              {Object.entries(TREE_COLORS).filter(([k]) => k !== 'unknown').map(([key, val]) => {
                const count = treeCounts[key] || 0
                const total = specimens.length || 1
                return (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: val.primary, letterSpacing: 1 }}>{val.label}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: val.primary }}>{count}</span>
                    </div>
                    <div style={{ height: 3, background: '#1a1a18', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(count / total) * 100}%`, background: val.primary, opacity: 0.6, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tree filter */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0 }}>
            {['all', 'integrity', 'amerilife', 'sms', 'other', 'unknown'].map(t => (
              <button
                key={t}
                className="tree-btn"
                onClick={() => setTreeFilter(t === treeFilter ? 'all' : t)}
                style={{
                  padding: '3px 8px',
                  background: treeFilter === t ? (TREE_COLORS[t]?.dim || 'rgba(0,230,118,0.1)') : 'transparent',
                  border: `1px solid ${treeFilter === t ? (TREE_COLORS[t]?.primary || C.green) : '#2a2a28'}`,
                  color: treeFilter === t ? (TREE_COLORS[t]?.primary || C.green) : C.muted,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8,
                  letterSpacing: 1.5,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.1s',
                }}
              >
                {t === 'all' ? 'ALL' : TREE_COLORS[t]?.label || t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search specimens..."
              style={{
                width: '100%', background: C.card, border: `1px solid rgba(0,230,118,0.15)`,
                color: C.white, padding: '7px 10px', fontFamily: "'DM Mono', monospace",
                fontSize: 11, outline: 'none', letterSpacing: 0.5,
              }}
            />
            {filter && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, marginTop: 4, letterSpacing: 1 }}>
                {filtered.length} of {specimens.length} specimens
              </div>
            )}
          </div>

          {/* Specimen list */}
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 && !loading ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', letterSpacing: 1 }}>
                NO SPECIMENS MATCH
              </div>
            ) : (
              filtered.map(s => {
                const col = getSpecimenColor(s)
                const isActive = active?.id === s.id
                return (
                  <div
                    key={s.id}
                    onClick={() => setActive(isActive ? null : s)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: `1px solid ${C.border}`,
                      cursor: 'pointer',
                      background: isActive ? C.dark : 'transparent',
                      borderLeft: isActive ? `2px solid ${col.primary}` : '2px solid transparent',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.card }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: C.white, lineHeight: 1.3, marginBottom: 2 }}>
                          {s.agent_name}
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>
                          {s.city}, {s.state}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: col.primary, letterSpacing: 1, marginLeft: 8, flexShrink: 0, textAlign: 'right' }}>
                        <div>{col.label}</div>
                        {s.confirmed_tree && <div style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>CONFIRMED</div>}
                      </div>
                    </div>
                    {s.confirmed_sub_imo && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', marginTop: 4, letterSpacing: 0.5 }}>
                        ↳ {s.confirmed_sub_imo}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#2a2a28', letterSpacing: 1, flexShrink: 0 }}>
            PROPRIETARY FIELD INTELLIGENCE · ANATHEMA SYSTEM
          </div>
        </div>
      </div>
    </div>
  )
}
