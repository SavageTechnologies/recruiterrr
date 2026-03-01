import Link from 'next/link'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'

const LIVE = [
  { label: 'Agent Search & AI Scoring', desc: 'Real-time intelligence on every independent producer in any US market.' },
  { label: 'Prometheus', desc: 'FMO & IMO competitive intelligence. Know their carriers, trips, weak points, and how to beat them.' },
  { label: 'ANATHEMA', desc: 'Distribution tree prediction. Know who an agent truly belongs to before you ever make contact.' },
  { label: 'DAVID', desc: 'Agentic recruiting outreach. Researches agents and builds personalized messaging automatically.' },
]

const MARKETS = [
  { label: 'Life & Final Expense' },
  { label: 'ACA / Marketplace' },
  { label: 'Annuities' },
  { label: 'Financial Advisors' },
]

const NEXT = [
  { label: 'Saved agent lists & pipeline tracking' },
  { label: 'CRM sync — HubSpot, Salesforce' },
  { label: 'NIPR license database integration' },
  { label: 'Multi-user team accounts' },
]

export default function RoadmapPage() {
  return (
    <div style={{ maxWidth: 760, padding: '80px 40px' }}>
      <PageHeader label="Roadmap" title="WHERE WE'RE" accent="HEADED." />
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 1, marginBottom: 64 }}>updated as we ship.</p>

      {/* ── LIVE ── */}
      <div style={{ marginBottom: 64 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Live Now</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {LIVE.map(item => (
            <Card key={item.label} padding="24px 28px" style={{ borderLeft: '3px solid var(--green)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)', letterSpacing: 1, marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{item.desc}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── MARKETS ── */}
      <div style={{ marginBottom: 64 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Expanding Into</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {MARKETS.map(item => (
            <Card key={item.label} padding="20px 28px" style={{ borderLeft: '3px solid var(--border)' }}>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>{item.label}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── UP NEXT ── */}
      <div style={{ marginBottom: 64 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Up Next</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NEXT.map(item => (
            <Card key={item.label} padding="20px 28px" style={{ borderLeft: '3px solid var(--border)' }}>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>{item.label}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <Card padding="28px 32px">
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>REQUEST A FEATURE</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>Have something specific you need? We're building this for you.</div>
        <Link href="/contact" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, color: 'var(--orange)', textDecoration: 'none' }}>REACH OUT →</Link>
      </Card>
    </div>
  )
}
