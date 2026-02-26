'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

const FIPS = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL',
  '13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME',
  '24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH',
  '34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI',
  '45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY'
}

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
  'st. louis,mo': [-90.19, 38.63], 'pittsburgh,pa': [-79.99, 40.44], 'cincinnati,oh': [-84.51, 39.1],
  'orlando,fl': [-81.38, 28.54], 'salt lake city,ut': [-111.89, 40.76], 'huntsville,al': [-86.59, 34.73],
  'grand rapids,mi': [-85.67, 42.96], 'knoxville,tn': [-83.92, 35.96], 'sarasota,fl': [-82.5, 27.3],
  'clearwater,fl': [-82.8, 27.97], 'columbia,sc': [-81.03, 34.0], 'columbia,mo': [-92.33, 38.95],
  'springfield,mo': [-93.29, 37.21], 'jackson,ms': [-90.18, 32.3], 'chattanooga,tn': [-85.31, 35.04],
  'little rock,ar': [-92.29, 34.75], 'birmingham,al': [-86.8, 33.52], 'des moines,ia': [-93.62, 41.6],
  'boise,id': [-116.2, 43.62], 'richmond,va': [-77.46, 37.55], 'fargo,nd': [-96.79, 46.88],
  'sioux falls,sd': [-96.73, 43.54], 'amarillo,tx': [-101.83, 35.22], 'lubbock,tx': [-101.85, 33.58],
  'winston-salem,nc': [-80.24, 36.1], 'greensboro,nc': [-79.79, 36.07], 'durham,nc': [-78.9, 35.99],
  'norfolk,va': [-76.29, 36.89], 'lincoln,ne': [-96.67, 40.81], 'madison,wi': [-89.4, 43.07],
}

