'use client'

type Props = {
  stateCounts: Record<string, number>
}

const STATE_PATHS: Record<string, { d: string; label?: [number, number] }> = {
  AL: { d: "M 520 340 L 530 340 L 535 380 L 525 395 L 515 390 L 510 360 Z" },
  AK: { d: "M 100 420 L 140 410 L 150 430 L 130 450 L 100 445 Z" },
  AZ: { d: "M 155 295 L 195 295 L 195 350 L 155 350 Z" },
  AR: { d: "M 480 315 L 515 315 L 515 345 L 480 345 Z" },
  CA: { d: "M 100 230 L 140 220 L 155 270 L 145 320 L 110 310 L 95 270 Z" },
  CO: { d: "M 230 255 L 285 255 L 285 295 L 230 295 Z" },
  CT: { d: "M 620 195 L 632 195 L 632 210 L 620 210 Z" },
  DE: { d: "M 605 215 L 613 215 L 613 228 L 605 228 Z" },
  FL: { d: "M 525 370 L 565 370 L 570 400 L 545 420 L 525 405 Z" },
  GA: { d: "M 530 335 L 560 335 L 560 375 L 530 375 Z" },
  HI: { d: "M 190 440 L 215 435 L 218 445 L 193 450 Z" },
  ID: { d: "M 165 175 L 195 170 L 200 225 L 175 230 L 160 210 Z" },
  IL: { d: "M 490 245 L 510 245 L 515 295 L 490 295 Z" },
  IN: { d: "M 515 245 L 535 245 L 535 285 L 515 285 Z" },
  IA: { d: "M 445 230 L 490 230 L 490 260 L 445 260 Z" },
  KS: { d: "M 345 280 L 410 280 L 410 310 L 345 310 Z" },
  KY: { d: "M 515 280 L 565 275 L 568 300 L 515 305 Z" },
  LA: { d: "M 465 355 L 510 355 L 513 385 L 480 390 L 462 375 Z" },
  ME: { d: "M 645 155 L 660 150 L 665 175 L 648 178 Z" },
  MD: { d: "M 590 230 L 620 225 L 622 242 L 592 245 Z" },
  MA: { d: "M 625 185 L 655 182 L 657 197 L 625 200 Z" },
  MI: { d: "M 510 195 L 545 190 L 548 225 L 525 230 L 510 215 Z" },
  MN: { d: "M 430 170 L 475 165 L 478 220 L 430 220 Z" },
  MS: { d: "M 495 330 L 520 330 L 522 375 L 496 378 Z" },
  MO: { d: "M 445 275 L 495 270 L 498 315 L 445 318 Z" },
  MT: { d: "M 195 155 L 290 150 L 292 200 L 195 205 Z" },
  NE: { d: "M 340 245 L 415 242 L 417 278 L 340 280 Z" },
  NV: { d: "M 130 225 L 165 218 L 168 285 L 140 295 L 128 265 Z" },
  NH: { d: "M 635 168 L 645 165 L 647 192 L 635 192 Z" },
  NJ: { d: "M 608 208 L 620 205 L 622 228 L 608 230 Z" },
  NM: { d: "M 225 300 L 270 300 L 270 345 L 225 345 Z" },
  NY: { d: "M 575 185 L 625 178 L 628 215 L 575 218 Z" },
  NC: { d: "M 555 290 L 610 285 L 612 308 L 555 312 Z" },
  ND: { d: "M 335 165 L 410 162 L 412 195 L 335 198 Z" },
  OH: { d: "M 535 240 L 570 238 L 572 275 L 535 278 Z" },
  OK: { d: "M 340 315 L 415 312 L 418 345 L 340 348 Z" },
  OR: { d: "M 120 185 L 170 178 L 172 225 L 120 228 Z" },
  PA: { d: "M 565 210 L 615 207 L 617 235 L 565 238 Z" },
  RI: { d: "M 638 197 L 645 197 L 645 208 L 638 208 Z" },
  SC: { d: "M 555 308 L 590 305 L 592 332 L 555 335 Z" },
  SD: { d: "M 335 198 L 410 195 L 412 232 L 335 235 Z" },
  TN: { d: "M 500 305 L 558 300 L 560 322 L 500 325 Z" },
  TX: { d: "M 300 320 L 415 315 L 420 400 L 355 415 L 295 385 Z" },
  UT: { d: "M 195 255 L 235 252 L 237 300 L 195 302 Z" },
  VT: { d: "M 625 168 L 636 165 L 638 190 L 625 192 Z" },
  VA: { d: "M 555 260 L 610 255 L 612 285 L 555 288 Z" },
  WA: { d: "M 120 150 L 172 145 L 174 182 L 120 185 Z" },
  WV: { d: "M 553 252 L 580 248 L 582 278 L 553 280 Z" },
  WI: { d: "M 465 185 L 505 182 L 507 228 L 465 230 Z" },
  WY: { d: "M 230 205 L 295 202 L 297 252 L 230 255 Z" },
  DC: { d: "M 596 238 L 602 236 L 603 242 L 597 243 Z" },
}

const STATE_ABBREVIATIONS = Object.keys(STATE_PATHS)

export default function USMap({ stateCounts }: Props) {
  const maxCount = Math.max(...Object.values(stateCounts), 1)

  function getColor(state: string) {
    const count = stateCounts[state] || 0
    if (count === 0) return '#1e1e1e'
    const intensity = count / maxCount
    if (intensity > 0.7) return '#ff5500'
    if (intensity > 0.4) return '#cc4400'
    if (intensity > 0.1) return '#883300'
    return '#441800'
  }

  function getStroke(state: string) {
    const count = stateCounts[state] || 0
    return count > 0 ? '#ff5500' : '#2a2a2a'
  }

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox="80 140 620 310"
        style={{ width: '100%', height: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {STATE_ABBREVIATIONS.map(state => (
          <g key={state}>
            <path
              d={STATE_PATHS[state].d}
              fill={getColor(state)}
              stroke={getStroke(state)}
              strokeWidth={stateCounts[state] ? 1.5 : 0.5}
              style={{ transition: 'fill 0.3s' }}
            >
              <title>{state}{stateCounts[state] ? ` — ${stateCounts[state]} search${stateCounts[state] > 1 ? 'es' : ''}` : ''}</title>
            </path>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24, marginTop: 16,
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, background: '#1e1e1e', border: '1px solid #2a2a2a' }} />
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
