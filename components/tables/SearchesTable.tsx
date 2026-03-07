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
  const PAGE_SIZE  = 5
  const totalPages = Math.ceil(searches.length / PAGE_SIZE)
  const visible    = searches.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  if (!searches.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 40,
          color: 'var(--text-4)', marginBottom: 10,
        }}>
          NO SEARCHES YET
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginBottom: 20 }}>
          Run your first market search to see results here.
        </div>
        <Link href="/dashboard/search" style={{
          padding: '10px 28px', background: 'transparent',
          border: '1px solid var(--orange)', borderRadius: 'var(--radius)',
          color: 'var(--orange)', fontFamily: "'DM Mono', monospace",
          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
          textDecoration: 'none', display: 'inline-block',
        }}
        >
          Search Now →
        </Link>
      </div>
    )
  }

  // Build windowed page list: always show first, last, and ±2 around current
  const pageButtons: (number | 'ellipsis')[] = []
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || (i >= page - 2 && i <= page + 2)) {
      pageButtons.push(i)
    } else if (pageButtons[pageButtons.length - 1] !== 'ellipsis') {
      pageButtons.push('ellipsis')
    }
  }

  return (
    <div>
      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 80px 60px 60px 60px 120px',
        gap: 16, padding: '6px 14px 10px',
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase',
      }}>
        <div>Market</div>
        <div>Agents</div>
        <div style={{ color: 'var(--sig-green)' }}>Hot</div>
        <div style={{ color: 'var(--sig-yellow)' }}>Warm</div>
        <div>Pass</div>
        <div>Date</div>
      </div>

      {visible.map(s => <SearchRow key={s.id} s={s} />)}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginTop: 12, padding: '0 4px',
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            color: 'var(--text-3)', letterSpacing: 1, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, searches.length)} of {searches.length}
          </div>

          <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'nowrap' }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: '6px 14px', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                color: page === 0 ? 'var(--text-4)' : 'var(--text-2)',
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1,
                cursor: page === 0 ? 'not-allowed' : 'pointer',
              }}
            >← PREV</button>

            {pageButtons.map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`e${idx}`} style={{ color: 'var(--text-4)', fontSize: 10, padding: '0 2px' }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '6px 12px',
                    background: p === page ? 'var(--orange)' : 'transparent',
                    border: `1px solid ${p === page ? 'var(--orange)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    color: p === page ? 'white' : 'var(--text-2)',
                    fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1,
                    cursor: 'pointer',
                  }}
                >{p + 1}</button>
              )
            )}

            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{
                padding: '6px 14px', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                color: page === totalPages - 1 ? 'var(--text-4)' : 'var(--text-2)',
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1,
                cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
              }}
            >NEXT →</button>
          </div>
        </div>
      )}
    </div>
  )
}
