'use client'

import Link from 'next/link'

type Search = {
  id: string
  city: string
  state: string
  results_count: number
  hot_count: number
  warm_count: number
  cold_count: number
  created_at: string
}

export default function SearchRow({ s }: { s: Search }) {
  return (
    <Link
      href={`/dashboard/search?city=${encodeURIComponent(s.city)}&state=${s.state}`}
      style={{
        display: 'grid', gridTemplateColumns: '1fr 80px 60px 60px 60px 120px',
        gap: 16, padding: '14px 16px',
        borderTop: '1px solid var(--border)',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#1a1814')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>
        {s.city}, {s.state}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--white)' }}>
        {s.results_count}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--green)' }}>
        {s.hot_count}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'var(--yellow)' }}>
        {s.warm_count}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#555' }}>
        {s.cold_count}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
        {new Date(s.created_at).toLocaleDateString()}
      </div>
    </Link>
  )
}
