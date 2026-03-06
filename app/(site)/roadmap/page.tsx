import Link from 'next/link'

const LIVE = [
  { label: 'Agent Search & AI Scoring', desc: 'Real-time intelligence on every independent producer in any US market.' },
  { label: 'Prometheus',                desc: 'FMO & IMO competitive intelligence. Know their carriers, trips, weak points, and how to beat them.' },
  { label: 'ANATHEMA',                  desc: 'Distribution tree prediction. Know who an agent truly belongs to before you ever make contact.' },
  { label: 'DAVID',                     desc: 'Agentic recruiting outreach. Researches agents and builds personalized messaging automatically.' },
]

const MARKETS = [
  'Life & Final Expense',
  'ACA / Marketplace',
  'Annuities',
  'Financial Advisors',
]

const NEXT = [
  'Saved agent lists & pipeline tracking',
  'CRM sync — HubSpot, Salesforce',
  'NIPR license database integration',
  'Multi-user team accounts',
]

export default function RoadmapPage() {
  return (
    <>
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange">Roadmap</div>
          <h1 className="site-h1">WHERE WE&apos;RE<br /><span>HEADED.</span></h1>
          <p className="site-lead" style={{ maxWidth: 460 }}>Updated as we ship. No vaporware.</p>
        </div>
      </section>

      {/* LIVE NOW */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow" style={{ color: 'var(--site-green)', marginBottom: 20 }}>Live Now</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 760, marginBottom: 64 }}>
            {LIVE.map((item, i) => (
              <div key={item.label} style={{
                padding: '24px 28px',
                background: 'var(--site-white)',
                border: '1px solid var(--site-border)',
                borderLeft: '3px solid var(--site-green)',
                borderRadius: i === 0 ? '6px 6px 0 0' : i === LIVE.length - 1 ? '0 0 6px 6px' : 0,
                marginTop: i === 0 ? 0 : -1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="site-tool-tag">LIVE</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--site-ink)' }}>{item.label}</span>
                </div>
                <p className="site-body">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* UP NEXT */}
          <div className="site-eyebrow" style={{ marginBottom: 20 }}>Up Next</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 760, marginBottom: 64 }}>
            {NEXT.map((item, i) => (
              <div key={item} style={{
                padding: '20px 28px',
                background: 'var(--site-paper)',
                border: '1px solid var(--site-border)',
                borderLeft: '3px solid var(--site-border-2)',
                borderRadius: i === 0 ? '6px 6px 0 0' : i === NEXT.length - 1 ? '0 0 6px 6px' : 0,
                marginTop: i === 0 ? 0 : -1,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 9, color: 'var(--site-orange)' }}>✦</span>
                <span className="site-body" style={{ fontSize: 14, color: 'var(--site-ink-2)' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* EXPANDING INTO */}
          <div className="site-eyebrow" style={{ marginBottom: 20 }}>Expanding Into</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 760, marginBottom: 64 }}>
            {MARKETS.map(m => (
              <span key={m} style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1.5,
                padding: '8px 16px', border: '1px solid var(--site-border)',
                borderRadius: 'var(--radius)', color: 'var(--site-ink-3)',
                background: 'var(--site-white)', textTransform: 'uppercase',
              }}>{m}</span>
            ))}
          </div>

          {/* CTA */}
          <div className="site-card" style={{ padding: '32px 28px', maxWidth: 760 }}>
            <div className="site-label" style={{ marginBottom: 10 }}>Request a feature</div>
            <p className="site-body" style={{ marginBottom: 20 }}>Have something specific you need? We&apos;re building this for you.</p>
            <Link href="/contact" className="site-btn-ghost">Reach Out →</Link>
          </div>
        </div>
      </section>
    </>
  )
}
