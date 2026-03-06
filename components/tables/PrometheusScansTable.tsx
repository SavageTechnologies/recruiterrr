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
      <div style={{ padding: '24px 0', fontSize: 13, color: 'var(--text-3)' }}>
        No scans yet — run your first FMO above.
      </div>
    )
  }

  return (
    <div>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 110px 70px 90px 110px',
        gap: 12, padding: '8px 16px', marginBottom: 4,
        fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        <div>FMO / IMO</div>
        <div>Size</div>
        <div>Tree</div>
        <div>Hiring</div>
        <div>Contacts</div>
        <div>Date</div>
      </div>

      {visible.map((scan: Scan) => {
        const size = scan.fmo_size || scan.verdict || '—'
        const sizeColor = size === 'LARGE' ? 'var(--orange)' : size === 'MID-SIZE' ? 'var(--sig-yellow)' : 'var(--text-3)'
        const treeRaw   = scan.vendor_tier || '—'
        const treeShort = treeRaw.length > 14 ? treeRaw.slice(0, 12) + '...' : treeRaw
        const contactCount = Array.isArray(scan.contacts) ? scan.contacts.length : (scan.has_contacts ? 1 : 0)
        const topContact   = Array.isArray(scan.contacts) && scan.contacts.length > 0 ? scan.contacts[0] : null

        return (
          <div
            key={scan.id}
            onClick={() => onSelect(scan.id, scan.domain)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 110px 70px 90px 110px',
              gap: 12, padding: '14px 16px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              marginBottom: 4, cursor: 'pointer', transition: 'border-color 0.12s',
              borderRadius: 'var(--radius)',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: topContact ? 3 : 0 }}>
                {scan.domain}
              </div>
              {topContact && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {topContact.name} · {topContact.title}
                </div>
              )}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: sizeColor, letterSpacing: 0.5, alignSelf: 'center', fontWeight: 600 }}>
              {size}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {treeShort}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, alignSelf: 'center' }}>
              {scan.actively_recruiting
                ? <span style={{ color: 'var(--sig-green)' }}>YES</span>
                : <span style={{ color: 'var(--text-4)' }}>NO</span>
              }
            </div>
            <div style={{ fontSize: 12, alignSelf: 'center', color: contactCount > 0 ? 'var(--orange)' : 'var(--text-4)', fontWeight: contactCount > 0 ? 600 : 400 }}>
              {contactCount > 0 ? `${contactCount} found` : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', alignSelf: 'center' }}>
              {new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        )
      })}

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, padding: '0 4px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, scans.length)} of {scans.length}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost"
              style={{ fontSize: 12, opacity: page === 0 ? 0.4 : 1 }}
            >← Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="btn-ghost"
              style={{ fontSize: 12, opacity: page === totalPages - 1 ? 0.4 : 1 }}
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
