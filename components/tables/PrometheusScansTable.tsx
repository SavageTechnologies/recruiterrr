'use client'

import Link from 'next/link'
import { useState } from 'react'

type Scan = {
  id: string
  domain: string
  score: number
  verdict: string
  vendor_tier: string
  is_shared_lead: boolean
  created_at: string
}

export default function PrometheusScansTable({ scans }: { scans: Scan[] }) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 5
  const totalPages = Math.ceil(scans.length / PAGE_SIZE)
  const visible = scans.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  if (!scans.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#2a2a2a', marginBottom: 12 }}>
          NO SCANS YET
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
          Run Prometheus on any FMO or IMO to get a full competitive briefing.
        </div>
        <Link href="/dashboard/prometheus" style={{ padding: '12px 32px', background: 'transparent', border: '1px solid var(--orange)', color: 'var(--orange)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block' }}>
          Run Intel
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px 110px 120px', gap: 16, padding: '8px 16px', marginBottom: 4, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
        <div>FMO / IMO</div>
        <div>Size</div>
        <div>Confidence</div>
        <div>Tree</div>
        <div>Date</div>
      </div>

      {visible.map(scan => {
        const sizeColor = scan.verdict === 'LARGE' ? 'var(--orange)' : scan.verdict === 'MID-SIZE' ? 'var(--yellow)' : 'var(--muted)'
        const confColor = scan.score >= 75 ? 'var(--green)' : scan.score >= 45 ? 'var(--yellow)' : 'var(--muted)'
        // Truncate long tree affiliation text
        const treeRaw = scan.vendor_tier || '—'
        const treeShort = treeRaw.length > 12 ? treeRaw.slice(0, 10) + '…' : treeRaw

        return (
          <Link
            key={scan.id}
            href={`/dashboard/prometheus?id=${scan.id}`}
            style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px 110px 120px', gap: 16, padding: '14px 16px', background: 'var(--dark)', border: '1px solid var(--border)', marginBottom: 2, textDecoration: 'none', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--orange)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--white)', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {scan.domain}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: sizeColor, letterSpacing: 1, alignSelf: 'center' }}>
              {scan.verdict || '—'}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: confColor, lineHeight: 1, alignSelf: 'center' }}>
              {scan.score}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 1, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {treeShort}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, alignSelf: 'center' }}>
              {new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </Link>
        )
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '0 4px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, scans.length)} of {scans.length}
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
