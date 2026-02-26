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

  // Prometheus — live (retooled)
  { status: 'live', label: 'Prometheus — FMO & IMO competitive intelligence scanner' },
  { status: 'live', label: 'Prometheus — Auto-discovers FMO website from name alone' },
  { status: 'live', label: 'Prometheus — Crawls up to 9 pages per FMO (agents, carriers, trips, leads, tech)' },
  { status: 'live', label: 'Prometheus — Incentive trip intel (2025 / 2026 destinations and thresholds)' },
  { status: 'live', label: 'Prometheus — Carrier stack extraction and gap analysis' },
  { status: 'live', label: 'Prometheus — Agent complaint and weak point detection via SERP' },
  { status: 'live', label: 'Prometheus — Custom counter-pitch script built from FMO vulnerabilities' },
  { status: 'live', label: 'Prometheus — Scan history saved to dashboard' },

  // ANATHEMA — live
  { status: 'live', label: 'ANATHEMA — Distribution tree prediction (Integrity / AmeriLife / SMS)' },
  { status: 'live', label: 'ANATHEMA — 4-tier signal stack (carrier fingerprint, language, web intel, Facebook)' },
  { status: 'live', label: 'ANATHEMA — Infection staging (Stage I through Stage IV)' },
  { status: 'live', label: 'ANATHEMA — Field observation logging and specimen database' },
  { status: 'live', label: 'ANATHEMA — Direct scan tool at /dashboard/anathema' },
  { status: 'live', label: 'ANATHEMA — Specimen history saved to dashboard' },

  // Platform — live
  { status: 'live', label: 'Invite-only access control' },
  { status: 'live', label: 'Per-account rate limiting on all tools' },
  { status: 'live', label: 'Account data isolated and protected per user' },

  // Up next
  { status: 'next', label: 'Saved agent lists and pipeline tracking' },
  { status: 'next', label: 'Filter agents by score, flag, and carrier type' },
  { status: 'next', label: 'Direct dialer integration (one-click call)' },
  { status: 'next', label: 'Email template generator per agent type' },
  { status: 'next', label: 'ANATHEMA — Accuracy reporting as specimen database grows' },
  { status: 'next', label: 'Prometheus — PDF export of FMO intel briefing' },

  // Planned
  { status: 'later', label: 'NIPR license database integration' },
  { status: 'later', label: 'Multi-user team accounts' },
  { status: 'later', label: 'Market comparison reports (city vs city)' },
  { status: 'later', label: 'CRM sync (HubSpot, Salesforce)' },
  { status: 'later', label: 'ANATHEMA — Predictive recruiting score based on tree + stage' },
  { status: 'later', label: 'Prometheus — FMO watchlist with automatic re-scans on changes' },
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
