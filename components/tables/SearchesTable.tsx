'use client'

import Link from 'next/link'
import { useState } from 'react'
import SearchRow from './SearchRow'

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

export default function SearchesTable({ searches }: { searches: Search[] }) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 5
  const totalPages = Math.ceil(searches.length / PAGE_SIZE)
  const visible = searches.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  if (!searches.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#2a2a2a', marginBottom: 12 }}>
          NO SEARCHES YET
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
          Run your first market search to see results here.
        </div>
        <Link href="/dashboard/search" style={{ padding: '12px 32px', background: 'transparent', border: '1px solid var(--orange)', color: 'var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block' }}>
          Search Now
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 60px 60px 120px', gap: 16, padding: '8px 16px', marginBottom: 4, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
        <div>Market</div>
        <div>Agents</div>
        <div style={{ color: 'var(--green)' }}>Hot</div>
        <div style={{ color: 'var(--yellow)' }}>Warm</div>
        <div style={{ color: '#555' }}>Cold</div>
        <div>Date</div>
      </div>

      {visible.map(s => (
        <SearchRow key={s.id} s={s} />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '0 4px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, searches.length)} of {searches.length}
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', color: page === 0 ? '#333' : 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
            >
              ← PREV
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                style={{ padding: '6px 12px', background: i === page ? 'var(--orange)' : 'transparent', border: `1px solid ${i === page ? 'var(--orange)' : 'var(--border)'}`, color: i === page ? 'var(--black)' : 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', color: page === totalPages - 1 ? '#333' : 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1, cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer' }}
            >
              NEXT →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
