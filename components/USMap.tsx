'use client'

import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

const FIPS_TO_STATE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY',
}

type Props = {
  stateCounts: Record<string, number>
}

export default function USMap({ stateCounts }: Props) {
  const maxCount = Math.max(...Object.values(stateCounts), 1)

  function getColor(stateAbbr: string) {
    const count = stateCounts[stateAbbr] || 0
    if (count === 0) return '#1e1b18'
    const intensity = count / maxCount
    if (intensity > 0.7) return '#ff5500'
    if (intensity > 0.4) return '#cc4400'
    if (intensity > 0.1) return '#883300'
    return '#441800'
  }

  function getStrokeColor(stateAbbr: string) {
    return stateCounts[stateAbbr] ? '#ff5500' : '#2e2b27'
  }

  return (
    <div style={{ width: '100%' }}>
      <ComposableMap
        projection="geoAlbersUsa"
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fips = geo.id?.toString().padStart(2, '0')
              const stateAbbr = FIPS_TO_STATE[fips] || ''
              const count = stateCounts[stateAbbr] || 0

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getColor(stateAbbr)}
                  stroke={getStrokeColor(stateAbbr)}
                  strokeWidth={count > 0 ? 1.5 : 0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: count > 0 ? '#ff6a1a' : '#252220' },
                    pressed: { outline: 'none' },
                  }}
                >
                  <title>
                    {stateAbbr}{count > 0 ? ` — ${count} search${count > 1 ? 'es' : ''}` : ''}
                  </title>
                </Geography>
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24, marginTop: 12,
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, background: '#1e1b18', border: '1px solid #2e2b27' }} />
          Not searched
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, background: '#441800' }} />
          1 search
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, background: '#883300' }} />
          A few
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, background: '#ff5500' }} />
          Heavy activity
        </div>
      </div>
    </div>
  )
}
