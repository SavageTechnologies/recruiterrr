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
      href={`/dashboard/search?id=${s.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 60px 60px 60px 120px',
        gap: 16, padding: '13px 14px',
        borderTop: '1px solid var(--border)',
        textDecoration: 'none',
        borderRadius: 'var(--radius)',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-1)' }}>
        {s.city}, {s.state}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--text-1)', lineHeight: 1.2 }}>
        {s.results_count}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--sig-green)', lineHeight: 1.2 }}>
        {s.hot_count}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--sig-yellow)', lineHeight: 1.2 }}>
        {s.warm_count}
      </div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--text-3)', lineHeight: 1.2 }}>
        {s.cold_count}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-3)', alignSelf: 'center' }}>
        {new Date(s.created_at).toLocaleDateString()}
      </div>
    </Link>
  )
}