function getCoordsForSpecimen(city, state) {
  const key = `${city.toLowerCase().trim()},${state.toLowerCase().trim()}`
  if (CITY_COORDS[key]) return CITY_COORDS[key]
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

const TREE_COLORS = {
  integrity: { primary: '#00e676', dim: 'rgba(0,230,118,0.15)', label: 'INTEGRITY' },
  amerilife: { primary: '#40c4ff', dim: 'rgba(64,196,255,0.15)', label: 'AMERILIFE' },
  sms:       { primary: '#ffd740', dim: 'rgba(255,215,64,0.15)', label: 'SMS' },
  other:     { primary: '#ff6d00', dim: 'rgba(255,109,0,0.15)', label: 'OTHER' },
}

const C = {
  black: '#0a0a09', dark: '#0e0d0c', card: '#121110',
  border: 'rgba(0,230,118,0.12)', borderLight: 'rgba(0,230,118,0.25)',
  white: '#f0ede8', muted: '#5a5a55', green: '#00e676',
  orange: '#ff5500',
}

function getStateColor(specimens, stateAbbr) {
  const n = specimens.filter(s => s.state?.toUpperCase() === stateAbbr).length
  if (n === 0) return '#0d0d0b'
  if (n >= 5) return 'rgba(0,230,118,0.18)'
  if (n >= 3) return 'rgba(0,230,118,0.11)'
  return 'rgba(0,230,118,0.06)'
}

export default function AnathemaPublicMap() {
  const [specimens, setSpecimens] = useState([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState(null)
  const [active, setActive] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState([-96, 38])
  const [treeFilter, setTreeFilter] = useState('all')

  useEffect(() => {
    fetch('/api/specimens/public')
      .then(r => r.json())
      .then(data => {
        const withCoords = (data.specimens || []).map(s => ({
          ...s,
          coords: getCoordsForSpecimen(s.city || '', s.state || ''),
        }))
        setSpecimens(withCoords)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = treeFilter === 'all'
    ? specimens
    : specimens.filter(s => s.confirmed_tree === treeFilter)

  const treeCounts = specimens.reduce((acc, s) => {
    acc[s.confirmed_tree] = (acc[s.confirmed_tree] || 0) + 1
    return acc
  }, {})

  const statesHit = new Set(specimens.map(s => s.state?.toUpperCase()).filter(Boolean)).size

  return (
    <div style={{ background: C.black, minHeight: '100vh', color: C.white }}>
      <PageNav />

      {/* ── HERO HEADER ── */}
      <section style={{ padding: '64px 40px 40px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.green, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'pulse 2s ease infinite' }} />
          Live Field Intelligence · Community Logged
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 7vw, 80px)', letterSpacing: 2, lineHeight: 0.95, marginBottom: 16 }}>
              ANATHEMA<span style={{ color: C.green }}>.</span><br />INFECTION MAP
            </h1>
            <p style={{ fontSize: 15, color: C.muted, maxWidth: 500, lineHeight: 1.7, fontWeight: 300 }}>
              Every dot is a confirmed agent affiliation logged by a Recruiterrr user in the field. As recruiters scan and confirm agents, the map builds itself — a live picture of who owns what territory.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 32, flexShrink: 0 }}>
            {[
              { v: loading ? '—' : specimens.length, l: 'Confirmed Agents' },
              { v: loading ? '—' : statesHit, l: 'States Mapped' },
              { v: loading ? '—' : Object.keys(treeCounts).length, l: 'Strains Identified' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: C.green, letterSpacing: 1 }}>{s.v}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 1, textTransform: 'uppercase' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAP ── */}
      <section style={{ position: 'relative', height: '60vh', borderBottom: `1px solid ${C.border}` }}>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
          .spec-dot { cursor: pointer; }
          .spec-dot:hover { filter: brightness(1.6); }
        `}</style>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "'DM Mono', monospace", fontSize: 12, color: C.muted, letterSpacing: 2 }}>
            <span style={{ marginRight: 10, animation: 'pulse 1s infinite' }}>◈</span>
            LOADING FIELD DATA...
          </div>
        ) : (
          <ComposableMap projection="geoAlbersUsa" style={{ width: '100%', height: '100%' }}>
            <ZoomableGroup center={center} zoom={zoom} onMoveEnd={({ zoom: z, coordinates }) => { setZoom(z); setCenter(coordinates) }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const fips = geo.id?.toString().padStart(2, '0')
                    const abbr = FIPS[fips] || ''
                    const n = specimens.filter(s => s.state?.toUpperCase() === abbr).length
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getStateColor(specimens, abbr)}
                        stroke={n > 0 ? 'rgba(0,230,118,0.18)' : 'rgba(0,230,118,0.05)'}
                        strokeWidth={n > 0 ? 0.7 : 0.3}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: n > 0 ? 'rgba(0,230,118,0.28)' : '#141412' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>

              {filtered.map(s => {
                const col = TREE_COLORS[s.confirmed_tree] || TREE_COLORS.other
                const isActive = active?.id === s.id
                return (
                  <Marker key={s.id} coordinates={s.coords}>
                    <circle r={9 / zoom} fill="none" stroke={col.primary} strokeWidth={0.6 / zoom} opacity={0.2} style={{ pointerEvents: 'none' }} />
                    <circle
                      className="spec-dot"
                      r={isActive ? 6 / zoom : 4 / zoom}
                      fill={col.primary}
                      stroke={isActive ? C.white : col.primary}
                      strokeWidth={isActive ? 1.5 / zoom : 0.5 / zoom}
                      opacity={isActive ? 1 : 0.8}
                      onClick={() => setActive(isActive ? null : s)}
                      onMouseEnter={() => setTooltip(s)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  </Marker>
                )
              })}
            </ZoomableGroup>
          </ComposableMap>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: C.card, border: `1px solid ${TREE_COLORS[tooltip.confirmed_tree]?.primary || C.green}`,
            padding: '8px 14px', fontFamily: "'DM Mono', monospace", fontSize: 10,
            color: C.white, letterSpacing: 0.5, pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: TREE_COLORS[tooltip.confirmed_tree]?.primary || C.green, marginRight: 8 }}>◈</span>
            {tooltip.agent_name} · {tooltip.city}, {tooltip.state}
            <span style={{ color: TREE_COLORS[tooltip.confirmed_tree]?.primary || C.green, marginLeft: 10, fontSize: 9 }}>
              {TREE_COLORS[tooltip.confirmed_tree]?.label}
            </span>
          </div>
        )}

        {/* Active specimen callout */}
        {active && (
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            background: C.card, border: `1px solid ${TREE_COLORS[active.confirmed_tree]?.primary || C.green}`,
            padding: '14px 20px', minWidth: 280, animation: 'fadeIn 0.15s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: TREE_COLORS[active.confirmed_tree]?.primary || C.green, letterSpacing: 2, marginBottom: 4 }}>
                  ● CONFIRMED · {TREE_COLORS[active.confirmed_tree]?.label}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1.5, marginBottom: 2 }}>{active.agent_name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted }}>
                  {active.city}, {active.state}
                  {active.confirmed_sub_imo && <span> · {active.confirmed_sub_imo}</span>}
                </div>
              </div>
              <button onClick={() => setActive(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>✕</button>
            </div>
          </div>
        )}

        {/* Zoom */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[{ label: '+', delta: 0.5 }, { label: '−', delta: -0.5 }, { label: '⌂', reset: true }].map(btn => (
            <button key={btn.label}
              onClick={() => btn.reset ? (setZoom(1), setCenter([-96, 38])) : setZoom(z => Math.min(8, Math.max(1, z + btn.delta)))}
              style={{ width: 32, height: 32, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontFamily: "'DM Mono', monospace", fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >{btn.label}</button>
          ))}
        </div>

        {/* Empty overlay */}
        {!loading && specimens.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'rgba(0,230,118,0.1)', letterSpacing: 3, marginBottom: 8 }}>MAP POPULATES AS USERS LOG OBSERVATIONS</div>
          </div>
        )}
      </section>

      {/* ── STRAIN BREAKDOWN ── */}
      <section style={{ padding: '40px 40px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>
          Confirmed by Strain
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {['all', ...Object.keys(TREE_COLORS)].map(t => (
            <button
              key={t}
              onClick={() => setTreeFilter(t === treeFilter ? 'all' : t)}
              style={{
                padding: '6px 14px',
                background: treeFilter === t ? (TREE_COLORS[t]?.dim || 'rgba(0,230,118,0.1)') : 'transparent',
                border: `1px solid ${treeFilter === t ? (TREE_COLORS[t]?.primary || C.green) : '#2a2a28'}`,
                color: treeFilter === t ? (TREE_COLORS[t]?.primary || C.green) : C.muted,
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2,
                cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.1s',
              }}
            >
              {t === 'all' ? `ALL · ${specimens.length}` : `${TREE_COLORS[t].label} · ${treeCounts[t] || 0}`}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
          {Object.entries(TREE_COLORS).map(([key, val]) => {
            const count = treeCounts[key] || 0
            const pct = specimens.length ? Math.round((count / specimens.length) * 100) : 0
            return (
              <div key={key} style={{ background: C.card, border: `1px solid ${C.border}`, padding: '20px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: val.primary, letterSpacing: 2 }}>{val.label}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: val.primary, letterSpacing: 1 }}>{count}</div>
                </div>
                <div style={{ height: 3, background: '#1a1a18', position: 'relative', marginBottom: 8 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: val.primary, opacity: 0.7, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: 1 }}>
                  {pct}% OF ALL CONFIRMED AGENTS
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '64px 40px' }}>
        <div style={{ maxWidth: 600 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.green, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
            Want to build your own map?
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: 2, lineHeight: 1, marginBottom: 16 }}>
            EVERY AGENT YOU SCAN<br />GETS PLOTTED ON YOUR<span style={{ color: C.green }}> MAP.</span>
          </h2>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
            ANATHEMA gives you a private infection map of every agent you've confirmed. Search a market, scan the agents, log what you find — and watch the map fill in with field-verified intelligence no one else has.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/sign-up" style={{ padding: '14px 36px', background: C.green, color: C.black, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, textDecoration: 'none', display: 'inline-block' }}>
              START MAPPING →
            </Link>
            <Link href="/dashboard/search" style={{ padding: '14px 36px', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, textDecoration: 'none', display: 'inline-block' }}>
              SEE THE TOOL
            </Link>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  )
}
