'use client'

import { useState } from 'react'

type Scan = {
  id: string
  domain: string
  score: number
  verdict: string
  fmo_size?: string
  vendor_tier: string
  actively_recruiting?: boolean
  has_contacts?: boolean
  contacts?: Array<{ name: string; title: string }>
  is_shared_lead: boolean
  pages_scanned?: string[]
  created_at: string
}

export default function PrometheusScansTable({
  scans,
  onSelect,
}: {
  scans: Scan[]
  onSelect: (id: string, domain: string) => void
}) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10
  const totalPages = Math.ceil(scans.length / PAGE_SIZE)
  const visible = scans.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  if (!scans.length) {
    return (
      <div style={{ padding: '24px 0' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#333' }}>
          No scans yet — run your first FMO above.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px 80px 110px', gap: 12, padding: '8px 16px', marginBottom: 4, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
        <div>FMO / IMO</div>
        <div>Size</div>
        <div>Tree</div>
        <div>Hiring</div>
        <div>Contacts</div>
        <div>Date</div>
      </div>

      {visible.map((scan: Scan) => {
        const size = scan.fmo_size || scan.verdict || '—'
        const sizeColor = size === 'LARGE' ? 'var(--orange)' : size === 'MID-SIZE' ? 'var(--yellow)' : 'var(--muted)'
        const treeRaw = scan.vendor_tier || '—'
        const treeShort = treeRaw.length > 12 ? treeRaw.slice(0, 10) + '...' : treeRaw
        const contactCount = Array.isArray(scan.contacts) ? scan.contacts.length : (scan.has_contacts ? 1 : 0)
        const topContact = Array.isArray(scan.contacts) && scan.contacts.length > 0 ? scan.contacts[0] : null

        return (
          <div
            key={scan.id}
            onClick={() => onSelect(scan.id, scan.domain)}
            style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px 80px 110px', gap: 12, padding: '14px 16px', background: 'var(--dark)', border: '1px solid var(--border)', marginBottom: 2, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = 'var(--orange)')}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: topContact ? 3 : 0 }}>
                {scan.domain}
              </div>
              {topContact && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {topContact.name} · {topContact.title}
                </div>
              )}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: sizeColor, letterSpacing: 1, alignSelf: 'center' }}>
              {size}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 1, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {treeShort}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, alignSelf: 'center' }}>
              {scan.actively_recruiting
                ? <span style={{ color: 'var(--green)' }}>YES</span>
                : <span style={{ color: '#333' }}>NO</span>
              }
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, alignSelf: 'center', color: contactCount > 0 ? 'var(--orange)' : '#333' }}>
              {contactCount > 0 ? `${contactCount} found` : '—'}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, alignSelf: 'center' }}>
              {new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        )
      })}

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
              PREV
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', color: page === totalPages - 1 ? '#333' : 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1, cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer' }}
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
