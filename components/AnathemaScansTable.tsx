'use client'

import Link from 'next/link'
import { useState } from 'react'

type Specimen = {
  id: string
  agent_name: string
  city: string
  state: string
  predicted_tree: string
  predicted_confidence: number
  confirmed_tree: string | null
  created_at: string
}

const TREE_LABELS: Record<string, string> = {
  integrity: 'INTEGRITY',
  amerilife: 'AMERILIFE',
  sms: 'SMS',
  unknown: 'UNCLASSIFIED',
}

function getStage(confidence: number, tree: string): string {
  if (tree === 'unknown' || confidence < 35) return '—'
  if (confidence >= 80) return 'IV'
  if (confidence >= 55) return 'III'
  if (confidence >= 35) return 'II'
  return 'I'
}

export default function AnathemaScansTable({ specimens }: { specimens: Specimen[] }) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 5
  const totalPages = Math.ceil(specimens.length / PAGE_SIZE)
  const visible = specimens.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  if (!specimens.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#2a2a2a', marginBottom: 12 }}>
          NO SPECIMENS YET
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
          Run an ANATHEMA scan on any agent to identify their distribution tree.
        </div>
        <Link href="/dashboard/anathema" style={{ padding: '12px 32px', background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block' }}>
          Run a Scan
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 100px 110px', gap: 16, padding: '8px 16px', marginBottom: 4, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
        <div>Agent / Agency</div>
        <div>Strain</div>
        <div>Stage</div>
        <div>Confirmed</div>
        <div>Date</div>
      </div>

      {visible.map(specimen => {
        const tree = specimen.predicted_tree || 'unknown'
        const treeLabel = TREE_LABELS[tree] || 'UNCLASSIFIED'
        const stage = getStage(specimen.predicted_confidence || 0, tree)
        const isConfirmed = !!specimen.confirmed_tree
        const confirmedMatch = specimen.confirmed_tree === specimen.predicted_tree

        return (
          <div
            key={specimen.id}
            style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 100px 110px', gap: 16, padding: '14px 16px', background: '#0e0d0c', border: '1px solid rgba(0,230,118,0.1)', marginBottom: 2, transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.1)')}
          >
            <div style={{ alignSelf: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--white)' }}>{specimen.agent_name}</div>
              {(specimen.city || specimen.state) && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 2 }}>
                  {[specimen.city, specimen.state].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: tree !== 'unknown' ? 'var(--green)' : '#444', letterSpacing: 1, alignSelf: 'center' }}>
              {treeLabel}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: tree !== 'unknown' ? 'rgba(0,230,118,0.5)' : '#222', lineHeight: 1, alignSelf: 'center' }}>
              {stage}
            </div>
            <div style={{ alignSelf: 'center' }}>
              {isConfirmed ? (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 8px', border: `1px solid ${confirmedMatch ? 'var(--green)' : 'var(--yellow)'}`, color: confirmedMatch ? 'var(--green)' : 'var(--yellow)', letterSpacing: 1 }}>
                  {confirmedMatch ? '✓ MATCH' : '~ CORRECTED'}
                </span>
              ) : (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1 }}>
                  UNLOGGED
                </span>
              )}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, alignSelf: 'center' }}>
              {new Date(specimen.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        )
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '0 4px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, specimens.length)} of {specimens.length}
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
                style={{ padding: '6px 12px', background: i === page ? 'var(--green)' : 'transparent', border: `1px solid ${i === page ? 'var(--green)' : 'var(--border)'}`, color: i === page ? 'var(--black)' : 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}
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
