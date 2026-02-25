import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

const ITEMS = [
  // Agent Search — live
  { status: 'live', label: 'Agent search across any US market' },
  { status: 'live', label: 'AI recruitability scoring (HOT / WARM / COLD)' },
  { status: 'live', label: 'Website crawling and carrier identification' },
  { status: 'live', label: 'Job posting enrichment (Hiring badge)' },
  { status: 'live', label: 'YouTube presence detection' },
  { status: 'live', label: 'Adjustable result limits (10 / 20 / 30 / 40 / 50)' },
  { status: 'live', label: 'Search history saved to dashboard' },
  { status: 'live', label: 'US coverage map showing search history by state' },

  // Prometheus — live
  { status: 'live', label: 'Prometheus — TCPA compliance scanning for lead vendors' },
  { status: 'live', label: 'Prometheus — Vendor tier classification (Enterprise / Established / Unknown / Suspicious)' },
  { status: 'live', label: 'Prometheus — 7-point compliance scoring with confidence score' },
  { status: 'live', label: 'Prometheus — External reputation intelligence (complaints, lawsuits, BBB)' },
  { status: 'live', label: 'Prometheus — Ready-to-use TCPA disclaimer and vendor demand language' },
  { status: 'live', label: 'Prometheus — Scan history saved to dashboard' },

  // Platform — live
  { status: 'live', label: 'Invite-only access control' },
  { status: 'live', label: 'Per-account rate limiting on all tools' },
  { status: 'live', label: 'Account data isolated and protected per user' },

  // Up next
  { status: 'next', label: 'CSV export of agent results' },
  { status: 'next', label: 'Saved agent lists and pipeline tracking' },
  { status: 'next', label: 'Filter by score, flag, and carrier type' },
  { status: 'next', label: 'Direct dialer integration (one-click call)' },
  { status: 'next', label: 'Email template generator per agent type' },
  { status: 'next', label: 'Prometheus — PDF compliance report export' },

  // Planned
  { status: 'later', label: 'NIPR license database integration (Phase 2)' },
  { status: 'later', label: 'Multi-user team accounts' },
  { status: 'later', label: 'Market comparison reports (city vs city)' },
  { status: 'later', label: 'Line-specific scoring (ACA, life, Medicare, senior)' },
  { status: 'later', label: 'CRM sync (HubSpot, Salesforce)' },
  { status: 'later', label: 'Prometheus — Vendor watchlist with automatic re-scans' },
  { status: 'later', label: 'Prometheus — Scan history search and filtering' },
]

const STATUS = {
  live: { label: 'LIVE', color: 'var(--green)' },
  next: { label: 'UP NEXT', color: 'var(--orange)' },
  later: { label: 'PLANNED', color: '#333' },
}

export default function RoadmapPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      <div style={{ maxWidth: 760, padding: '80px 40px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Roadmap</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, marginBottom: 12, color: 'var(--white)' }}>
          WHERE WE'RE<br /><span style={{ color: 'var(--orange)' }}>HEADED.</span>
        </h1>
        <p style={{ fontSize: 14, color: '#333', fontFamily: "'DM Mono', monospace", letterSpacing: 1, marginBottom: 48 }}>updated as we ship.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ITEMS.map((item, i) => {
            const s = STATUS[item.status as keyof typeof STATUS]
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'var(--card)', border: '1px solid var(--border)', padding: '18px 24px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '3px 8px', border: `1px solid ${s.color}`, color: s.color, letterSpacing: 1, minWidth: 60, textAlign: 'center', flexShrink: 0 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 14, color: item.status === 'live' ? 'var(--white)' : item.status === 'next' ? 'var(--muted)' : '#333' }}>
                  {item.label}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 48, padding: '28px 32px', border: '1px solid var(--border)', background: 'var(--card)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>REQUEST A FEATURE</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>Have something specific you need? We're building this for you.</div>
          <Link href="/contact" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, color: 'var(--orange)', textDecoration: 'none' }}>REACH OUT →</Link>
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
